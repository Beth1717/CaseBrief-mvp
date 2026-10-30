#!/usr/bin/env python3
"""Verify the exact October 30 archive, then exercise CaseBrief's actual adapter.
No vendor files are committed; extraction/results live in a disposable directory.
"""
import hashlib,json,os,signal,socket,stat,subprocess,sys,tempfile,time,zipfile
from pathlib import Path,PurePosixPath
from urllib.request import urlopen
ROOT=Path(__file__).resolve().parents[1]
PIN='35c87ae0c92a9b48fe8d77d1d638620470f46c796885957f495284fad87a8476'
def verify(archive):
    assert hashlib.sha256(archive.read_bytes()).hexdigest()==PIN,'Unrecognized archive digest; review a new release before changing the pin'
    with zipfile.ZipFile(archive) as z:
        entries=z.infolist();names=[e.filename for e in entries]
        assert len(names)==len(set(names)),'Duplicate archive paths'
        assert sum(e.file_size for e in entries)<20*1024*1024,'Unexpected archive size'
        for e in entries:
            p=PurePosixPath(e.filename)
            assert not p.is_absolute() and '..' not in p.parts and '\\' not in e.filename,'Unsafe archive path'
            assert not stat.S_ISLNK(e.external_attr>>16),'Archive symlink'
        manifest=json.loads(z.read('PACKAGE_MANIFEST.json'))
        assert manifest['fileCount']==len(manifest['files'])==908
        expected={e['path'] for e in manifest['files']}
        assert len(expected)==908 and expected|{'PACKAGE_MANIFEST.json'}==set(names)
        for e in manifest['files']:
            content=z.read(e['path'])
            assert len(content)==e['bytes'] and hashlib.sha256(content).hexdigest()==e['sha256'],e['path']
        for name in ['record-consistency-request.schema.json','record-consistency-response.schema.json']:
            assert z.read('working-release/schemas/'+name)==(ROOT/'integration/runtime-contract-v2/schemas'/name).read_bytes(),'Schema drift'
        print('PASS immutable archive, 908 file hashes, safe paths and exact CaseBrief schema match',flush=True)
        return z.read('VERSION_MANIFEST.json')
def main():
    if len(sys.argv)!=2:raise SystemExit('Usage: python3 scripts/qualify-umg-package.py /path/to/October30.zip')
    archive=Path(sys.argv[1]).resolve();manifest=json.loads(verify(archive))
    with tempfile.TemporaryDirectory(prefix='casebrief-umg-integration-') as td:
        root=Path(td)
        with zipfile.ZipFile(archive) as z:z.extractall(root)
        with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
        service=root/'working-release/framework-replay/casebrief_umg_local_framework_service.py'
        log=open(root/'runtime.log','w')
        proc=subprocess.Popen([sys.executable,str(service),'--host','127.0.0.1','--port',str(port)],cwd=root/'working-release',stdout=log,stderr=subprocess.STDOUT,start_new_session=(os.name!='nt'))
        try:
            until=time.monotonic()+90
            while time.monotonic()<until:
                if proc.poll() is not None:raise RuntimeError('Runtime failed to start')
                try:
                    with urlopen(f'http://127.0.0.1:{port}/ready',timeout=2) as response:ready=json.load(response)
                    if ready['status']=='READY' and ready['realNeoUMGCompilerExecution'] is True:break
                except (OSError,ValueError,KeyError):time.sleep(.1)
            else:raise TimeoutError('Runtime readiness deadline')
            env=os.environ.copy();env['CASEBRIEF_UMG_TEST_ENDPOINT']=f'http://127.0.0.1:{port}/v0.1/record-consistency'
            subprocess.run(['node','integration/tests/umg-live-package.cjs'],cwd=ROOT,env=env,check=True,timeout=180)
            print(json.dumps({'packageSha256':PIN,'wrapperSha256':manifest['release']['workingServiceSha256'],'contractRevision':2,'result':'PASS','scope':'synthetic local; no model or production approval'},indent=2))
        finally:
            if proc.poll() is None:
                if os.name!='nt':os.killpg(proc.pid,signal.SIGTERM)
                else:proc.terminate()
            try:proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                if os.name!='nt':os.killpg(proc.pid,signal.SIGKILL)
                else:proc.kill()
                proc.wait()
            log.close()
if __name__=='__main__':main()

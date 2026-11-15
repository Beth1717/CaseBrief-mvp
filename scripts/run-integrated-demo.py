#!/usr/bin/env python3
"""Verify the owner-supplied packages and run the local synthetic integration.
Vendor code stays outside git. No remote listener or model is enabled.
"""
import argparse, hashlib, importlib.util, json, os, socket, stat, subprocess, sys, tempfile, time, zipfile
from pathlib import Path, PurePosixPath
from urllib.request import urlopen
ROOT = Path(__file__).resolve().parents[1]
DELTA = '359a14ee5eeb60358330f752cacd87209ad00967cf03e2d9e04854fe074a78d5'
REPORT_EXCEPTIONS = {
    'working-release/framework-replay/FAILURE_FALLBACK_TEST_RESULTS.json': 'd540ffbab28f58e278952f83595fe89b5c1ce74b47327184a1ae3a1d9a91cf2c',
    'working-release/framework-replay/WORKER_LIFETIME_TEST_RESULTS.json': None,
}
def digest(data): return hashlib.sha256(data).hexdigest()
def require(ok, message):
    if not ok: raise ValueError(message)
def prepare(base, delta, root):
    spec = importlib.util.spec_from_file_location('qualification', ROOT/'scripts/qualify-umg-package.py')
    qualification = importlib.util.module_from_spec(spec); spec.loader.exec_module(qualification)
    qualification.verify(base)
    require(digest(delta.read_bytes()) == DELTA, 'Unsupported delta archive')
    with zipfile.ZipFile(base) as z: z.extractall(root)
    with zipfile.ZipFile(delta) as z:
        names = z.namelist()
        require(len(names) == len(set(names)), 'Duplicate delta paths')
        require(sum(e.file_size for e in z.infolist()) < 20*1024*1024, 'Oversized delta')
        for e in z.infolist():
            p = PurePosixPath(e.filename)
            require(not p.is_absolute() and '..' not in p.parts and '\\' not in e.filename and not stat.S_ISLNK(e.external_attr>>16), 'Unsafe delta path')
        manifest = json.loads(z.read('SUPPORTED_RELEASE_MANIFEST.json'))
        require(digest(z.read('MERGED_SHA256SUMS.txt')) == manifest['mergedSha256ListSha256'], 'Merged manifest digest mismatch')
        for n in names:
            if n.startswith('overlay/') and not n.endswith('/'):
                target = root/PurePosixPath(n).relative_to('overlay')
                target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(z.read(n))
        for entry in manifest['overlayFiles']:
            data = (root/entry['path']).read_bytes()
            require(len(data) == entry['bytes'] and digest(data) == entry['sha256'], 'Runtime overlay mismatch: '+entry['path'])
        differences = []
        for line in z.read('MERGED_SHA256SUMS.txt').decode().splitlines():
            if not line.strip(): continue
            expected, name = line.split(maxsplit=1); name = name.strip().lstrip('*')
            target = root/name
            actual = digest(target.read_bytes()) if target.exists() else None
            if actual != expected:
                require(name in REPORT_EXCEPTIONS and actual == REPORT_EXCEPTIONS[name], 'Unexpected merged content: '+name)
                differences.append({'path':name,'expected':expected,'actual':actual})
        require({d['path'] for d in differences} == set(REPORT_EXCEPTIONS), 'Report discrepancies changed; inspect the package')
        print(json.dumps({'runtimeIntegrity':'PASS','mergedManifest':'TWO_KNOWN_REPORT_DISCREPANCIES','reportDiscrepancies':differences}), flush=True)
        return manifest

def free_port():
    with socket.socket() as s: s.bind(('127.0.0.1',0)); return s.getsockname()[1]
def stop(p):
    if p and p.poll() is None:
        p.terminate()
        try: p.wait(timeout=5)
        except subprocess.TimeoutExpired: p.kill(); p.wait()
def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--base', required=True, type=Path); ap.add_argument('--delta', required=True, type=Path)
    ap.add_argument('--test', action='store_true', help='Run the actual adapter and durable review tests, then exit')
    ap.add_argument('--browser', action='store_true', help='Also run the Chromium UI regression (requires --test)')
    args=ap.parse_args()
    require(not args.browser or args.test, '--browser requires --test')
    require(os.environ.get('CASEBRIEF_REPLIT_PREVIEW') != '1', 'This launcher is local-only')
    with tempfile.TemporaryDirectory(prefix='casebrief-integrated-') as temp:
        root=Path(temp); prepare(args.base.resolve(),args.delta.resolve(),root)
        service=None; app=None
        try:
            port=free_port(); endpoint=f'http://127.0.0.1:{port}/v0.1/record-consistency'
            service=subprocess.Popen([sys.executable,'-u',str(root/'working-release/framework-replay/casebrief_umg_local_framework_service.py'),'--port',str(port)],cwd=root)
            deadline=time.monotonic()+35
            while True:
                require(service.poll() is None, 'UMG service exited')
                try:
                    with urlopen(f'http://127.0.0.1:{port}/ready',timeout=1) as r: ready=json.load(r)
                    break
                except OSError:
                    if time.monotonic()>=deadline: raise TimeoutError('UMG readiness deadline')
                    time.sleep(.1)
            require(ready['status']=='READY' and ready['realFrameworkExecution'] and ready['realNeoUMGCompilerExecution'] and ready['dispatchCount']==0 and ready['effectsEnabled'] is False, 'UMG not ready')
            env=os.environ.copy(); env['CASEBRIEF_UMG_ENDPOINT']=endpoint
            if args.test:
                subprocess.run(['node','analysis/tests/live-umg.cjs'],cwd=ROOT,env=env,check=True,timeout=120)
                if args.browser:
                    subprocess.run(['node','analysis/tests/browser.cjs'],cwd=ROOT,env=env,check=True,timeout=180)
                print('PASS actual UMG adapter, persisted review, restart recovery and source invalidation; browser='+('PASS' if args.browser else 'NOT_RUN'),flush=True)
            else:
                env.pop('CASEBRIEF_OLLAMA_MODEL',None)
                app=subprocess.Popen(['node','analysis/server.cjs'],cwd=ROOT,env=env)
                print('Open http://127.0.0.1:'+env.get('PORT',env.get('CASEBRIEF_ANALYSIS_PORT','8780'))+'/ — fictional documents only. Ctrl+C stops both services.',flush=True)
                app.wait()
        finally: stop(app); stop(service)
if __name__=='__main__':
    try: main()
    except KeyboardInterrupt: pass

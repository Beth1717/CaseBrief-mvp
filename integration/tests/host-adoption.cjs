const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');

function boot(){
  const elements=new Map();
  const get=id=>{
    if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',hidden:false,classList:{toggle(){}},focus(){},before(){},click(){},appendChild(){}});
    return elements.get(id);
  };
  const memory=new Map();
  const context={
    structuredClone,
    crypto:webcrypto,
    console,
    Blob,
    URL,
    setTimeout,
    clearTimeout,
    setInterval(){},
    localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},
    sessionStorage:{getItem(){return null},setItem(){}},
    document:{
      body:{classList:{toggle(){}},appendChild(){}},
      getElementById:get,
      querySelector:s=>s==='[role=dialog] button'?get('dialogButton'):s==='.layout'?get('layout'):null,
      querySelectorAll:()=>[],
      createElement:()=>get('created'),
      addEventListener(){},
      activeElement:null
    },
    window:{addEventListener(){}}
  };
  vm.createContext(context);
  const html=fs.readFileSync('index.html','utf8');
  const sources=[...html.matchAll(/<script src="([^"]+)"/g)].map(match=>match[1].split("?")[0]);
  for(const src of ['seed.js','security.js','core.js','views-system.js']){
    if(!sources.includes(src))throw new Error('required host script missing: '+src);
    vm.runInContext(fs.readFileSync(src,'utf8'),context,{filename:src});
  }
  const controls=fs.readFileSync('integration/host-controls.js','utf8');
  vm.runInContext(controls,context);
  vm.runInContext('installCaseBriefHostControls(globalThis)',context);
  return {context,get,run:s=>vm.runInContext(s,context)};
}

const probes=[];
function probe(name,fn){
  try{fn();probes.push({name,ok:true});console.log(`PASS ${name}`)}
  catch(err){probes.push({name,ok:false,error:err.message});console.error(`FAIL ${name}: ${err.message}`)}
}
function expect(condition,message){if(!condition)throw new Error(message)}

probe('1 baseline supported contradiction remains visible',()=>{
  const {run,get}=boot();
  run("runConsistency()");
  expect(get('runner').innerHTML.includes('contradiction'),'known supported contradiction was not surfaced');
});

probe('2 unsupported assertion is rejected or quarantined',()=>{
  const {run,get}=boot();
  run(`data.issues.push({
    id:'probe-unsupported-1',
    category:'unsupported_assertion',
    severity:'high',
    weight:1,
    status:'open',
    statement:'Synthetic adversarial assertion with citation-looking metadata but no trusted support.',
    why:'probe',
    sources:['doc-NOT-TRUSTED']
  })`);
  run("runConsistency()");
  expect(!get('runner').innerHTML.includes('Synthetic adversarial assertion'),'untrusted assertion was accepted into consistency output');
});

probe('3 wrong-matter actor is denied',()=>{
  const {run}=boot();
  expect(run("data.matter.id")==='matter-001','fixture did not start in matter-001');
  run("switchCase('matter-002')");
  expect(run("data.matter.id")==='matter-001','actor crossed into matter-002 without authorization denial');
});

probe('4 missing expected record remains visible without inventory/finding row',()=>{
  const {run,get}=boot();
  run("data.issues=data.issues.filter(x=>x.id!=='i3')");
  run("runConsistency()");
  expect(get('runner').innerHTML.includes('BC-1841-A'),'expected body-camera concern disappeared when the missing-evidence issue row was removed');
});

const failed=probes.filter(x=>!x.ok);
console.log(`\nHost-adoption result: ${probes.length-failed.length}/${probes.length} probes passed.`);
if(failed.length){
  console.error('Baseline is not yet safe for UMG host adoption. Apply remediation without changing these probes, then rerun.');
  process.exitCode=1;
}else{
  console.log('All four host-adoption probes passed. Capture this output with the exact commit SHA and remediation package hash.');
}

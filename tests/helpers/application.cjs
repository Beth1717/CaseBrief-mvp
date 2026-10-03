const fs = require('node:fs');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');

// Actual application scripts with a minimal DOM; not a production authorization harness.
module.exports = function bootApplication(appState) {
  const elements = new Map(), memory = new Map(), session = new Map();
  const classList = {toggle(){}, add(){}, remove(){}, contains(){return false}};
  const get = id => {
    if (!elements.has(id)) elements.set(id, {innerHTML:'', textContent:'', value:'',
      classList, hidden:false, isConnected:true, focus(){}, before(){}, appendChild(){}, click(){}});
    return elements.get(id);
  };
  const storage = map => ({getItem:k=>map.get(k)??null, setItem:(k,v)=>map.set(k,String(v)), removeItem:k=>map.delete(k)});
  if (appState) memory.set('casebrief_workspace_v3', JSON.stringify({version:3,
    active:appState.matter.id, cases:{[appState.matter.id]:appState}, events:[]}));
  const context = {structuredClone, crypto:webcrypto, console, Blob, URL,
    setTimeout(){}, clearTimeout(){}, setInterval(){}, clearInterval(){}, alert(){},
    navigator:{clipboard:{writeText:async()=>{}}},
    localStorage:storage(memory), sessionStorage:storage(session),
    document:{body:{classList,appendChild(){}},getElementById:get,
      querySelector:s=>s==='.layout'?get('layout'):s==='[role=dialog] button'?get('dialogButton'):null,
      querySelectorAll:()=>[],createElement:()=>get('created'),addEventListener(){},activeElement:null},
    window:{addEventListener(){}}};
  vm.createContext(context);
  const sources = [...fs.readFileSync('index.html','utf8').matchAll(/<script src="([^"]+)"/g)]
    .map(m=>m[1].split('?')[0]);
  for (const file of sources) vm.runInContext(fs.readFileSync(file,'utf8'), context, {filename:file});
  return {run:code=>vm.runInContext(code,context),get,stored:()=>memory.get('casebrief_workspace_v3')};
};

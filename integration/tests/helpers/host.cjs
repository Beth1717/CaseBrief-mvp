const fs = require('node:fs');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');

module.exports = function boot({persisted, transformScript = (_, source) => source} = {}) {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, {innerHTML:'', textContent:'', value:'', hidden:false,
      classList:{toggle(){}}, focus(){}, before(){}, click(){}, appendChild(){}});
    return elements.get(id);
  };
  const memory = new Map();
  const context = {
    name:'casebrief-guarded', structuredClone, crypto:webcrypto, console, Blob, URL, setTimeout, clearTimeout,
    setInterval(){},
    localStorage:{getItem:key=>memory.get(key)??null, setItem:(key,value)=>memory.set(key,String(value))},
    sessionStorage:{getItem(){return null},setItem(){}},
    document:{body:{classList:{toggle(){}},appendChild(){}},getElementById:get,
      querySelector:selector=>selector==='.layout'?get('layout'):null, querySelectorAll:()=>[],
      createElement:()=>get('created'),addEventListener(){},activeElement:null},
    window:{addEventListener(){}}
  };
  vm.createContext(context);
  const run = source => vm.runInContext(source, context);
  for (const file of ['seed.js','security.js','core.js','views-system.js','integration/host-controls.js']) {
    vm.runInContext(transformScript(file, fs.readFileSync(file,'utf8')), context, {filename:file});
    // Use the actual host key, then read/write the same map on every operation.
    if (file === 'seed.js' && persisted !== undefined) memory.set(run('STORE'), persisted);
  }
  if (!run('initializeGuardedAdoption()')) throw new Error('Test host startup blocked');
  return {run, context, get, stored:()=>memory.get(run('STORE'))};
};

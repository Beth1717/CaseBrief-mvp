const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765');
 await page.evaluate(()=>{workspace.active='matter-002';localStorage.setItem(STORE,JSON.stringify(workspace))});
 await page.addInitScript(()=>{
  globalThis.renderedMatters=[];
  const descriptor=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
  Object.defineProperty(Element.prototype,'innerHTML',{...descriptor,set(value){
   if(this.id==='app')globalThis.renderedMatters.push(globalThis.caseBriefHostApi?.data?.matter?.id);
   descriptor.set.call(this,value);
  }});
 });
 await page.goto('http://127.0.0.1:8765/integration/umg-host-adoption.html');
 await page.getByText('guarded host controls active',{exact:true}).waitFor();
 const frame=page.frames().find(f=>f.url().endsWith('/index.html'));
 const result=await frame.evaluate(()=>({active:data.matter.id,actor:caseBriefHostApi.actor.id,rendered:renderedMatters,events:workspace.events}));
 assert.equal(result.actor,'demo-reviewer');assert.equal(result.active,'matter-001');
 assert.ok(result.rendered.length);assert.ok(result.rendered.every(id=>id==='matter-001'));
 assert.ok(result.events.some(e=>e.action==='access.denied'&&e.matterId==='matter-002'));
 assert.ok(result.events.some(e=>e.action==='access.fallback'&&e.details.authority==='CaseBrief'));
 const blocked=await frame.evaluate(()=>{showView('umg');data=workspace.cases['matter-002'];return runConsistency()});
 assert.equal(blocked.status,'blocked');
 assert.deepEqual(errors,[]);
 console.log('PASS browser persisted matter-002 never rendered or active; audited CaseBrief fallback; pre-analysis tampering blocked; no page errors');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

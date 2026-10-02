const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright');
const fixture = require('../integration/fixtures/idaho-pretrial.json');
(async()=>{
 const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].find(fs.existsSync);
 const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765');
  await page.evaluate(state=>{
   localStorage.clear();sessionStorage.clear();
   localStorage.setItem('casebrief_workspace_v3',JSON.stringify({version:3,active:state.matter.id,cases:{[state.matter.id]:state},events:[]}));
  },fixture.appState);
  await page.reload();
  await page.getByRole('button',{name:'Open demo workspace'}).click();
  await page.getByRole('heading',{name:'CRI pending — Insufficient data'}).waitFor();
  assert.doesNotMatch(await page.locator('#app').innerText(), /Aug 26|100%/);
  await page.getByRole('button',{name:'Open records',exact:true}).click();
  await page.getByRole('button',{name:'SYNTHETIC — NOT A REAL CASE: Camera transcript',exact:true}).click();
  assert.match(await page.locator('#detailRoot').innerText(),/21:09:30/);
  await page.evaluate(()=>{closeDetail();activeSecurityProfile='investigator';showView('documents')});
  assert.doesNotMatch(await page.locator('#app').innerText(),/Internal strategy note/);
  const response=await page.evaluate(()=>simulateAI('Full case narrative'));
  assert.ok(!response.sources.includes('S06'));
  assert.doesNotMatch(response.text,/Internal strategy note|BC-1841-A|Jordan Hale/);
  await page.evaluate(()=>{activeSecurityProfile='attorney';showView('drafting');document.getElementById('draftType').value='motion_to_suppress';generateDraft({preventDefault(){}})});
  assert.equal(await page.evaluate(()=>data.drafts.length),0);
  assert.equal(await page.evaluate(()=>workspace.events.some(e=>e.action==='draft.blocked')),true);
  await page.reload();
  assert.equal(await page.evaluate(()=>data.matter.id),'SYN-ID-PRETRIAL-001');
  assert.deepEqual(errors,[]);
  console.log('PASS browser Idaho fixture: source drawer, pending CRI, absent inherited deadline, role-filtered records/preview, blocked drafts, persistence, no page errors.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

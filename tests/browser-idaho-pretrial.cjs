const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright');
const fixture = require('../integration/fixtures/idaho-pretrial.json');
(async()=>{
 const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].find(fs.existsSync);
 const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 try{
  const page=await browser.newPage({hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765');
  await page.evaluate(state=>{
   localStorage.clear();sessionStorage.clear();
   localStorage.setItem('casebrief_workspace_v3',JSON.stringify({version:3,active:state.matter.id,cases:{[state.matter.id]:state},events:[]}));
  },fixture.appState);
  await page.reload();
  await page.getByRole('button',{name:'Open demo workspace'}).click();
  await page.getByRole('heading',{name:'Case Readiness Index: 63%'}).waitFor();
  assert.doesNotMatch(await page.locator('#app').innerText(), /Aug 26|100%/);
  await page.locator('.orb').hover();await page.waitForTimeout(250);
  assert.equal(await page.locator('.crihover').evaluate(el=>getComputedStyle(el).opacity),'1');
  assert.match(await page.locator('.crihover').innerText(),/measures operational readiness/);
  assert.equal(await page.locator('.orbscore').evaluate(el=>getComputedStyle(el).opacity),'1');
  await page.mouse.move(0,0);await page.keyboard.press('Tab');await page.locator('.orb').focus();await page.waitForTimeout(250);
  assert.equal(await page.locator('.crihover').evaluate(el=>getComputedStyle(el).opacity),'1');
  await page.keyboard.press('Enter');
  await page.getByRole('heading',{name:'Case Readiness Index (CRI)'}).waitFor();
  assert.match(await page.locator('#detailRoot').innerText(),/Record completeness|Work control|Attention control/);
  await page.evaluate(()=>closeDetail());
  await page.setViewportSize({width:390,height:844});
  await page.locator('.orb').tap();
  await page.getByRole('heading',{name:'Case Readiness Index (CRI)'}).waitFor();
  await page.evaluate(()=>closeDetail());
  await page.locator('.orb').hover();await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);


  await page.getByRole('button',{name:'Open review queue'}).click();
  const reviewText=await page.locator('#app').innerText();
  assert.match(reviewText,/different search\/consent sequencing/i);
  assert.match(reviewText,/AI identifies\. Human decides/i);

  await page.evaluate(()=>showView('documents'));
  await page.getByRole('button',{name:'SYNTHETIC — NOT A REAL CASE: Camera transcript',exact:true}).click();
  assert.match(await page.locator('#detailRoot').innerText(),/21:09:30/);

  await page.evaluate(()=>{closeDetail();activeSecurityProfile='investigator';showView('documents')});
  assert.doesNotMatch(await page.locator('#app').innerText(),/Restricted attorney work note/);
  const response=await page.evaluate(()=>simulateAI('Full case narrative'));
  assert.ok(!response.sources.includes('S06'));

  await page.evaluate(()=>{activeSecurityProfile='client';showView('documents')});
  assert.doesNotMatch(await page.locator('#app').innerText(),/Camera transcript|Incident report/);

  await page.evaluate(()=>{
   activeSecurityProfile='attorney';
   createPilotShareGrant(['S01','S02','S03','S04','S06']);
   activeSecurityProfile='client';
   showView('documents');
  });
  const sharedText=await page.locator('#app').innerText();
  assert.match(sharedText,/Camera transcript/);
  assert.match(sharedText,/Incident report/);
  assert.doesNotMatch(sharedText,/Restricted attorney work note|Duplicate evidence inventory/);

  await page.evaluate(()=>{
   activeSecurityProfile='attorney';
   revokePilotShareGrant('browser_test');
   activeSecurityProfile='client';
   showView('documents');
  });
  assert.doesNotMatch(await page.locator('#app').innerText(),/Camera transcript|Incident report/);

  await page.evaluate(()=>{activeSecurityProfile='attorney';showView('drafting');document.getElementById('draftType').value='motion_to_suppress';generateDraft({preventDefault(){}})});
  assert.equal(await page.evaluate(()=>data.drafts.length),0);
  assert.equal(await page.evaluate(()=>workspace.events.some(e=>e.action==='draft.blocked')),true);
  assert.equal(await page.evaluate(()=>workspace.events.some(e=>e.action==='share.revoked')),true);

  await page.reload();
  assert.equal(await page.evaluate(()=>data.matter.id),'SYN-ID-PRETRIAL-001');
  assert.equal(await page.evaluate(()=>score()),63);
  assert.deepEqual(errors,[]);
  console.log('PASS browser Idaho pilot: derived findings, CRI detail, controlled source release/revocation, role filtering, blocked drafts, persistence and no page errors.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

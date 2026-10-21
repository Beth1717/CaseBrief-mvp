const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].find(fs.existsSync);
 const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/?demo=investor');
  await page.getByRole('button',{name:'Start guided investor demo',exact:true}).click();
  await page.evaluate(()=>showView('review'));
  await page.getByRole('button',{name:'Confirm',exact:true}).first().click();
  await page.locator('#decisionReason').fill('Compared source passages; timing requires investigation.');
  await page.getByRole('button',{name:'Save decision',exact:true}).click();
  await page.evaluate(()=>showView('audit'));
  await page.getByRole('button',{name:'Export review receipt',exact:true}).click();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  assert.equal(await page.evaluate(()=>workspace.events.filter(e=>e.action==='review.receipt_exported').length),0);
  await page.getByRole('button',{name:'Export review receipt',exact:true}).click();
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Confirm action',exact:true}).click();
  const download=await downloadPromise;
  const payload=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
  assert.equal(payload.syntheticOnly,true);assert.equal(payload.cri.score,63);
  assert.equal(payload.findings.find(f=>f.id==='PF-TIMING').decisions[0].auditEventIds.length,1);
  assert.ok(payload.exportEventId);
  assert.ok(payload.sources.every(s=>s.id!=='S06'));
  await page.selectOption('#securityRole','client');
  assert.equal(await page.evaluate(()=>pilotReviewReceipt()),null);
  assert.deepEqual(errors,[]);
  console.log('PASS browser review receipt: actual source-decision workflow, cancellation, JSON download, event linkage and recipient denial.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

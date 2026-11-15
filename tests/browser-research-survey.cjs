const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{
 const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].find(fs.existsSync);
 const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 try{
 const page=await browser.newPage(),errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/'))external.push(r.url())});
 await page.goto('http://127.0.0.1:8765/research/quick-survey.html');
 await page.locator('#role_period').fill('Fictional QA participant');await page.locator('#budget').fill('Unknown');
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download answers',exact:true}).click();
 const download=await pending,answers=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
 assert.equal(answers.answers.role_period,'Fictional QA participant');assert.equal(answers.answers.budget,'Unknown');assert.equal(answers.schemaVersion,'casebrief.workflow-research.v2');
 await page.getByRole('button',{name:'Clear answers',exact:true}).click();assert.equal(await page.locator('#role_period').inputValue(),'');
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS browser research survey: optional responses, explicit JSON download, clear, no external requests and mobile layout.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

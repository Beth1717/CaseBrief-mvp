const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{
 const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].find(fs.existsSync);
 const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');
 const timing=await page.evaluate(()=>{
  data.documents=Array.from({length:5000},(_,i)=>({id:'scale-'+i,title:'Fictional record '+i,type:'Synthetic',date:'2026-07-10',excerpt:'Synthetic load text '+i,reviewed:false}));
  data.documents.push({id:'privileged-canary',type:'Attorney note',title:'PRIVATE-CANARY',excerpt:'PRIVATE-CANARY'});
  activeSecurityProfile='attorney';const start=performance.now();showView('documents');return performance.now()-start;
 });
 assert.equal(await page.locator('tbody tr').count(),50);
 await page.getByRole('button',{name:'Next documents',exact:true}).click();assert.match(await page.locator('tbody').innerText(),/Fictional record 50/);
 await page.getByRole('textbox',{name:'Search permitted documents'}).fill('Fictional record 4999');assert.equal(await page.locator('tbody tr').count(),1);
 await page.getByRole('button',{name:'Fictional record 4999',exact:true}).click();assert.match(await page.locator('#detailRoot').innerText(),/Synthetic load text 4999/);await page.keyboard.press('Escape');
 await page.selectOption('#securityRole','investigator');
 await page.getByRole('textbox',{name:'Search permitted documents'}).fill('PRIVATE-CANARY');assert.doesNotMatch(await page.locator('tbody').innerText(),/PRIVATE-CANARY/);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({check:'PASS browser document library',documents:5000,rowsRendered:50,renderMs:timing,covered:'page, filter, full source drawer, restricted search and mobile'}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

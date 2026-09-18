const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  for(const mode of ['request-aborted','installation-throws','partial-installation-throws']) {
   const context=await browser.newContext();
   try {
    const page=await context.newPage();
    await page.goto('http://127.0.0.1:8765');
    await page.evaluate(()=>{workspace.active='matter-002';persist()});
    await page.route('**/integration/host-controls.js',route=>{
     if(mode==='request-aborted')return route.abort();
     let body='globalThis.installCaseBriefHostControls=()=>{throw new Error("injected installation failure")};';
     if(mode==='partial-installation-throws')body=fs.readFileSync('integration/host-controls.js','utf8')+'\nconst originalInstall=installCaseBriefHostControls;installCaseBriefHostControls=host=>{originalInstall(host);throw new Error("injected partial installation failure")};';
     return route.fulfill({contentType:'application/javascript',body});
    });
    await page.goto('http://127.0.0.1:8765/integration/umg-host-adoption.html');
    await page.getByText(/integration blocked:/).waitFor();
    const frame=page.frames().find(f=>f.url().endsWith('/index.html'));
    const result=await frame.evaluate(()=>{
     const initial=data.matter.id;
     const switchResult=switchCase('matter-002');
     const afterSwitch=data.matter.id;
     const viewResult=showView('umg');
     const analysisResult=runConsistency();
     // Also challenge render with a context assigned outside switchCase.
     data=workspace.cases['matter-002'];
     const renderResult=render();
     const unauthorizedAnalysis=runConsistency();
     const detailResult=openDetail('matter');
     const criResult=openCRI();
     const permission=requirePermission('case_view');
     return {initial,switchResult,afterSwitch,viewResult,analysisResult,renderResult,unauthorizedAnalysis,detailResult,criResult,permission,
      detail:document.getElementById('detailRoot').textContent,
      allowed:applicationAllowed(),app:document.getElementById('app').textContent,
      pickerDisabled:document.getElementById('casePicker').disabled,
      options:document.getElementById('casePicker').options.length,
      controlsInert:document.querySelector('.controls').inert,
      analysisEvents:workspace.events.filter(e=>['analysis.completed','analysis.guard_applied'].includes(e.action))};
    });
    assert.equal(result.initial,'matter-001',mode);
    assert.equal(result.switchResult,false,mode);
    assert.equal(result.afterSwitch,'matter-001',mode);
    assert.equal(result.allowed,false,mode);
    for(const key of ['viewResult','analysisResult','renderResult','unauthorizedAnalysis','detailResult','criResult'])assert.equal(result[key].status,'blocked',`${mode}/${key}`);
    assert.match(result.app,/CaseBrief blocked:/,mode);
    assert.ok(!result.app.includes('Morgan Ellis'),mode);
    assert.equal(result.detail,'',mode);
    assert.equal(result.permission,false,mode);
    assert.equal(result.pickerDisabled,true,mode);
    assert.equal(result.options,0,mode);
    assert.equal(result.controlsInert,true,mode);
    assert.deepEqual(result.analysisEvents,[],mode);
    console.log(`PASS ${mode}: mechanical block; unauthorized selection/render denied; no analysis completion`);
   } finally {await context.close()}
  }
 } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});

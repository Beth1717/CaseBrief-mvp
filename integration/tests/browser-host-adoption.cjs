const fs=require('node:fs');
const {chromium}=require('playwright');

(async()=>{
  const installedChromium=chromium.executablePath();
  const browser=await chromium.launch({
    headless:true,
    ...(fs.existsSync(installedChromium)?{executablePath:installedChromium}:{})
  });
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{localStorage.clear();sessionStorage.clear()});

  async function boot(){
    await page.goto('http://127.0.0.1:8765/integration/umg-host-adoption.html');
    await page.getByText('guarded host controls active',{exact:true}).waitFor();
    const frame=page.frames().find(candidate=>candidate.url().endsWith('/index.html'));
    if(!frame)throw new Error('CaseBrief integration frame was not available');
    return frame;
  }

  let frame=await boot();
  await frame.evaluate(()=>{showView('umg');runConsistency()});
  let output=await frame.locator('#runner').innerText();
  if(!output.includes('contradiction'))throw new Error('Probe 1: supported contradiction was not visible');
  console.log('PASS 1 browser: supported contradiction remains visible');

  frame=await boot();
  await frame.evaluate(()=>{
    data.issues=data.issues.filter(issue=>issue.id!=='probe-unsupported-1');
    data.issues.push({id:'probe-unsupported-1',category:'unsupported_assertion',severity:'high',weight:1,status:'open',statement:'Synthetic adversarial assertion with citation-looking metadata but no trusted support.',why:'probe',sources:['doc-NOT-TRUSTED']});
    showView('umg');runConsistency();
  });
  output=await frame.locator('#runner').innerText();
  if(output.includes('Synthetic adversarial assertion'))throw new Error('Probe 2: unsupported assertion reached accepted output');
  if(!/candidate findings? quarantined/.test(output))throw new Error('Probe 2: quarantine was not visible');
  console.log('PASS 2 browser: unsupported assertion is quarantined');

  frame=await boot();
  const denial=await frame.evaluate(()=>{
    const before=data.matter.id;
    const result=switchCase('matter-002');
    const event=workspace.events.find(entry=>entry.action==='access.denied'&&entry.target==='matter:matter-002');
    return {before,after:data.matter.id,result,event};
  });
  if(denial.before!=='matter-001'||denial.after!=='matter-001'||denial.result!==false)throw new Error('Probe 3: wrong-matter access was not denied');
  if(!denial.event||denial.event.outcome!=='denied'||denial.event.details.reason!=='matter_not_authorized')throw new Error('Probe 3: denial audit evidence was not recorded');
  console.log('PASS 3 browser: wrong-matter access is denied and audited');

  frame=await boot();
  const expectation=await frame.evaluate(()=>{
    data.issues=data.issues.filter(issue=>issue.id!=='i3');
    showView('umg');
    const result=runConsistency();
    const audit=workspace.events.find(entry=>entry.action==='analysis.guard_applied'&&entry.target===result.runId);
    return {html:document.getElementById('runner').innerHTML,result,audit};
  });
  if(!expectation.html.includes('BC-1841-A'))throw new Error('Probe 4: independent expectation disappeared');
  if(!expectation.audit||expectation.audit.details.expectationStates[0]?.status!=='not_provided')throw new Error('Probe 4: expectation audit evidence was not recorded');
  console.log('PASS 4 browser: missing expected record remains visible and audited');

  if(errors.length)throw new Error(errors.join('\n'));
  console.log('Browser host-adoption result: 4/4 probes passed; no page errors.');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});

const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const installedChromium=chromium.executablePath();
 const browser=await chromium.launch({
  headless:true,
  ...(fs.existsSync(installedChromium)?{executablePath:installedChromium}:{})
 });
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765');
 // Start from a clean browser state once. An init script would also clear
 // storage on the later reload that this test uses to verify persistence.
 await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
 await page.reload();
 await page.getByRole('button',{name:'Open demo workspace'}).click();
 const before=await page.evaluate(()=>score());
 await page.locator('.orb').hover();await page.waitForTimeout(250);
 const hoverOpacity=await page.locator('.crihover').evaluate(el=>getComputedStyle(el).opacity);
 if(hoverOpacity!=='1')throw Error('CRI circular hover overlay did not reveal');
 await page.getByText('potential rights violation',{exact:true}).waitFor();
 await page.locator('.orb').click();await page.getByRole('heading',{name:'Case Readiness Index (CRI)'}).waitFor();await page.keyboard.press('Escape');
 await page.evaluate(()=>openDetail('issue','rights-1'));
 await page.getByRole('button',{name:'Mark reviewed',exact:true}).click();
 await page.locator('#decisionReason').fill('Compared doc-1 and doc-8; production remains unconfirmed.');
 await page.getByRole('button',{name:'Save decision'}).click();
 if(await page.evaluate(()=>score())!==before)throw Error('Review incorrectly improves CRI');
 await page.evaluate(()=>openDetail('issue','rights-1'));
 await page.getByRole('button',{name:'Dismiss',exact:true}).click();
 await page.locator('#decisionReason').fill('Synthetic test decision with <script>unsafe</script> text.');
 await page.getByRole('button',{name:'Save decision'}).click();
 if(await page.evaluate(()=>score())!==before+8)throw Error('Dismiss did not update CRI');
 const scriptsBefore=await page.locator('script').count();
 await page.getByRole('button',{name:'Activity History',exact:true}).click();
 await page.getByText('issue.status_changed',{exact:true}).first().waitFor();
 if(await page.locator('script').count()!==scriptsBefore)throw Error('Unsafe activity rendering created executable markup');

 // Core workflows as attorney.
 await page.getByRole('button',{name:'AI Assistant',exact:true}).click();
 await page.locator('#aiPrompt').fill('What needs attention next?');
 await page.getByRole('button',{name:'Ask CaseBrief AI',exact:true}).last().click();
 await page.getByText(/Immediate attention should go to/).waitFor();
 await page.getByRole('button',{name:'Drafting Studio',exact:true}).click();
 await page.selectOption('#draftType','discovery_followup');
 await page.getByRole('button',{name:'Generate formatted draft',exact:true}).click();
 await page.getByRole('heading',{name:'Discovery Follow-Up — Draft'}).waitFor();
 await page.getByRole('button',{name:'Communications',exact:true}).click();
 await page.getByRole('heading',{name:'Client & team communications'}).waitFor();
 await page.getByRole('button',{name:'Law & Authority',exact:true}).click();
 await page.getByRole('heading',{name:'Case-linked authority'}).waitFor();
 await page.getByText('Brady v. Maryland',{exact:true}).first().waitFor();

 // Security Center and privacy/session controls.
 await page.getByRole('button',{name:'Security',exact:true}).click();
 await page.getByRole('heading',{name:'Security Center'}).waitFor();
 await page.getByRole('button',{name:'Enable privacy mode'}).click();
 await page.getByRole('heading',{name:'Privacy mode'}).waitFor();
 await page.getByRole('button',{name:'Reveal workspace'}).click();
 await page.evaluate(()=>lockSession('test'));
 await page.getByRole('heading',{name:'CaseBrief session locked'}).waitFor();
 await page.getByRole('button',{name:'Re-verify demo session'}).click();

 // Investigator may use AI but cannot retrieve privileged attorney notes.
 await page.evaluate(()=>switchSecurityProfile('investigator'));
 const inv=await page.evaluate(()=>simulateAI('What legal issues need more research?').sources);
 if(inv.includes('doc-7'))throw Error('Investigator AI retrieved privileged attorney note');
 await page.evaluate(()=>showView('documents'));
 if(await page.getByText('Defense Intake Note',{exact:true}).count())throw Error('Privileged attorney note rendered for investigator');
 await page.evaluate(()=>showView('drafting'));
 if(await page.evaluate(()=>current)==='drafting')throw Error('Investigator entered attorney drafting view');
 if(!await page.evaluate(()=>workspace.events.some(e=>e.action==='security.access_denied')))throw Error('Denied access was not audited');

 // Client cannot use AI/drafting/internal team tools, but can message lead counsel.
 await page.evaluate(()=>switchSecurityProfile('client'));
 await page.evaluate(()=>showView('communications'));
 await page.getByRole('heading',{name:'Messages with counsel'}).waitFor();
 if(await page.getByText('Luis Reyes',{exact:true}).count())throw Error('Internal investigator contact leaked to client view');
 await page.getByRole('button',{name:'Message counsel'}).click();
 await page.getByRole('heading',{name:'New matter message'}).waitFor();await page.keyboard.press('Escape');
 await page.evaluate(()=>showView('assistant'));
 if(await page.evaluate(()=>current)==='assistant')throw Error('Client entered AI workspace without permission');

 // Restore attorney and continue general regression.
 await page.evaluate(()=>switchSecurityProfile('attorney'));
 await page.getByRole('button',{name:'Court + Chronology',exact:true}).click();
 await page.getByText('Motions',{exact:true}).first().waitFor();
 await page.selectOption('#casePicker','matter-002');await page.getByRole('heading',{name:'CRI pending'}).waitFor();
 await page.selectOption('#casePicker','matter-001');await page.reload();
 if(await page.evaluate(()=>data.issues.find(x=>x.id==='rights-1').status)!=='dismissed')throw Error('State lost');
 for(const v of ['dashboard','review','timeline','evidence','witnesses','documents','authorities','assistant','drafting','communications','security','umg','audit','safeguards','survey'])await page.evaluate(v=>showView(v),v);
 await page.evaluate(()=>{showView('umg');runConsistency();showView('dashboard')});
 await page.setViewportSize({width:390,height:844});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS: case workflows plus role denial, privileged document filtering, AI source filtering, client/counsel boundaries, privacy mode, session lock, audited denials, persistence and mobile containment.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

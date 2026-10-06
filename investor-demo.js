// Investor presentation controls. All records and actions stay in this synthetic browser demo.
const INVESTOR_STEPS=Object.freeze([
 {view:'dashboard',title:'Understand the case',text:'See operational readiness and court posture together. Open the CRI ring to inspect the 40/35/25 calculation.'},
 {view:'documents',title:'Inspect the record',text:'Open the incident report and camera transcript. Review source text before treating a proposed finding as established.'},
 {view:'review',title:'Make a human decision',text:'Compare the sequencing accounts. Confirming a finding preserves the outstanding work; resolving or dismissing requires a reason.'},
 {view:'assistant',title:'Ask a focused question',text:'Ask what is missing or what needs attention. Answers use permitted synthetic sources; no live model is connected.'},
 {view:'drafting',title:'Prepare review work',text:'Generate an internal review memo with source anchors and unresolved questions. Idaho court filings remain blocked pending attorney validation.'},
 {view:'documents',title:'Control family access',text:'Open Family access to choose released sources and preview the read-only brief. The restricted attorney note cannot be released.'},
 {view:'audit',title:'Inspect the decisions',text:'Find source-review, finding-decision, memo-generation and sharing events in the matter history. Production needs a durable server audit.'}
]);
let investorStep=null;
VIEW_PERMISSIONS.presentation='case_view';
function investorActionAllowed(permission='case_view',target='presentation'){
 return applicationAllowed()&&!sessionLocked&&!privacyMode&&requirePermission(permission,target);
}
function openInvestorPilot(){
 if(!investorActionAllowed('review_decisions','demo:pilot'))return false;
 if(!workspace.cases[PILOT_MATTER_ID])workspace.cases[PILOT_MATTER_ID]=structuredClone(INVESTOR_PILOT_SEED);
 switchCase(PILOT_MATTER_ID);
 if(!isIdahoPilot())return false;
 ensurePilotFindings();save();return true;
}
function startInvestorTour(){
 if(!openInvestorPilot())return false;
 investorStep=0;showView(INVESTOR_STEPS[0].view);return true;
}
function moveInvestorTour(step){
 if(!isIdahoPilot()||!investorActionAllowed('review_decisions','demo:tour')||!Number.isInteger(step)||step<0||step>=INVESTOR_STEPS.length)return false;
 investorStep=step;closeDetail();showView(INVESTOR_STEPS[step].view);return true;
}
function endInvestorTour(){investorStep=null;render()}
function requestPilotDemoReset(){
 if(!isIdahoPilot()||!investorActionAllowed('review_decisions','demo:reset'))return false;
 confirmSensitiveAction('synthetic pilot reset','Restore the original synthetic Idaho records and remove its demo decisions, drafts, chat and share grant. Other cases and existing activity history are retained.',()=>{
  if(!isIdahoPilot()||!investorActionAllowed('review_decisions','demo:reset'))return;
  data=structuredClone(INVESTOR_PILOT_SEED);workspace.cases[PILOT_MATTER_ID]=data;
  record('demo.pilot_reset',PILOT_MATTER_ID,{syntheticOnly:true,historyRetained:true});ensurePilotFindings();save();syncPicker();closeDetail();showView('dashboard');
 });return true;
}
function investorPresentation(){
 const eligible=can('review_decisions');
 return `<section class="hero investor-intro"><div class="kicker">CaseBrief · case intelligence platform</div><h1>From scattered records<br>to reviewable decisions.</h1><p>Give defence teams one place to see the record, identify unfinished work and trace every review decision to its sources.</p><div class="row">${eligible?'<button class="btn primary" onclick="startInvestorTour()">Start guided investor demo</button><button class="btn" onclick="openInvestorPilot()">Explore Idaho pilot</button>':'<p class="callout">Select a legal reviewer demo role to begin the investor walkthrough.</p>'}</div><p class="small muted">Synthetic demonstration · browser-local controls · no real client data</p></section><div class="grid investor-overview"><div class="card c4"><div class="kicker">Record → review</div><h3>Spot what needs attention</h3><p>Source-linked sequencing conflicts, ownership gaps, duplicate records and missing expected material remain reviewable.</p></div><div class="card c4"><div class="kicker">Review → readiness</div><h3>Explain the unfinished work</h3><p>The CRI combines record completeness, work control and attention control. It measures operational readiness, not case outcome.</p></div><div class="card c4"><div class="kicker">Decision → trace</div><h3>Keep people in control</h3><p>Reason-required decisions, versioned draft edits, limited family access and matter-level history make the workflow inspectable.</p></div><div class="card c7"><h3>What you can demonstrate today</h3><ul><li>Idaho pretrial possession and search-and-seizure record review</li><li>Deterministic factual findings with source citations</li><li>Item-level CRI and human decision lifecycle</li><li>Internal review memos and controlled source release</li><li>Role filtering, case switching and recorded activity</li></ul></div><div class="card c5"><h3>Next pilot gates</h3><p>Attorney validation of findings, scoring policy and Idaho court templates; authenticated backend access; durable audit; qualified UMG deployment and provider data terms.</p><p class="muted">Time savings, legal accuracy, traction and commercial outcomes have not yet been measured.</p></div></div>`;
}
const _investorLanding=landing;
landing=function(){return _investorLanding()+`<section class="card investor-entry"><div><div class="kicker">Idaho pretrial pilot</div><h2>See the review workflow in action.</h2><p>Follow one synthetic matter from conflicting records to a reasoned human decision.</p></div><button class="btn primary" onclick="showView('presentation')">View investor walkthrough</button></section>`};
const _investorRender=render;
render=function(){
 if(!applicationAllowed())return blockApplication();
 if(current==='presentation'){
  if(!requirePermission('case_view','view:presentation'))return;
  document.getElementById('app').innerHTML=investorPresentation();updateStorageNotice();applySecurityUI();syncPrivacyShield();syncLockScreen();
 }else _investorRender();
 if(investorStep!==null&&isIdahoPilot()&&can('review_decisions')&&current!=='presentation'){
  const s=INVESTOR_STEPS[investorStep];
  document.getElementById('app').insertAdjacentHTML('afterbegin',`<section class="tour-bar" aria-label="Investor demo guide"><div class="tour-copy"><div class="kicker">Guided demo · ${investorStep+1} of ${INVESTOR_STEPS.length}</div><h2>${esc(s.title)}</h2><p>${esc(s.text)}</p></div><div class="row"><button class="btn" ${investorStep===0?'disabled':''} onclick="moveInvestorTour(${investorStep-1})">Previous step</button>${investorStep<INVESTOR_STEPS.length-1?`<button class="btn primary" onclick="moveInvestorTour(${investorStep+1})">Next step</button>`:'<button class="btn primary" onclick="endInvestorTour()">Finish walkthrough</button>'}<button class="btn ghost" onclick="endInvestorTour()">Exit guide</button></div></section>`);
 }
};
const _investorDashboard=dashboard;
dashboard=function(){const html=_investorDashboard();return isIdahoPilot()&&can('review_decisions')?html+'<div class="row investor-actions"><button class="btn" onclick="openPilotFamilyAccess()">Family access</button><button class="btn ghost" onclick="requestPilotDemoReset()">Reset synthetic pilot</button></div>':html};
function openPilotFamilyAccess(){
 if(!isIdahoPilot()||!investorActionAllowed('review_decisions','share:manage'))return false;
 returnFocus=document.activeElement;const grant=activePilotShareGrant();
 document.getElementById('detailRoot').innerHTML=`<div class="drawerback"><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="familyTitle" onkeydown="pilotDialogKeyboard(event)"><div class="drawerhead"><h2 id="familyTitle">Family access</h2><button class="btn drawerclose" aria-label="Close family access" onclick="closeDetail()">×</button></div><p>Choose synthetic records for a read-only family brief. This demo does not send a link or invite.</p><form onsubmit="savePilotFamilyAccess(event)">${PILOT_RELEASEABLE_SOURCE_IDS.filter(id=>sourceById(id)&&documentClassification(sourceById(id))!=='privileged').map(id=>`<label class="release-choice"><input type="checkbox" name="releaseSource" value="${id}" ${grant?.releasedSourceIds.includes(id)?'checked':''}><span>${esc(sourceById(id).title)}</span></label>`).join('')}<p class="callout">Attorney work product, duplicate inventory copies, internal findings and draft memos are withheld.</p><button class="btn primary">Save read-only release</button></form><div class="row investor-actions"><button class="btn" onclick="previewPilotFamilyBrief()">Preview family brief</button>${grant?'<button class="btn bad" onclick="revokePilotFamilyAccess()">Revoke access</button>':''}</div></aside></div>`;
 document.querySelector('[role=dialog] button')?.focus();return true;
}
function savePilotFamilyAccess(event){
 event.preventDefault();if(!isIdahoPilot()||!investorActionAllowed('review_decisions','share:grant'))return false;
 const ids=[...document.querySelectorAll('input[name=releaseSource]:checked')].map(el=>el.value);
 if(!ids.length){showSecurityNotice('Choose at least one source, or revoke the existing release.');return false}
 createPilotShareGrant(ids);openPilotFamilyAccess();render();return true;
}
function revokePilotFamilyAccess(){
 if(!isIdahoPilot()||!investorActionAllowed('review_decisions','share:revoke'))return false;
 revokePilotShareGrant('Revoked through family access controls');openPilotFamilyAccess();render();return true;
}
function previewPilotFamilyBrief(){
 if(!isIdahoPilot()||!investorActionAllowed('case_view','share:preview'))return false;
 const grant=activePilotShareGrant();
 const records=grant?data.documents.filter(d=>grant.releasedSourceIds.includes(d.id)&&PILOT_RELEASEABLE_SOURCE_IDS.includes(d.id)&&documentClassification(d)!=='privileged'):[];
 record('share.previewed',data.matter.id,{releasedSourceIds:records.map(d=>d.id),readOnly:true});returnFocus=document.activeElement;
 document.getElementById('detailRoot').innerHTML=`<div class="drawerback"><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="briefTitle" onkeydown="pilotDialogKeyboard(event)"><div class="drawerhead"><h2 id="briefTitle">Read-only family brief</h2><button class="btn drawerclose" aria-label="Close family brief" onclick="closeDetail()">×</button></div><p>Only currently released records appear here. No internal review decisions or attorney work product.</p>${records.length?records.map(d=>`<article class="item"><h3>${esc(d.title)}</h3><p>${esc(d.excerpt).replaceAll('\n','<br>')}</p></article>`).join(''):'<p class="callout">No sources are currently released.</p>'}</aside></div>`;
 document.querySelector('[role=dialog] button')?.focus();return true;
}
const _investorDocuments=documents;
documents=function(){return _investorDocuments()+(isIdahoPilot()&&can('review_decisions')?'<div class="row investor-actions"><button class="btn" onclick="openPilotFamilyAccess()">Family access</button></div>':'')};
// Generate from authorised source text, not a different matter's narrative or court template.
function pilotReviewSummary(question=''){
 const permitted=data.documents.filter(canAccessDocument),ids=new Set(permitted.map(d=>d.id));
 const findings=pilotCatalogue().filter(f=>f.sources.every(id=>ids.has(id)));
 const missing=ids.has('S04')?pilotExpectationLedger().filter(x=>x.status==='not_provided'):[];
 const q=String(question).toLowerCase();let selected=permitted;
 let text='Synthetic Idaho pretrial source preview — not an analysis or a court draft. No legal conclusion; camera clock accuracy is unverified.\n\n';
 if(/missing|next|attention|priority/.test(q)){
  text+='Records to obtain or account for:\n'+(missing.length?missing.map(x=>'• '+x.label+' ('+x.recordId+'): not provided in the indexed record.').join('\n'):'No missing expectations can be established from the permitted record.')+'\n\n';
  text+='Review priorities:\n'+(findings.length?findings.map(f=>'• '+f.statement+' '+f.why).join('\n'):'No source-supported candidate findings are available to this role.')+'\n\nNo verified court deadline is recorded. Confirm procedural requirements with counsel.';
  const referenced=new Set([...findings.flatMap(f=>f.sources),...(missing.length?['S04']:[])]);selected=permitted.filter(d=>referenced.has(d.id));
 }else if(/right|law|research|violation/.test(q)){
  text+='Counsel must investigate the sequence and scope of any consent, the search justification and the accuracy of recording clocks. The current record does not establish search legality, ownership or substance identity. Governing authorities and court procedures require attorney verification.\n\n';
  selected=permitted.filter(d=>['S01','S02','S03'].includes(d.id));text+=selected.map(d=>d.id+' — '+d.excerpt).join('\n\n');
 }else{
  text+=selected.map(d=>d.id+' — '+d.title+'\n'+d.excerpt).join('\n\n');
 }
 return {text,sources:selected.map(d=>d.id)};
}
const _investorSimulateAI=simulateAI;
simulateAI=function(q){
 if(!isIdahoPilot())return _investorSimulateAI(q);
 if(!can('ai_use'))return {text:'Your role cannot use the AI assistant.',sources:[]};
 if(!data.documents.some(canAccessDocument))return {text:'No permitted source records are available.',sources:[]};
 return pilotReviewSummary(q);
};
function generatePilotReviewMemo(){
 if(!isIdahoPilot()||!investorActionAllowed('drafting','draft:pilot-memo'))return false;
 const summary=pilotReviewSummary('What needs attention next?');
 const d={id:crypto.randomUUID(),type:'pilot_review_memo',title:'Idaho Pretrial — Internal Review Memo',body:'INTERNAL DRAFT — ATTORNEY REVIEW REQUIRED\nNOT A COURT FILING\n\nMatter: '+data.matter.title+'\n\n'+summary.text+'\n\nSOURCE ANCHORS\n'+summary.sources.map(id=>id+' — '+sourceById(id).title).join('\n')+'\n\nVerify each source, document the review decision and investigate unresolved facts before relying on this memo.',originalBody:'',versions:[],createdAt:new Date().toISOString(),reviewStatus:'attorney_review_required',filingReady:false,sourceIds:summary.sources};
 d.originalBody=d.body;data.drafts.push(d);record('draft.generated',d.id,{type:d.type,sourceIds:d.sourceIds,syntheticOnly:true,courtFiling:false,contentExcludedFromAudit:true});save();render();return true;
}
const _investorDrafting=drafting;
drafting=function(){
 if(!isIdahoPilot())return _investorDrafting();
 if(!requirePermission('drafting','view:pilot-drafting'))return '<p class="callout">Drafts are restricted to the legal review workspace.</p>';
 const last=data.drafts.at(-1);
 return `<div class="kicker">Attorney review workspace</div><h2>Drafting Studio</h2><p class="callout">Idaho court filings require validated templates. You can prepare an internal source-linked review memo now.</p><div class="split"><div class="card"><h3>Internal review memo</h3><p>Summarise missing records and candidate factual findings with source anchors. No filing, service or external delivery.</p><button class="btn primary" onclick="generatePilotReviewMemo()">Generate internal review memo</button><details class="investor-actions"><summary>Court drafting eligibility</summary><p>Idaho court templates remain unvalidated.</p><label for="draftType">Court document</label><select id="draftType"><option value="motion_to_suppress">Motion to suppress</option></select><button class="btn" onclick="generateDraft(event)">Check court drafting eligibility</button></details><h3>Saved drafts</h3>${data.drafts.map(d=>`<button class="item draft-list-button" onclick="openDraft('${esc(d.id)}')">${esc(d.title)}</button>`).join('')||'<p class="muted">No drafts generated yet.</p>'}</div>${last?draftPaper(last):'<div class="paper"><div class="draftstamp">Internal draft</div><h2>Ready for review work</h2><p>Generate a memo, then open it to edit and save a new version.</p></div>'}</div>`;
};
// Re-render after installing presentation extensions. Existing case state is preserved.
nav();render();

// Recipient release applies to every pilot surface, including direct drawer calls.
function pilotRecipientSurface(title){
 const records=data.documents.filter(canAccessDocument);
 return `<div class="kicker">Read-only family access</div><h2>${esc(title)}</h2><p>Detailed records are available only through the current source release. Internal comparisons, witness-review flags and attorney work product are withheld.</p><div class="list">${records.map(d=>`<button class="item draft-list-button" onclick="openDetail('document','${esc(d.id)}')">${esc(d.title)}</button>`).join('')||'<p class="callout">No sources are currently released.</p>'}</div>`;
}
const _investorTimeline=timeline,_investorEvidence=evidence,_investorWitnesses=witnesses;
timeline=function(){return isIdahoPilot()&&activeSecurityProfile==='client'?pilotRecipientSurface('Released chronology sources'):_investorTimeline()};
evidence=function(){return isIdahoPilot()&&activeSecurityProfile==='client'?pilotRecipientSurface('Released evidence sources'):_investorEvidence()};
witnesses=function(){return isIdahoPilot()&&activeSecurityProfile==='client'?pilotRecipientSurface('Released witness sources'):_investorWitnesses()};
const _investorOpenDetail=openDetail;
openDetail=function(type,id){
 if(isIdahoPilot()&&activeSecurityProfile==='client'){
  if(['timeline','evidence','witness','contact','deadline'].includes(type))return securityDenied('review_decisions',`record:${type}:${id}`);
  if(type==='document'){
   const d=sourceById(id);if(!canAccessDocument(d))return securityDenied('case_view',`document:${id}`);
   if(!applicationAllowed())return blockApplication();
   returnFocus=document.activeElement;record('record.opened',`document:${id}`,{readOnly:true});
   document.getElementById('detailRoot').innerHTML=`<div class="drawerback"><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="releasedSourceTitle" onkeydown="pilotDialogKeyboard(event)"><div class="drawerhead"><h2 id="releasedSourceTitle">${esc(d.title)}</h2><button class="btn drawerclose" aria-label="Close released source" onclick="closeDetail()">×</button></div><span class="pill">Read-only released record</span><p>${esc(d.excerpt).replaceAll('\n','<br>')}</p></aside></div>`;
   document.querySelector('[role=dialog] button')?.focus();return true;
  }
 }
 return _investorOpenDetail(type,id);
};
const _investorSwitchProfile=switchSecurityProfile;
switchSecurityProfile=function(key){if(!SECURITY_PROFILES[key])return;closeDetail();return _investorSwitchProfile(key)};
const _investorPermissionRender=render;
render=function(){
 if(!applicationAllowed())return blockApplication();
 const permission=VIEW_PERMISSIONS[current];
 if(permission&&!can(permission)){securityDenied(permission,`view:${current}`);current='dashboard';nav()}
 return _investorPermissionRender();
};
// Shareable presentation entry; it does not reset records or change the active role.
if(globalThis.location&&/[?&]demo=investor(?:&|$)/.test(globalThis.location.search))showView('presentation');

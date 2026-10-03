// Synthetic Idaho pilot controls. No live legal data, model call, filing, messaging or external effect.
const PILOT_MATTER_ID='SYN-ID-PRETRIAL-001';
const PILOT_RELEASEABLE_SOURCE_IDS=Object.freeze(['S01','S02','S03','S04']);
function isIdahoPilot(){return data?.matter?.id===PILOT_MATTER_ID}
function sourceById(id){return data.documents.find(d=>d.id===id)}
function pilotSourceText(id){return String(sourceById(id)?.excerpt||'')}
function pilotCatalogue(){
 if(!isIdahoPilot())return [];
 const has=(id,pattern)=>pattern.test(pilotSourceText(id));
 const rows=[];
 if(has('S01',/search at 21:14/i)&&has('S02',/opening the rear door now[\s\S]*21:12:10/i)&&has('S03',/open the rear door before Morgan said/i)){
  rows.push({id:'PF-TIMING',category:'record_consistency',severity:'high',status:'open',weight:30,
   statement:'Source records describe materially different search/consent sequencing.',
   why:'The incident report places the vehicle search after the attributed consent statement, while the camera transcript and witness statement describe door access before that statement. Camera clock synchronisation remains unverified, so this is a review prompt rather than a legal conclusion.',
   sources:['S01','S02','S03'],aiDetected:true,humanConfirmed:false});
 }
 if(has('S01',/bag was not theirs/i)&&has('S03',/did not see who put the black bag there/i)){
  rows.push({id:'PF-OWNERSHIP',category:'factual_gap',severity:'medium',status:'open',weight:20,
   statement:'The current record does not establish ownership of the black bag.',
   why:'The report attributes a denial of ownership and the witness does not identify who placed the bag in the vehicle.',
   sources:['S01','S03'],aiDetected:true,humanConfirmed:false});
 }
 if(pilotSourceText('S04')&&pilotSourceText('S04')===pilotSourceText('S05')){
  rows.push({id:'PF-DUPLICATE',category:'record_quality',severity:'low',status:'open',weight:10,
   statement:'Two evidence-inventory records contain identical indexed text.',
   why:'S04 and S05 are exact duplicate synthetic records and should not be counted as independent support.',
   sources:['S04','S05'],aiDetected:true,humanConfirmed:false});
 }
 return rows;
}
const PILOT_CRI_RULESET='casebrief.cri.idaho-pretrial.v0.2';
const PILOT_CRI_EXPLANATION='The Case Readiness Index shows how complete, organised and ready for review this case is, based on the records and unresolved work in CaseBrief. It does not predict a legal outcome.';
function pilotCitations(ids){return ids.map(id=>({sourceId:id,start:0,end:pilotSourceText(id).length,quote:pilotSourceText(id)}))}
function pilotSourceRevision(ids){return JSON.stringify(ids.map(id=>[id,sourceById(id)?.excerpt??null]))}
function pilotExpectationLedger(){
 if(!isIdahoPilot())return [];
 return [['PE-LAB-E02','LAB-E02','Laboratory result for E02'],['PE-CUSTODY-E01','CUSTODY-E01','Continuity/custody record for E01']].map(([id,recordId,label])=>{
  // Provision requires a canonical record, not a free-text evidence status or finding disposition.
  const supplied=data.documents.filter(d=>d.recordId===recordId&&String(d.excerpt||'').trim());
  const decision=data.pilotExpectationDecisions?.[id];
  return {id,recordId,label,status:decision?.status==='inapplicable'?'inapplicable':supplied.length?'provided':'not_provided',basisSources:['S04'],provisionSources:supplied.map(d=>d.id)};
 });
}
function setPilotExpectationApplicability(id,inapplicable,reason){
 if(!isIdahoPilot()||!applicationAllowed()||!requirePermission('review_decisions',`expectation:${id}`))return false;
 if(!pilotExpectationLedger().some(x=>x.id===id)||typeof inapplicable!=='boolean'||!String(reason||'').trim())return false;
 data.pilotExpectationDecisions??={};
 const criBefore=pilotCRI().score,before=data.pilotExpectationDecisions[id]?.status||'applicable';
 data.pilotExpectationDecisions[id]={status:inapplicable?'inapplicable':'applicable',reason:String(reason).trim(),actor:currentIdentity(),at:new Date().toISOString()};
 record('expectation.applicability_changed',id,{before,...data.pilotExpectationDecisions[id],sources:['S04'],ruleset:PILOT_CRI_RULESET,criBefore,criAfter:pilotCRI().score});save();return true;
}
function ensurePilotFindings(){
 if(!isIdahoPilot())return [];
 // Reviewed content is revision-bound: editing a source creates a new review task.
 const revisions=data.pilotSourceRevisions||{};
 const nextRevisions={};
 for(const doc of data.documents){
  const revision=String(doc.excerpt||'');nextRevisions[doc.id]=revision;
  if(Object.hasOwn(revisions,doc.id)&&revisions[doc.id]!==revision){
   const wasReviewed=!!doc.reviewed;doc.reviewed=false;
   record('source.revision_changed',doc.id,{reviewInvalidated:wasReviewed,reviewed:false,ruleset:PILOT_CRI_RULESET},'success',systemActor);
  }
 }
 data.pilotSourceRevisions=nextRevisions;
 if(data.criRuleset!==PILOT_CRI_RULESET){
  record('cri.ruleset_selected',data.matter.id,{before:data.criRuleset||null,after:PILOT_CRI_RULESET,weights:[.40,.35,.25]},'success',systemActor);data.criRuleset=PILOT_CRI_RULESET;
 }
 const existing=new Map(data.issues.filter(x=>String(x.id).startsWith('PF-')).map(x=>[x.id,x]));
 const candidates=new Map(pilotCatalogue().map(f=>[f.id,f]));
 const rows=[];
 for(const id of new Set([...existing.keys(),...candidates.keys()])){
  const prior=existing.get(id),candidate=candidates.get(id),base=candidate||prior;
  const revision=pilotSourceRevision(base.sources);
  const changed=!!prior&&((prior.sourceRevision!==undefined&&prior.sourceRevision!==revision)||(!candidate&&prior.sourceActive!==false));
  const row={...base,status:prior?.status||'open',humanConfirmed:prior?.humanConfirmed||false,decisionHistory:prior?.decisionHistory||[],needsSourceReview:prior?.needsSourceReview||false,sourceActive:!!candidate,sourceRevision:revision,citations:pilotCitations(base.sources),ruleset:PILOT_CRI_RULESET};
  if(changed){
   const transition={at:new Date().toISOString(),actor:systemActor,before:row.status,after:'open',reason:'Source changed or removed; human re-review required.',sources:base.sources,citations:row.citations,ruleset:PILOT_CRI_RULESET};
   row.status='open';row.humanConfirmed=false;row.needsSourceReview=true;row.decisionHistory=[...row.decisionHistory,transition];
   record('finding.source_changed',id,transition,'success',systemActor);
  }
  if(!prior)record('finding.detected',id,{sources:row.sources,citations:row.citations,ruleset:PILOT_CRI_RULESET,deterministic:true},'success',systemActor);
  rows.push(row);
 }
 data.issues=data.issues.filter(x=>!String(x.id).startsWith('PF-')).concat(rows);
 save();return rows;
}
function pilotCRI(){
 if(!isIdahoPilot())return null;
 ensurePilotFindings();
 const expectations=pilotExpectationLedger().filter(x=>x.status!=='inapplicable');
 const missing=expectations.filter(x=>x.status!=='provided');
 // A qualifying inventory and a nonempty applicable template are required; empty input is never 100%.
 const qualified=!!pilotSourceText('S04').trim()&&expectations.length>0;
 const unresolved=data.issues.filter(x=>String(x.id).startsWith('PF-')&&isUnresolved(x));
 const completenessDeductions=missing.map(x=>({id:x.id,label:x.label,points:20/expectations.length,sources:x.basisSources,status:x.status,correctiveAction:'Provide the canonical '+x.recordId+' record.'}));
 // Work control scores outstanding source-review tasks, never the same finding again.
 // Duplicate indexed records form one task; a duplicate copy cannot improve readiness.
 const groups=new Map();
 for(const doc of data.documents.filter(d=>String(d.excerpt||'').trim())){
  const key=doc.excerpt;const group=groups.get(key)||[];group.push(doc);groups.set(key,group);
 }
 const workDeductions=[...groups.values()].filter(group=>!group.every(d=>d.reviewed)).map(group=>({id:'PW-REVIEW-'+group[0].id,label:'Source review outstanding',points:40/groups.size,sources:group.map(d=>d.id),status:'unreviewed',correctiveAction:'Review each indexed source in this task.'}));
 const attentionDeductions=unresolved.map(x=>({id:'PA-'+x.id,label:x.statement,points:Number(x.weight)||0,sources:x.sources,status:x.status,humanConfirmed:x.humanConfirmed,correctiveAction:'Confirm, dismiss or resolve with a cited reason.'}));
 const component=(items,weight,cap)=>{
  const unique=[...new Map(items.map(x=>[x.id,x])).values()];let remaining=cap;
  const deductions=unique.map(x=>{const applied=Math.min(remaining,Math.max(0,x.points));remaining-=applied;return {...x,points:applied}});
  const value=100-deductions.reduce((n,x)=>n+x.points,0);
  return {weight,value,deductions,cap,contribution:value*weight};
 };
 const components={completeness:component(completenessDeductions,.40,20),workControl:component(workDeductions,.35,40),attentionControl:component(attentionDeductions,.25,100)};
 const unrounded=Object.values(components).reduce((n,c)=>n+c.contribution,0);
 return {score:qualified?Math.round(unrounded):null,status:qualified?'calculated':'insufficient_data',components,unrounded:qualified?unrounded:null,applicableExpectations:expectations.length,ruleset:PILOT_CRI_RULESET,calculatedAt:new Date().toISOString(),meaning:'Operational readiness only; not a prediction of legal outcome.'};
}
const _pilotBaseSaveIssueDecision=saveIssueDecision;
saveIssueDecision=function(e,id,status){
 if(!isIdahoPilot()||!String(id).startsWith('PF-'))return _pilotBaseSaveIssueDecision(e,id,status);
 e.preventDefault();
 if(!applicationAllowed()||!requirePermission('review_decisions',`issue-decision:${id}`))return false;
 if(!['reviewed','resolved','dismissed','open'].includes(status))return false;
 ensurePilotFindings();
 const reason=String(document.getElementById('decisionReason')?.value||'').trim();
 if(!data.issues.some(i=>i.id===id)||!reason)return false;
 const criBefore=pilotCRI().score,x=data.issues.find(i=>i.id===id),before=x.status;
 if(status==='reviewed'&&!x.sourceActive){
  record('finding.confirmation_blocked',id,{reason:'Current source support is unavailable; dismiss or resolve with a reason instead.',ruleset:PILOT_CRI_RULESET},'denied');return false;
 }
 x.status=status;x.humanConfirmed=status==='reviewed'||status==='resolved';x.needsSourceReview=false;
 const transition={at:new Date().toISOString(),actor:currentIdentity(),before,after:status,reason,sources:x.sources,citations:x.citations,ruleset:PILOT_CRI_RULESET,humanConfirmed:x.humanConfirmed,criBefore,criAfter:pilotCRI().score};
 // Recalculation replaces finding objects; attach history to the current persisted row.
 data.issues.find(i=>i.id===id).decisionHistory.push(transition);
 record('issue.status_changed',id,transition);save();closeDetail();render();return true;
};
function activePilotShareGrant(){
 if(!isIdahoPilot())return null;
 const grant=data.shareGrant;
 if(!grant||grant.revokedAt)return null;
 if(grant.expiresAt&&new Date(grant.expiresAt).getTime()<=Date.now())return null;
 return grant;
}
function createPilotShareGrant(sourceIds=PILOT_RELEASEABLE_SOURCE_IDS,expiresAt=null){
 if(!isIdahoPilot())throw new Error('Pilot share grants apply only to the synthetic Idaho pilot.');
 if(!requirePermission('review_decisions','share:grant'))return false;
 const allowed=[...new Set(sourceIds)].filter(id=>PILOT_RELEASEABLE_SOURCE_IDS.includes(id)&&sourceById(id)&&documentClassification(sourceById(id))!=='privileged');
 data.shareGrant={id:crypto.randomUUID(),recipientRole:'defendant_family_read_only',releasedSourceIds:allowed,createdAt:new Date().toISOString(),createdBy:currentIdentity().id,expiresAt:expiresAt||null,revokedAt:null};
 record('share.granted',data.shareGrant.id,{releasedSourceIds:allowed,expiresAt:data.shareGrant.expiresAt,readOnly:true});
 save();return structuredClone(data.shareGrant);
}
function revokePilotShareGrant(reason='revoked_by_case_owner'){
 if(!isIdahoPilot()||!data.shareGrant)return false;
 if(!requirePermission('review_decisions','share:revoke'))return false;
 data.shareGrant.revokedAt=new Date().toISOString();data.shareGrant.revokedBy=currentIdentity().id;data.shareGrant.revokeReason=reason;
 record('share.revoked',data.shareGrant.id,{reason});
 save();return true;
}
const _pilotBaseCanAccessDocument=canAccessDocument;
canAccessDocument=function(d){
 if(isIdahoPilot()&&activeSecurityProfile==='client'){
  const grant=activePilotShareGrant();
  return !!d&&!!grant&&grant.releasedSourceIds.includes(d.id)&&documentClassification(d)!=='privileged';
 }
 return _pilotBaseCanAccessDocument(d);
};
const _pilotBaseScore=score;
score=function(){if(isIdahoPilot())return pilotCRI()?.score??null;return _pilotBaseScore()};
function pilotCRIExportSnapshot(){
 if(!isIdahoPilot()||!requirePermission('review_decisions','cri:export')||!requirePermission('export','cri:export'))return null;
 const cri=pilotCRI();
 return {notice:'Synthetic browser-local pilot calculation; operational readiness only, not legal outcome.',matterId:data.matter.id,explanation:PILOT_CRI_EXPLANATION,...structuredClone(cri)};
}
function exportPilotCRI(){
 const snapshot=pilotCRIExportSnapshot();if(!snapshot)return false;
 confirmSensitiveAction('CRI export','Export this synthetic matter’s CRI calculation, item labels and source references to a local JSON file.',()=>{
  // Recheck role and recalculate at the time of confirmation.
  const payload=pilotCRIExportSnapshot();if(!payload)return;
  record('cri.exported',data.matter.id,{score:payload.score,ruleset:payload.ruleset,calculatedAt:payload.calculatedAt});
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='casebrief-pilot-cri.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });return true;
}
function pilotCRIDetailHtml(cri=pilotCRI()){
 if(!cri)return '';
 const restricted=activeSecurityProfile==='client';
 const row=(name,c)=>`<div class="item"><b>${esc(name)}: ${c.value}% × ${Math.round(c.weight*100)}% = ${c.contribution.toFixed(2)}</b>${c.deductions.map(d=>{
  const allowed=!restricted&&(d.sources||[]).every(id=>{const source=sourceById(id);return !source||canAccessDocument(source)});
  return `<div class="pilot-deduction">−${d.points.toFixed(2)}: ${allowed?esc(d.label):'Restricted factor'} · ${allowed?esc(d.humanConfirmed?'Human-confirmed':d.id.startsWith('PA-')?'AI-detected — not human-confirmed':d.status):''}${allowed?`<div>${srcChips(d.sources)}</div><div class="small">${esc(d.correctiveAction)}</div>`:''}</div>`;
 }).join('')||'<div class="small muted">No deductions.</div>'}</div>`;
 return `<div class="metric">${cri.score===null?'Insufficient data':cri.score+'%'}</div><p>${esc(PILOT_CRI_EXPLANATION)}</p><p>${esc(cri.meaning)}</p>${cri.score===null?'<p>Qualifying inventory and applicable expectations are required.</p>':`<div class="list">${row('Record completeness',cri.components.completeness)}${row('Work control',cri.components.workControl)}${row('Attention control',cri.components.attentionControl)}</div><p>Unrounded total ${cri.unrounded.toFixed(2)} → ${cri.score}%. Applicable completeness denominator: ${cri.applicableExpectations}.</p>`}${can('review_decisions')?pilotExpectationHtml():''}<div class="meta">Calculated ${esc(cri.calculatedAt)} · Ruleset ${esc(cri.ruleset)}</div>`;
}
const _pilotBaseOpenCRI=openCRI;
openCRI=function(){
 if(!isIdahoPilot())return _pilotBaseOpenCRI();
 if(!applicationAllowed())return blockApplication();
 if(!requirePermission('review_decisions','cri:details'))return false;
 returnFocus=document.activeElement;
 const cri=pilotCRI();record('cri.opened',data.matter.id,{score:cri.score,components:cri.components,ruleset:cri.ruleset,calculatedAt:cri.calculatedAt});
 document.getElementById('detailRoot').innerHTML=`<div class="drawerback" onclick="if(event.target===this)closeDetail()"><aside class="drawer pilot-cri-detail" onkeydown="pilotDialogKeyboard(event)" role="dialog" aria-modal="true" aria-labelledby="pilotCRITitle"><div class="drawerhead"><div><div class="kicker">Case readiness</div><h2 id="pilotCRITitle">Case Readiness Index (CRI)</h2></div><button class="btn drawerclose" aria-label="Close CRI details" onclick="closeDetail()">×</button></div>${pilotCRIDetailHtml(cri)}${can('export')?'<button class="btn" onclick="exportPilotCRI()">Export CRI calculation</button>':''}</aside></div>`;
 document.querySelector('[role=dialog] button')?.focus();
};
const _pilotBaseDashboard=dashboard;
dashboard=function(){
 if(!isIdahoPilot())return _pilotBaseDashboard();
 ensurePilotFindings();const cri=pilotCRI(),grant=activePilotShareGrant();
 return `<div class="kicker">Synthetic Idaho pretrial pilot</div><h2>${esc(data.matter.title)}</h2><p>${esc(data.matter.jurisdiction)} · ${esc(data.matter.stage)}</p>${courtProgress(true)}<div class="grid" style="margin-top:14px"><div class="card c6"><h3>Case Readiness Index: ${cri.score===null?'Insufficient data':cri.score+'%'}</h3>${activeSecurityProfile==='client'?'<p>Calculation factors are restricted to the legal review workspace.</p>':`<div class="orbwrap pilot-cri"><button class="orb" aria-label="Open CRI calculation details" aria-describedby="pilotCRIExplanation" style="--pct:${cri.score??0}" onclick="openCRI()"><span class="orbscore">${cri.score===null?'Pending':cri.score+'%'}<small>CRI</small></span><span class="crihover" id="pilotCRIExplanation">${esc(PILOT_CRI_EXPLANATION)}</span></button></div><button class="btn" onclick="openCRI()">Open CRI detail</button>`}</div><div class="card c6"><h3>Next deadline</h3><p>No verified deadline recorded. Confirm court and procedural requirements with counsel.</p></div><div class="card c7"><h3>Candidate review findings</h3>${activeSecurityProfile==='client'?'<p>Restricted to the legal review workspace.</p>':`<p>${data.issues.filter(isUnresolved).length} synthetic source-grounded item(s) require human review.</p><button class="btn" onclick="showView('review')">Open review queue</button>`}</div><div class="card c5"><h3>Defendant/family brief</h3><p>${grant?`${grant.releasedSourceIds.length} source(s) currently released read-only.`:'No active share grant.'}</p><p class="muted">Privileged attorney work product is never releaseable by this pilot control.</p></div></div>`;
};
ensurePilotFindings();

// The review queue and factor drawer use the same auditable pilot decisions.
const _pilotBaseReview=review;
review=function(){
 if(!isIdahoPilot())return _pilotBaseReview();
 if(!requirePermission('review_decisions','pilot:review'))return '';
 ensurePilotFindings();
 return `<div class="kicker">Human review queue</div><h2>Candidate factual findings</h2><p class="callout"><b>AI identifies. Human decides.</b> Deterministic synthetic review prompts; no legal conclusion.</p><div class="list">${data.issues.filter(x=>String(x.id).startsWith('PF-')).map(x=>{
  const visible=x.sources.every(id=>{const source=sourceById(id);return !source||canAccessDocument(source)});
  if(!visible)return '<div class="item">Restricted factor</div>';
  return `<div class="item"><h3>${esc(x.statement)}</h3><p>${esc(x.why)}</p><span class="pill">${esc(x.status)}</span><span class="pill">${x.humanConfirmed?'Human-confirmed':'AI-detected — not human-confirmed'}</span>${x.needsSourceReview?'<p class="callout">Source changed — re-review required.</p>':''}${!x.sourceActive?'<p class="callout">Prior finding: current source support is unavailable. Confirmation is blocked.</p>':''}<div>${srcChips(x.sources)}</div><div class="row">${['reviewed','resolved','dismissed','open'].map(status=>`<button class="btn" onclick="beginIssueDecision('${x.id}','${status}')">${({reviewed:'Confirm',resolved:'Resolve',dismissed:'Dismiss',open:'Reopen'})[status]}</button>`).join('')}</div><details><summary>Decision history (${x.decisionHistory.length})</summary>${x.decisionHistory.map(h=>`<p>${esc(h.at)} · ${esc(h.actor?.name)} · ${esc(h.before)} → ${esc(h.after)} · ${esc(h.reason)} · ${esc(h.ruleset)}</p>`).join('')}</details></div>`;
 }).join('')}</div>`;
};
const _pilotBaseOpenDetail=openDetail;
openDetail=function(type,id){
 if(isIdahoPilot()&&type==='issue'&&String(id).startsWith('PF-')){
  if(!requirePermission('review_decisions',`issue:${id}`))return false;
  // Pilot item effects are component points, never an unweighted composite percentage.
  return openCRI();
 }
 return _pilotBaseOpenDetail(type,id);
};

function pilotExpectationHtml(){
 return `<h3>Record applicability</h3><p>Exclude an expectation only with an authorised reason. Exclusion does not supply the record.</p><div class="list">${pilotExpectationLedger().map(x=>`<div class="item"><b>${esc(x.label)}</b><div class="meta">${esc(x.status)} · ${esc(x.recordId)}</div>${srcChips([...x.basisSources,...x.provisionSources])}<button class="btn" onclick="beginPilotExpectationDecision('${x.id}',${x.status!=='inapplicable'})">${x.status==='inapplicable'?'Restore applicability':'Mark inapplicable'}</button></div>`).join('')}</div>`;
}
function beginPilotExpectationDecision(id,inapplicable){
 if(!isIdahoPilot()||!requirePermission('review_decisions',`expectation:${id}`))return false;
 const x=pilotExpectationLedger().find(x=>x.id===id);if(!x||typeof inapplicable!=='boolean')return false;
 returnFocus=document.activeElement;
 document.getElementById('detailRoot').innerHTML=`<div class="drawerback"><aside class="drawer pilot-cri-detail" onkeydown="pilotDialogKeyboard(event)" role="dialog" aria-modal="true" aria-labelledby="expectationTitle"><div class="drawerhead"><h2 id="expectationTitle">${inapplicable?'Mark inapplicable':'Restore applicability'}</h2><button class="btn drawerclose" aria-label="Close applicability decision" onclick="closeDetail()">×</button></div><p>${esc(x.label)}</p><p>This changes the completeness denominator. It does not establish record provision.</p><form onsubmit="savePilotExpectationDecision(event,'${id}',${inapplicable})"><label for="expectationReason">Reason (required)</label><textarea id="expectationReason" required></textarea><button class="btn primary">Save applicability</button></form></aside></div>`;
 document.getElementById('expectationReason')?.focus();return true;
}
function savePilotExpectationDecision(event,id,inapplicable){
 event.preventDefault();
 const reason=document.getElementById('expectationReason')?.value||'';
 if(!setPilotExpectationApplicability(id,inapplicable,reason))return false;
 closeDetail();render();openCRI();return true;
}
function pilotDialogKeyboard(event){
 if(event.key!=='Tab')return;
 const controls=[...event.currentTarget.querySelectorAll('button:not([disabled]),textarea,input,select,a[href],[tabindex="0"]')];
 if(!controls.length)return;
 const first=controls[0],last=controls.at(-1);
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
}

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
function pilotExpectationLedger(){
 if(!isIdahoPilot())return [];
 const evidence=(id)=>data.evidence.find(e=>e.id===id);
 const lab=evidence('E02'),bag=evidence('E01');
 return [
  {id:'PE-LAB-E02',recordId:'LAB-E02',label:'Laboratory result for E02',status:/result\s+(received|provided|complete)/i.test(String(lab?.status||''))?'provided':'not_provided',basisSources:['S04']},
  {id:'PE-CUSTODY-E01',recordId:'CUSTODY-E01',label:'Continuity/custody record for E01',status:/custody|continuity/i.test(String(bag?.status||''))?'provided':'not_provided',basisSources:['S04']}
 ];
}
function ensurePilotFindings(){
 if(!isIdahoPilot())return [];
 const existing=new Map(data.issues.map(x=>[x.id,x]));
 for(const finding of pilotCatalogue()){
  const prior=existing.get(finding.id);
  if(prior)Object.assign(finding,{status:prior.status,decisionHistory:prior.decisionHistory||[],humanConfirmed:prior.humanConfirmed||false});
 }
 data.issues=data.issues.filter(x=>!String(x.id).startsWith('PF-')).concat(pilotCatalogue().map(f=>{
  const prior=existing.get(f.id);
  return {...f,status:prior?.status||f.status,decisionHistory:prior?.decisionHistory||[],humanConfirmed:prior?.humanConfirmed||false};
 }));
 return data.issues.filter(x=>String(x.id).startsWith('PF-'));
}
function pilotCRI(){
 if(!isIdahoPilot())return null;
 ensurePilotFindings();
 const expectations=pilotExpectationLedger();
 const missing=expectations.filter(x=>x.status!=='provided');
 const unresolved=data.issues.filter(x=>String(x.id).startsWith('PF-')&&isUnresolved(x));
 const completenessDeductions=missing.map(x=>({id:x.id,label:x.label,points:10,sources:x.basisSources,status:x.status}));
 const workDeductions=[];
 if(unresolved.some(x=>x.id==='PF-TIMING'))workDeductions.push({id:'PW-TIMING',label:'Timing discrepancy remains unreviewed',points:20,sources:['S01','S02','S03']});
 if(missing.length)workDeductions.push({id:'PW-MISSING',label:'Expected records remain outstanding',points:20,sources:[...new Set(missing.flatMap(x=>x.basisSources))]});
 const attentionDeductions=unresolved.map(x=>({id:'PA-'+x.id,label:x.statement,points:Number(x.weight)||0,sources:x.sources}));
 const component=(items)=>Math.max(0,100-items.reduce((n,x)=>n+x.points,0));
 const components={
  completeness:{weight:.40,value:component(completenessDeductions),deductions:completenessDeductions},
  workControl:{weight:.35,value:component(workDeductions),deductions:workDeductions},
  attentionControl:{weight:.25,value:component(attentionDeductions),deductions:attentionDeductions}
 };
 const score=Math.round(components.completeness.value*.40+components.workControl.value*.35+components.attentionControl.value*.25);
 return {score,components,ruleset:'casebrief.cri.idaho-pretrial.v0.1',calculatedAt:new Date().toISOString(),meaning:'Operational readiness only; not a prediction of legal outcome.'};
}
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
function pilotCRIDetailHtml(){
 const cri=pilotCRI();if(!cri)return '';
 const row=(name,c)=>`<div class="item"><div class="row" style="justify-content:space-between"><b>${esc(name)}</b><b>${c.value}% × ${Math.round(c.weight*100)}%</b></div>${c.deductions.map(d=>`<div class="small muted">−${d.points}: ${esc(d.label)} · ${esc((d.sources||[]).join(', '))}</div>`).join('')||'<div class="small muted">No deductions.</div>'}</div>`;
 return `<div class="metric">${cri.score}%</div><p>${esc(cri.meaning)}</p><div class="list">${row('Record completeness',cri.components.completeness)}${row('Work control',cri.components.workControl)}${row('Attention control',cri.components.attentionControl)}</div><div class="meta">Ruleset ${esc(cri.ruleset)}</div>`;
}
const _pilotBaseOpenCRI=openCRI;
openCRI=function(){
 if(!isIdahoPilot())return _pilotBaseOpenCRI();
 if(!applicationAllowed())return blockApplication();
 const cri=pilotCRI();record('cri.opened',data.matter.id,{score:cri.score,ruleset:cri.ruleset});
 document.getElementById('detailRoot').innerHTML=`<div class="drawerback"><aside class="drawer" role="dialog" aria-modal="true"><div class="drawerhead"><div><div class="kicker">Case readiness</div><h2>Case Readiness Index (CRI)</h2></div><button class="btn drawerclose" onclick="closeDetail()">×</button></div>${pilotCRIDetailHtml()}<p class="callout"><b>AI-detected — not human-confirmed</b> items remain review prompts until an authorised reviewer records a disposition.</p></aside></div>`;
};
const _pilotBaseDashboard=dashboard;
dashboard=function(){
 if(!isIdahoPilot())return _pilotBaseDashboard();
 ensurePilotFindings();const cri=pilotCRI(),grant=activePilotShareGrant();
 return `<div class="kicker">Synthetic Idaho pretrial pilot</div><h2>${esc(data.matter.title)}</h2><p>${esc(data.matter.jurisdiction)} · ${esc(data.matter.stage)}</p>${courtProgress(true)}<div class="grid" style="margin-top:14px"><div class="card c6"><h3>Case Readiness Index: ${cri.score}%</h3><p>Operational readiness from record completeness, work control and attention control. It does not predict a legal outcome.</p><button class="btn" onclick="openCRI()">Open CRI detail</button></div><div class="card c6"><h3>Next deadline</h3><p>No verified deadline recorded. Confirm court and procedural requirements with counsel.</p></div><div class="card c7"><h3>Candidate review findings</h3><p>${data.issues.filter(isUnresolved).length} synthetic source-grounded item(s) require human review.</p><button class="btn" onclick="showView('review')">Open review queue</button></div><div class="card c5"><h3>Defendant/family brief</h3><p>${grant?`${grant.releasedSourceIds.length} source(s) currently released read-only.`:'No active share grant.'}</p><p class="muted">Privileged attorney work product is never releaseable by this pilot control.</p></div></div>`;
};
ensurePilotFindings();

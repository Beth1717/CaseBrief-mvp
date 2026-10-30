// Fixed fictional samples only. No uploads, court requests or production security claim.
const INGESTION_FIXTURES=Object.freeze({
 court_notice:{sourceClass:'court_record',documentType:'Court notice',externalRef:'SYN-DOCKET-NOTICE',title:'Fictional docket observation',payload:'FICTIONAL DOCKET: a status conference is listed. No verified date or deadline is supplied.',facts:[{predicate:'docket_observation',value:'Status conference listed without a verified date',locator:'notice paragraph 1'}]},
 court_update:{sourceClass:'court_record',documentType:'Court notice',externalRef:'SYN-DOCKET-NOTICE',title:'Updated fictional docket observation',payload:'FICTIONAL DOCKET REVISION: the status conference notice was revised. No verified date or deadline is supplied.',facts:[{predicate:'docket_observation',value:'Notice revised without a verified date',locator:'revised notice paragraph 1'}]},
 firm_manifest:{sourceClass:'firm_file',documentType:'Evidence log',externalRef:'SYN-DISCOVERY-MANIFEST',title:'Fictional discovery manifest',payload:'FICTIONAL MANIFEST v1: incident report and inventory received. Video is referenced but not supplied.',facts:[{predicate:'packet_contents',value:'Incident report and inventory',locator:'manifest line 1'},{predicate:'record_not_supplied',value:'Referenced video',locator:'manifest line 1'}]},
 firm_update:{sourceClass:'firm_file',documentType:'Evidence log',externalRef:'SYN-DISCOVERY-MANIFEST',title:'Updated fictional discovery manifest',payload:'FICTIONAL MANIFEST v2: incident report, inventory and transcript received. Video is still not supplied.',facts:[{predicate:'packet_contents',value:'Incident report, inventory and transcript',locator:'manifest line 1'},{predicate:'record_not_supplied',value:'Referenced video',locator:'manifest line 1'}]},
 counsel_note:{sourceClass:'human_entered',documentType:'Attorney note',externalRef:'SYN-COUNSEL-NOTE',title:'Fictional internal verification note',payload:'FICTIONAL COUNSEL NOTE: verify source timestamps before relying on their sequence. Internal work product.',facts:[{predicate:'verification_task',value:'Check source clocks before comparing sequence',locator:'internal note paragraph 1'}]}
});
for(const key of ['attorney','cocounsel','investigator'])if(!SECURITY_PROFILES[key].permissions.includes('ingestion_manage'))SECURITY_PROFILES[key].permissions.push('ingestion_manage');
function ingestionState(matter=data){
 if(!matter.ingestion||!Array.isArray(matter.ingestion.sources)||!Array.isArray(matter.ingestion.assertions))matter.ingestion={sources:[],assertions:[]};
 return matter.ingestion;
}
function ingestionAccess(row){return !!row&&canAccessDocument({id:row.documentId,type:row.documentType,ingestionSourceId:undefined})}
function ingestionGate(action,review=false){
 if(sessionLocked||!applicationAllowed())return false;
 return requirePermission('ingestion_manage','ingestion:'+action)&&(!review||requirePermission('review_decisions','ingestion:'+action));
}
function ingestionContext(){return {matter:data,actor:currentIdentity().id,role:activeSecurityProfile}}
function sameIngestionContext(context){return data===context.matter&&currentIdentity().id===context.actor&&activeSecurityProfile===context.role&&!sessionLocked&&applicationAllowed()}
let ingestionDialogContext=null;
const _ingestionCloseDetail=closeDetail;
closeDetail=function(){ingestionDialogContext=null;return _ingestionCloseDetail()};
async function ingestionHash(payload){
 // JSON encoding is deterministic for this exact stored string; this is not a file custody certificate.
 const text=JSON.stringify(String(payload));
 const bytes=Uint8Array.from(unescape(encodeURIComponent(text)),char=>char.charCodeAt(0));
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}
function ingestionEvent(action,target,details){return {id:crypto.randomUUID(),at:new Date().toISOString(),matterId:data.matter.id,sessionId,actor:structuredClone(currentIdentity()),action,target,outcome:'success',details:structuredClone(details)}}
function commitIngestion(mutator){
 const original=data,events=workspace.events;
 data=structuredClone(original);workspace.cases[data.matter.id]=data;workspace.events=events.slice();
 try{
  const result=mutator();
  if(!save())throw new Error('PERSISTENCE_FAILED');
  return result;
 }catch{
  data=original;workspace.cases[original.matter.id]=original;workspace.events=events;
  showSecurityNotice('The ingestion change was not saved. The prior source and review state were kept.');return false;
 }
}
function ingestionClassLabel(kind){return ({court_record:'Court record',firm_file:'Firm file',human_entered:'Human verification'})[kind]||'Source'}
async function importIngestionFixture(key){
 if(!ingestionGate('import')||!Object.hasOwn(INGESTION_FIXTURES,key))return false;
 const sample=structuredClone(INGESTION_FIXTURES[key]);
 if(!ingestionAccess(sample))return false;
 const origin=ingestionContext(),hash=await ingestionHash(sample.payload);
 if(!sameIngestionContext(origin)||!ingestionGate('import')||!ingestionAccess(sample))return false;
 const state=ingestionState(),duplicate=state.sources.find(source=>source.integrityHash===hash);
 if(duplicate){
  const saved=commitIngestion(()=>{workspace.events.push(ingestionEvent('ingestion.duplicate_detected',duplicate.id,{integrityHash:hash,sourceClass:sample.sourceClass}));return {status:'duplicate',id:duplicate.id}});
  if(saved){render();showSecurityNotice('Exact synthetic payload already recorded. No second source or assertion was created.')}return saved;
 }
 const id='ingest-'+crypto.randomUUID(),siblings=state.sources.filter(source=>source.externalRef===sample.externalRef);
 const documentId=siblings[0]?.documentId||'ingest-doc-'+crypto.randomUUID();
 const row={...sample,id,documentId,version:siblings.reduce((max,s)=>Math.max(max,s.version),0)+1,integrityHash:hash,validationStatus:'quarantined',acquiredAt:new Date().toISOString(),acquiredBy:currentIdentity().id};
 const saved=commitIngestion(()=>{
  const current=ingestionState();current.sources.push(row);
  for(const fact of row.facts)current.assertions.push({...fact,id:'assertion-'+crypto.randomUUID(),sourceId:id,sourceVersion:row.version,documentId,active:false});
  workspace.events.push(ingestionEvent('ingestion.source_quarantined',id,{sourceClass:row.sourceClass,version:row.version,integrityHash:hash,assertions:row.facts.length}));
  return {status:'quarantined',id};
 });
 if(saved){render();showSecurityNotice('Fictional source saved in quarantine. It is excluded from case documents and analysis until promoted.')}return saved;
}
function invalidateIngestionReview(documentId){
 for(const finding of data.issues.filter(item=>(item.sources||[]).includes(documentId))){
  const before=finding.status;finding.status='open';finding.humanConfirmed=false;finding.needsSourceReview=true;
  const transition={at:new Date().toISOString(),actor:currentIdentity(),before,after:'open',reason:'Ingested source replaced or revoked; human re-review required.',sources:[...(finding.sources||[])]};
  finding.decisionHistory=[...(finding.decisionHistory||[]),transition];
  workspace.events.push(ingestionEvent('finding.source_changed',finding.id,{before,after:'open',sourceIds:[documentId],reviewInvalidated:true}));
 }
}
async function decideIngestionSource(id,action,reason){
 if(!ingestionGate(action,true)||!['promote','revoke'].includes(action)||typeof reason!=='string'||!reason.trim()||reason.length>2000)return false;
 const row=ingestionState().sources.find(source=>source.id===id);
 if(!ingestionAccess(row)||(action==='promote'?row.validationStatus!=='quarantined':row.validationStatus!=='promoted'))return false;
 if(action==='promote'&&ingestionState().sources.some(source=>source.documentId===row.documentId&&source.validationStatus==='promoted'&&source.version>=row.version))return false;
 const origin=ingestionContext(),snapshot=JSON.stringify(row),activeDocument=JSON.stringify(data.documents.find(doc=>doc.id===row.documentId)||null);
 const hash=await ingestionHash(row.payload);
 if(!sameIngestionContext(origin)||!ingestionGate(action,true))return false;
 const live=ingestionState().sources.find(source=>source.id===id);
 if(!live||JSON.stringify(live)!==snapshot||JSON.stringify(data.documents.find(doc=>doc.id===row.documentId)||null)!==activeDocument||hash!==live.integrityHash||!ingestionAccess(live))return false;
 const saved=commitIngestion(()=>{
  const state=ingestionState(),source=state.sources.find(item=>item.id===id);
  if(action==='promote'){
   for(const previous of state.sources.filter(item=>item.documentId===source.documentId&&item.validationStatus==='promoted')){
    previous.validationStatus='superseded';previous.supersededBy=id;
    state.assertions.filter(item=>item.sourceId===previous.id).forEach(item=>item.active=false);
   }
   const hadDocument=data.documents.some(doc=>doc.id===source.documentId);
   data.documents=data.documents.filter(doc=>doc.id!==source.documentId);
   data.documents.push({id:source.documentId,title:source.title,type:source.documentType,date:new Date().toISOString().slice(0,10),excerpt:source.payload,reviewed:false,ingestionSourceId:id,sourceVersion:source.version,integrityHash:hash});
   source.validationStatus='promoted';state.assertions.filter(item=>item.sourceId===id).forEach(item=>item.active=true);
   if(hadDocument)invalidateIngestionReview(source.documentId);
  }else{
   source.validationStatus='revoked';state.assertions.filter(item=>item.sourceId===id).forEach(item=>item.active=false);
   data.documents=data.documents.filter(doc=>doc.ingestionSourceId!==id);invalidateIngestionReview(source.documentId);
  }
  source.decisions=[...(source.decisions||[]),{action,reason:reason.trim(),at:new Date().toISOString(),actor:currentIdentity()}];
  workspace.events.push(ingestionEvent(action==='promote'?'ingestion.source_promoted':'ingestion.source_revoked',id,{sourceClass:source.sourceClass,version:source.version,documentId:source.documentId,reasonRecorded:true,reviewed:false}));
  return {status:source.validationStatus,id};
 });
 if(saved){render();showSecurityNotice(action==='promote'?'Source promoted for case review. Its facts still require human verification.':'Source revoked. Linked decisions now require re-review.')}return saved;
}
function beginIngestionDecision(id,action){
 if(!ingestionGate(action,true))return false;
 const row=ingestionState().sources.find(source=>source.id===id);if(!ingestionAccess(row))return false;
 const origin=ingestionContext();
 ingestionDialogContext=origin;
 returnFocus=document.activeElement;
 document.getElementById('detailRoot').innerHTML=`<div class="drawerback"><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="ingestionDecisionTitle" onkeydown="pilotDialogKeyboard(event)"><div class="drawerhead"><h2 id="ingestionDecisionTitle">${action==='promote'?'Promote source':'Revoke source'}</h2><button class="btn" onclick="closeDetail()">Cancel</button></div><h3>${esc(row.title)}</h3><p>${esc(row.payload)}</p><p>Promotion makes this fictional source available for case review. It does not verify its truth or confirm a finding.</p><form id="ingestionDecisionForm"><label for="ingestionReason">Reason for this decision</label><textarea id="ingestionReason" required maxlength="2000" rows="4"></textarea><button class="btn primary" type="submit">Save source decision</button></form></aside></div>`;
 document.getElementById('ingestionDecisionForm').onsubmit=async event=>{
  event.preventDefault();if(!sameIngestionContext(origin))return false;
  const button=event.submitter;if(button)button.disabled=true;
  try{const saved=await decideIngestionSource(id,action,document.getElementById('ingestionReason').value);if(saved)closeDetail();return saved}finally{if(button?.isConnected)button.disabled=false}
 };
 document.getElementById('ingestionReason').focus();return true;
}
const _ingestionCanAccessDocument=canAccessDocument;
canAccessDocument=function(doc){
 if(doc?.ingestionSourceId){const row=ingestionState().sources.find(source=>source.id===doc.ingestionSourceId);if(!row||row.validationStatus!=='promoted'||row.documentId!==doc.id||row.payload!==doc.excerpt||row.version!==doc.sourceVersion)return false}
 return _ingestionCanAccessDocument(doc);
};
function caseIngestion(){
 if(!ingestionGate('view'))return '<h2>Case ingestion</h2><p>This workspace is restricted to authorized intake roles.</p>';
 const visible=ingestionState().sources.filter(ingestionAccess),assertions=ingestionState().assertions.filter(item=>visible.some(source=>source.id===item.sourceId));
 const controls=Object.entries(INGESTION_FIXTURES).filter(([,sample])=>ingestionAccess(sample)).map(([key,sample])=>`<button class="btn" onclick="importIngestionFixture('${key}')">${esc(sample.title)}</button>`).join('');
 return `<div class="kicker">Fictional source intake</div><h2>Case ingestion</h2><p>Fixed synthetic samples only. Quarantined sources stay outside case documents and analysis. No files are uploaded and no court connection runs.</p><div class="card"><h3>Import a sample</h3><div class="row">${controls}</div></div><div class="grid" style="margin-top:16px"><div class="card c8"><h3>Source versions and decisions</h3><div class="list">${visible.slice().reverse().map(row=>`<article class="item"><div class="row"><span class="pill">${esc(ingestionClassLabel(row.sourceClass))}</span><span class="pill">${esc(row.validationStatus)}</span><span class="pill">Version ${row.version}</span></div><h3>${esc(row.title)}</h3><p>${esc(row.payload)}</p><div class="meta">SHA-256 of the JSON-encoded synthetic payload: ${esc(row.integrityHash.slice(0,20))}…</div><p class="small muted">The digest identifies these sample bytes; it does not authenticate evidence or verify facts.</p>${can('review_decisions')&&row.validationStatus==='quarantined'?`<button class="btn primary" onclick="beginIngestionDecision('${row.id}','promote')">Review for promotion</button>`:''}${can('review_decisions')&&row.validationStatus==='promoted'?`<button class="btn" onclick="beginIngestionDecision('${row.id}','revoke')">Revoke case use</button>`:''}${row.decisions?.length?`<p class="small">Latest reason: ${esc(row.decisions.at(-1).reason)}</p>`:''}</article>`).join('')||'<p>No sources imported.</p>'}</div></div><div class="card c4"><h3>Source-linked assertions</h3><p>These fixed sample assertions are derived text. Their source and version remain attached; promotion is not factual verification.</p>${assertions.map(item=>`<div class="item"><b>${esc(item.predicate.replaceAll('_',' '))}</b><p>${esc(item.value)}</p><div class="meta">Version ${item.sourceVersion} · ${esc(item.locator)} · ${item.active?'Available for review':'Excluded from case use'}</div></div>`).join('')||'<p>No derived sample assertions.</p>'}</div></div>`;
}
const _ingestionRender=render;
render=function(){
 if(ingestionDialogContext&&!sameIngestionContext(ingestionDialogContext))closeDetail();
 if(current!=='ingestion')return _ingestionRender();
 if(!applicationAllowed())return blockApplication();
 document.getElementById('app').innerHTML=caseIngestion();updateStorageNotice();applySecurityUI();syncPrivacyShield();syncLockScreen();
};
nav();render();

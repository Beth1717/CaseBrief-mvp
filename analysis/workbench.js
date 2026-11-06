'use strict';
const $=id=>document.getElementById(id);let token='',row=null,count=0,inputRevision=0,lastClientRunId='';
function element(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
function addDocument(title='',text=''){
 count++;const wrap=element('div',undefined,'document'),label=element('label',`Document ${count}`);label.htmlFor='title-'+count;
 const input=element('input');input.type='text';input.id='title-'+count;input.placeholder='Document title';input.value=title;input.maxLength=120;input.required=true;
 const area=element('textarea');area.setAttribute('aria-label',`Document ${count} fictional text`);area.placeholder='Paste fictional text';area.value=text;area.required=true;area.maxLength=20000;
 wrap.append(label,input,area);$('documents').append(wrap);$('addDocument').disabled=count>=12;
}
addDocument('Fictional incident report','The traffic stop began at 22:14. The officer requested a second unit.');
addDocument('Fictional witness statement','The traffic stop began at 21:55. The witness watched from the pavement.');
function invalidate(){inputRevision++;const staleRun=lastClientRunId;lastClientRunId='';row=null;if(staleRun&&token)post('/api/invalidate',{clientRunId:staleRun}).then(loadHistory).catch(()=>{});$('results').replaceChildren(element('h2','Review findings'),element('p','Sources changed. The previous source-bound review has been invalidated. Run a new comparison before reviewing findings.'));}
$('documents').addEventListener('input',invalidate);$('engine').addEventListener('change',invalidate);
$('addDocument').onclick=()=>{addDocument();invalidate()};
async function post(url,data){const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json','x-casebrief-token':token},body:JSON.stringify(data)});const value=await r.json();if(!r.ok)throw new Error(value.error||'REQUEST_FAILED');return value}
function render(){
 const root=$('results');root.replaceChildren(element('h2','Review findings'));if(row.readOnly)root.append(element('p','Historical or invalidated receipt — read-only. A fresh authorized source context is required before further review.','muted'));if(row.status==='INVALIDATED'||row.status==='REJECTED')root.append(element('p',`Host disposition: ${row.status}. ${row.errorCode||''} No findings are available for promotion.`,'error'));
 root.append(element('span',row.result.status,'pill'));
 const rules=row.result.execution.inference==='NOT_RUN';
 root.append(element('p',rules?'Explicit time rules executed. General AI analysis was not run.':`Model analysis executed: ${row.result.execution.model}`,'muted'));
 row.result.limitations.forEach(t=>root.append(element('p',t,'muted')));
 if(!row.result.findings.length)root.append(element('p',row.result.status==='NEEDS_INPUT'?'Insufficient supported evidence for a finding within this method’s coverage.':'Comparison returned no supported candidate. This does not prove the record is consistent.'));
 for(const f of row.result.findings){
  const card=element('article',undefined,'finding');const history=row.events.filter(e=>e.findingId===f.findingId);const last=history.at(-1);
  card.append(element('span',f.verification?.disposition||'HUMAN REVIEW REQUIRED','pill'),element('h3',f.statement));
  card.append(element('p',`Source link: exact quotations matched. Passage support: ${f.verification?.propositionSupport||'UNASSESSED'}. Attorney validation: not established.`, 'verification-status'));
  const assessment=element('select');assessment.setAttribute('aria-label','Passage support assessment');
  for(const [value,label] of [['','Select passage support'],['SUPPORTED','Passages support this factual proposal'],['NOT_SUPPORTED','Passages do not support it'],['UNCERTAIN','Uncertain — more review needed']]){const option=element('option',label);option.value=value;assessment.append(option)}
  card.append(assessment);
  for(const c of f.citations){const title=row.documents.find(d=>d.sourceId===c.sourceId)?.title||c.sourceId;card.append(element('small',`${title} · UTF-8 bytes ${c.startByte}–${c.endByte}`),element('blockquote',c.quote))}
  const reason=element('input');reason.type='text';reason.placeholder='Reason for your review decision';reason.maxLength=1000;reason.setAttribute('aria-label','Review decision reason');
  const controls=element('div',undefined,'reviewControls');
  for(const [action,title] of [['SUPPORT_ASSESSED','Record passage assessment'],['CONFIRMED','Confirm candidate'],['DISMISSED','Dismiss'],['REOPENED','Reopen']]){const button=element('button',title,'secondary');button.type='button';button.disabled=row.readOnly||row.status!=='PENDING_HUMAN_REVIEW';button.onclick=async()=>{
   if(!reason.value.trim()){reason.focus();return}
   if(action==='SUPPORT_ASSESSED'&&!assessment.value){assessment.focus();return}
   const currentRow=row,revision=inputRevision;
   button.disabled=true;
   try{const updated=await post('/api/review',{invocationId:currentRow.result.invocationId,findingId:f.findingId,action,reason:reason.value,version:currentRow.version,...(action==='SUPPORT_ASSESSED'?{assessment:assessment.value}:{})});if(row!==currentRow||inputRevision!==revision)return;row.events=updated.events;row.version=updated.version;row.result.findings=updated.findings;render();loadHistory()}catch(e){$('progress').textContent=e.message;button.disabled=false}
  };controls.append(button)}
  card.append(reason,controls);for(const e of history)card.append(element('p',`${e.action}${e.assessment?' ('+e.assessment+')':''} · ${e.reason} · ${e.at}`,'muted'));root.append(card);
 }
 root.append(element('h3',`UMG runtime: ${row.umg.status}`),element('p',row.umg.reason,'muted'));
 if(row.umg.runtime)root.append(element('p',`Compiler: ${row.umg.runtime.compilerExecution}. Fresh candidates accepted: ${row.umg.acceptedCount}; quarantined: ${row.umg.quarantinedCount}.`,'muted'));
 const detail=element('details'),summary=element('summary','Inspect invocation receipt'),pre=element('pre',JSON.stringify({schema:'casebrief.local.synthetic-review-receipt.v1',status:row.status,version:row.version,sourceSnapshotDigest:row.sourceSnapshotDigest,result:row.result,umg:row.umg,events:row.events,decisions:row.decisions,hostAudit:row.hostAudit,readOnly:row.readOnly,disclaimer:'Synthetic-only local receipt. Human disposition is self-asserted and does not establish attorney validation.'},null,2));detail.append(summary,pre);root.append(detail);
 const download=element('button','Download review receipt','secondary');download.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({schema:'casebrief.local.synthetic-review-receipt.v1',status:row.status,version:row.version,sourceSnapshotDigest:row.sourceSnapshotDigest,result:row.result,umg:row.umg,events:row.events,decisions:row.decisions,hostAudit:row.hostAudit,readOnly:row.readOnly,disclaimer:'Synthetic-only local receipt. Human disposition is self-asserted and does not establish attorney validation.'},null,2)],{type:'application/json'}));const a=element('a');a.href=url;a.download='casebrief-fictional-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};root.append(download);if(row.hostAudit?.length){const audit=element('details'),summary=element('summary','Inspect hash-chained host audit events');audit.append(summary,element('pre',JSON.stringify(row.hostAudit,null,2)));root.append(audit)}
}
async function loadHistory(){
 if(!token)return;const root=$('history');if(!root)return;
 try{const response=await fetch('/api/reviews',{headers:{'x-casebrief-token':token}});if(!response.ok)throw new Error('HISTORY_UNAVAILABLE');
  const data=await response.json();root.replaceChildren(element('h2','Recent local review receipts'));
  if(!data.reviews.length){root.append(element('p','No local synthetic review receipts yet.'));return}
  for(const item of data.reviews){const button=element('button',`${item.status} · ${item.proposalCount} proposal(s) · ${new Date(item.updatedAt).toLocaleString()}`,'secondary');button.type='button';button.onclick=()=>loadHistoryItem(item.invocationId);root.append(button)}
 }catch{root.replaceChildren(element('h2','Recent local review receipts'),element('p','Local review history is unavailable.'))}
}
async function loadHistoryItem(id){
 try{const response=await fetch('/api/reviews/'+encodeURIComponent(id),{headers:{'x-casebrief-token':token}});const value=await response.json();if(!response.ok)throw new Error(value.error||'RECEIPT_UNAVAILABLE');row=value;render();$('progress').textContent=row.readOnly?'Historical receipt loaded read-only.':'Saved review loaded; source context is still active.'}
 catch(e){$('progress').textContent=e.message}
}
$('analysisForm').onsubmit=async e=>{
 e.preventDefault();const submittedRevision=inputRevision,clientRunId=crypto.randomUUID();lastClientRunId=clientRunId;$('run').disabled=true;$('progress').className='';$('progress').textContent='Comparing sources and checking exact quotations…';
 try{const documents=[...document.querySelectorAll('.document')].map(el=>({title:el.querySelector('input').value,text:el.querySelector('textarea').value}));const response=await post('/api/analyse',{syntheticOnly:$('synthetic').checked,engine:$('engine').value,documents,clientRunId});if(inputRevision!==submittedRevision){$('progress').textContent='Sources changed during analysis. Run a fresh comparison.';return}row=response;render();loadHistory();$('progress').textContent=response.readOnly?'Comparison is historical/read-only; review was not enabled.':'Comparison complete. Review the supported candidates.'}catch(error){$('progress').className='error';$('progress').textContent=`Comparison could not complete: ${error.message}. No new findings were accepted.`;$('results').replaceChildren(element('h2','Comparison unavailable'),element('p','The latest attempt failed. Earlier findings are not results of this attempt.'))}finally{$('run').disabled=false}
};
fetch('/api/health').then(r=>r.json()).then(h=>{token=h.token;$('connection').textContent=h.modelConfigured?`Local model configured: ${h.model}. UMG connection ${h.umgConfigured?'configured':'not configured'}.`:'Time rules are ready. Set CASEBRIEF_OLLAMA_MODEL on the server to enable the local AI option.';if(!h.modelConfigured)$('engine').options[1].disabled=true;loadHistory()}).catch(()=>{$('connection').textContent='Start this page with npm run start:analysis.';$('run').disabled=true});

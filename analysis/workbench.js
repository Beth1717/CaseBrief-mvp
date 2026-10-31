'use strict';
const $=id=>document.getElementById(id);let token='',row=null,count=0,inputRevision=0;
function element(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
function addDocument(title='',text=''){
 count++;const wrap=element('div',undefined,'document'),label=element('label',`Document ${count}`);label.htmlFor='title-'+count;
 const input=element('input');input.type='text';input.id='title-'+count;input.placeholder='Document title';input.value=title;input.maxLength=120;input.required=true;
 const area=element('textarea');area.setAttribute('aria-label',`Document ${count} fictional text`);area.placeholder='Paste fictional text';area.value=text;area.required=true;area.maxLength=20000;
 wrap.append(label,input,area);$('documents').append(wrap);$('addDocument').disabled=count>=12;
}
addDocument('Fictional incident report','The traffic stop began at 22:14. The officer requested a second unit.');
addDocument('Fictional witness statement','The traffic stop began at 21:55. The witness watched from the pavement.');
function invalidate(){inputRevision++;row=null;$('results').replaceChildren(element('h2','Review findings'),element('p','Sources changed. Run a new comparison before reviewing findings.'));}
$('documents').addEventListener('input',invalidate);$('engine').addEventListener('change',invalidate);
$('addDocument').onclick=()=>{addDocument();invalidate()};
async function post(url,data){const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json','x-casebrief-token':token},body:JSON.stringify(data)});const value=await r.json();if(!r.ok)throw new Error(value.error||'REQUEST_FAILED');return value}
function render(){
 const root=$('results');root.replaceChildren(element('h2','Review findings'));
 root.append(element('span',row.result.status,'pill'));
 const rules=row.result.execution.inference==='NOT_RUN';
 root.append(element('p',rules?'Explicit time rules executed. General AI analysis was not run.':`Model analysis executed: ${row.result.execution.model}`,'muted'));
 row.result.limitations.forEach(t=>root.append(element('p',t,'muted')));
 if(!row.result.findings.length)root.append(element('p',row.result.status==='NEEDS_INPUT'?'Insufficient supported evidence for a finding within this method’s coverage.':'Comparison returned no supported candidate. This does not prove the record is consistent.'));
 for(const f of row.result.findings){
  const card=element('article',undefined,'finding');const history=row.events.filter(e=>e.findingId===f.findingId);const last=history.at(-1);
  card.append(element('span',last?last.action:'HUMAN REVIEW REQUIRED','pill'),element('h3',f.statement));
  for(const c of f.citations){const title=row.documents.find(d=>d.sourceId===c.sourceId)?.title||c.sourceId;card.append(element('small',`${title} · UTF-8 bytes ${c.startByte}–${c.endByte}`),element('blockquote',c.quote))}
  const reason=element('input');reason.type='text';reason.placeholder='Reason for your review decision';reason.maxLength=1000;reason.setAttribute('aria-label','Review decision reason');
  const controls=element('div',undefined,'reviewControls');
  for(const [action,title] of [['CONFIRMED','Confirm candidate'],['DISMISSED','Dismiss'],['REOPENED','Reopen']]){const button=element('button',title,'secondary');button.type='button';button.onclick=async()=>{
   if(!reason.value.trim()){reason.focus();return}
   button.disabled=true;
   try{const updated=await post('/api/review',{invocationId:row.result.invocationId,findingId:f.findingId,action,reason:reason.value,version:row.version});row.events=updated.events;row.version=updated.version;render()}catch(e){$('progress').textContent=e.message;button.disabled=false}
  };controls.append(button)}
  card.append(reason,controls);for(const e of history)card.append(element('p',`${e.action} · ${e.reason} · ${e.at}`,'muted'));root.append(card);
 }
 root.append(element('h3',`UMG runtime: ${row.umg.status}`),element('p',row.umg.reason,'muted'));
 if(row.umg.runtime)root.append(element('p',`Compiler: ${row.umg.runtime.compilerExecution}. Fresh candidates accepted: ${row.umg.acceptedCount}; quarantined: ${row.umg.quarantinedCount}.`,'muted'));
 const detail=element('details'),summary=element('summary','Inspect invocation receipt'),pre=element('pre',JSON.stringify({result:row.result,umg:row.umg,events:row.events},null,2));detail.append(summary,pre);root.append(detail);
 const download=element('button','Download review receipt','secondary');download.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({result:row.result,umg:row.umg,events:row.events},null,2)],{type:'application/json'}));const a=element('a');a.href=url;a.download='casebrief-fictional-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};root.append(download);
}
$('analysisForm').onsubmit=async e=>{
 e.preventDefault();const submittedRevision=inputRevision;$('run').disabled=true;$('progress').className='';$('progress').textContent='Comparing sources and checking exact quotations…';
 try{const documents=[...document.querySelectorAll('.document')].map(el=>({title:el.querySelector('input').value,text:el.querySelector('textarea').value}));const response=await post('/api/analyse',{syntheticOnly:$('synthetic').checked,engine:$('engine').value,documents});if(inputRevision!==submittedRevision){$('progress').textContent='Sources changed during analysis. Run a fresh comparison.';return}row=response;render();$('progress').textContent='Comparison complete. Review the supported candidates.'}catch(error){$('progress').className='error';$('progress').textContent=`Comparison could not complete: ${error.message}. No new findings were accepted.`;$('results').replaceChildren(element('h2','Comparison unavailable'),element('p','The latest attempt failed. Earlier findings are not results of this attempt.'))}finally{$('run').disabled=false}
};
fetch('/api/health').then(r=>r.json()).then(h=>{token=h.token;$('connection').textContent=h.modelConfigured?`Local model configured: ${h.model}. UMG connection ${h.umgConfigured?'configured':'not configured'}.`:'Time rules are ready. Set CASEBRIEF_OLLAMA_MODEL on the server to enable the local AI option.';if(!h.modelConfigured)$('engine').options[1].disabled=true}).catch(()=>{$('connection').textContent='Start this page with npm run start:analysis.';$('run').disabled=true});

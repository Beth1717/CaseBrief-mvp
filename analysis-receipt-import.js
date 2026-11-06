// Untrusted handoff only: imported local analysis receipts never become case facts.
function analysisReceiptImportAllowed(){
 return !sessionLocked&&applicationAllowed()&&requirePermission('review_decisions','analysis-receipt:import')===true;
}
function renderAnalysisReceiptInbox(){
 const root=document.getElementById('analysisReceiptInbox');if(!root)return;
 const items=Array.isArray(workspace.analysisInbox)?workspace.analysisInbox:[];
 if(!items.length){root.innerHTML='<p class="muted small">No imported receipts. Importing never changes case issues, CRI, timeline, evidence or witness records.</p>';return}
 root.innerHTML='<div class="callout notice">Every imported receipt is untrusted and quarantined. It is not linked to the active case, is not a verified source, and cannot be promoted from this inbox.</div>'+items.slice().reverse().map(function(item){
  const proposals=item.proposals.map(function(proposal){
   return '<div class="item"><b>'+esc(proposal.category)+'</b><p>'+esc(proposal.statement)+'</p><div class="meta">Finding '+esc(proposal.findingId)+' · source refs: '+esc(proposal.sourceRefs.join(', '))+'</div>'+(proposal.citations.length?'<div class="small muted">'+proposal.citations.length+' source locator(s); quote text intentionally not copied into the main workspace.</div>':'')+'</div>';
  }).join('');
  return '<div class="item"><div class="row" style="justify-content:space-between"><b>UNTRUSTED_QUARANTINED</b><span class="pill warn">Not a case fact</span></div><div class="meta">Imported '+esc(fmtDate(item.importedAt))+' by '+esc(item.importedBy)+' · '+item.proposals.length+' proposal(s)</div><p>Source workbench matter: <code>'+esc(item.sourceMatterId)+'</code></p><p>UMG status: <b>'+esc(item.umgStatus)+'</b> · accepted '+item.umgAcceptedCount+' · quarantined '+item.umgQuarantinedCount+' · dispatch '+item.dispatchCount+'</p><p>Snapshot digest: <code>'+esc(item.sourceSnapshotDigest)+'</code></p><div class="list">'+proposals+'</div><div class="small muted">Audit events: '+item.hostAuditCount+' · human decision records: '+item.decisionCount+'. These are unverified counts from the imported file.</div></div>';
 }).join('');
}
async function importCaseBriefAnalysisReceipt(input){
 if(!analysisReceiptImportAllowed()){showSecurityNotice('Receipt import requires an unlocked authorised review session.');return false}
 const file=input&&input.files&&input.files[0];if(!file)return false;
 if(file.size>2*1024*1024){showSecurityNotice('Receipt exceeds the 2 MiB import limit.');input.value='';return false}
 try{
  const receipt=JSON.parse(await file.text()),result=receipt&&receipt.result,umg=receipt&&receipt.umg;
  const valid=receipt&&receipt.schema==='casebrief.local.synthetic-review-receipt.v1'&&receipt.status==='PENDING_HUMAN_REVIEW'&&receipt.readOnly===false&&/^[0-9a-f]{64}$/.test(receipt.sourceSnapshotDigest||'')&&result&&result.tenantId==='local-synthetic-workbench'&&typeof result.matterId==='string'&&typeof result.invocationId==='string'&&Array.isArray(result.findings)&&result.findings.length>0&&result.findings.length<=50&&result.findings.every(function(f){return typeof f.findingId==='string'&&typeof f.statement==='string'&&f.statement.length<=2000&&f.reviewState==='HUMAN_REVIEW_REQUIRED'&&Array.isArray(f.sourceRefs)&&f.sourceRefs.length>0&&f.sourceRefs.length<=20})&&Array.isArray(receipt.hostAudit)&&Array.isArray(receipt.events)&&Array.isArray(receipt.decisions)&&umg&&['SUCCEEDED','NOT_CONFIGURED'].includes(umg.status)&&umg.dispatchCount===0&&result.effects&&result.effects.dispatchCount===0;
  if(!valid)throw new Error('Receipt failed the local synthetic shape/safety checks.');
  if(!analysisReceiptImportAllowed())throw new Error('Review permission changed during import.');
  const duplicate=(workspace.analysisInbox||[]).find(function(item){return item.invocationId===result.invocationId&&item.sourceSnapshotDigest===receipt.sourceSnapshotDigest});
  if(duplicate){showSecurityNotice('This receipt has already been imported into quarantine.');input.value='';return {status:'duplicate',id:duplicate.id}}
  const proposals=result.findings.map(function(f){
   return {findingId:f.findingId,category:String(f.category||'unspecified').slice(0,80),statement:f.statement,sourceRefs:f.sourceRefs.map(function(s){return String(s).slice(0,128)}).slice(0,20),citations:(f.citations||[]).slice(0,20).map(function(c){return {sourceId:String(c.sourceId||'').slice(0,128),locator:String(c.locator||'').slice(0,256),startByte:Number.isInteger(c.startByte)?c.startByte:null,endByte:Number.isInteger(c.endByte)?c.endByte:null,sourceVersionId:String(c.sourceVersionId||'').slice(0,128),contentSha256:String(c.contentSha256||'').slice(0,128)}})};
  });
  const row={id:'analysis-receipt-'+crypto.randomUUID(),invocationId:result.invocationId,sourceMatterId:result.matterId,sourceSnapshotDigest:receipt.sourceSnapshotDigest,status:'UNTRUSTED_QUARANTINED',importedAt:new Date().toISOString(),importedBy:currentIdentity().id,umgStatus:umg.status,umgAcceptedCount:Number(umg.acceptedCount)||0,umgQuarantinedCount:Number(umg.quarantinedCount)||0,dispatchCount:0,hostAuditCount:receipt.hostAudit.length,decisionCount:receipt.decisions.length,proposals:proposals};
  const previous=workspace.analysisInbox,events=workspace.events;
  workspace.analysisInbox=[...(Array.isArray(previous)?previous:[]),row].slice(-20);
  workspace.events=[...events,{id:crypto.randomUUID(),at:new Date().toISOString(),matterId:null,sessionId:sessionId,actor:structuredClone(currentIdentity()),action:'analysis.receipt_imported',target:'analysis-receipt:'+row.id,outcome:'quarantined',details:{invocationId:row.invocationId,sourceSnapshotDigest:row.sourceSnapshotDigest,proposalCount:row.proposals.length,umgStatus:row.umgStatus,dispatchCount:0,contentExcludedFromAudit:true}}];
  if(!persist()){workspace.analysisInbox=previous;workspace.events=events;throw new Error('Browser storage unavailable; receipt was not saved.')}
  renderAnalysisReceiptInbox();input.value='';showSecurityNotice('Receipt imported into quarantine only. No case issue, CRI, timeline, evidence or witness record was changed.');
  return {status:'UNTRUSTED_QUARANTINED',id:row.id};
 }catch(error){showSecurityNotice(error.message||'Receipt import failed.');input.value='';return false}
}

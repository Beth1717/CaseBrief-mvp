// Synthetic review handoff. This is an inspectable snapshot, never a signed audit record.
function pilotReviewReceipt(){
 if(!isIdahoPilot()||!applicationAllowed()||sessionLocked||privacyMode||
    !requirePermission('review_decisions','review:receipt')||!requirePermission('audit_view','review:receipt')||!requirePermission('export','review:receipt'))return null;
 const cri=pilotCRI(); // Refresh source revisions before reading human decisions.
 const findings=data.issues.filter(x=>String(x.id).startsWith('PF-'));
 const sourceIds=[...new Set(findings.flatMap(x=>x.sources))];
 if(sourceIds.some(id=>sourceById(id)&&!canAccessDocument(sourceById(id))))return null;
 const events=workspace.events.filter(e=>e.matterId===data.matter.id&&e.action==='issue.status_changed');
 return {
  schemaVersion:'casebrief.synthetic-review-receipt.v1',syntheticOnly:true,
  notice:'Browser-local, mutable review snapshot. Not authenticated, signed, tamper-evident, attorney validation or legal advice.',
  matterId:data.matter.id,exportedAt:new Date().toISOString(),exportedBy:currentIdentity(),
  runtime:{mode:'deterministic-browser-fixture',externalDispatch:0,hostedRuntimeQualified:false},
  cri:structuredClone(cri),
  sources:sourceIds.map(id=>{const d=sourceById(id);return d?{id,title:d.title,classification:documentClassification(d),indexedText:String(d.excerpt||''),reviewed:!!d.reviewed}:{id,missing:true}}),
  findings:findings.map(f=>({id:f.id,statement:f.statement,sourceIds:f.sources,
   citations:structuredClone(f.citations),sourceActive:f.sourceActive,needsSourceReview:f.needsSourceReview,
   status:f.status,humanConfirmed:f.humanConfirmed,ruleset:f.ruleset,
   decisions:f.decisionHistory.map(d=>({ ...structuredClone(d),
    auditEventIds:events.filter(e=>e.target===f.id&&JSON.stringify(e.details)===JSON.stringify(d)).map(e=>e.id)
   }))})),
  expectations:structuredClone(pilotExpectationLedger()),
  gates:{attorneyValidation:'open',scoringCalibration:'open',authenticatedBackend:'open',durableAudit:'open',hostedRuntimeAndProviderQualification:'open',commercialValidation:'open'}
 };
}
function exportPilotReviewReceipt(){
 if(!pilotReviewReceipt())return false;
 const matterId=data.matter.id;
 confirmSensitiveAction('review receipt export','Save source text, human decision reasons, CRI and linked audit IDs for this synthetic matter to a local JSON file.',()=>{
  // Confirmation is bound to the same matter and current permissions, never a stale snapshot.
  if(data.matter.id!==matterId)return;
  const payload=pilotReviewReceipt();if(!payload)return;
  const event=record('review.receipt_exported',matterId,{schemaVersion:payload.schemaVersion,sourceIds:payload.sources.map(s=>s.id),findingIds:payload.findings.map(f=>f.id),contentExcludedFromAudit:true});
  if(!event)return;
  payload.exportEventId=event.id;
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='casebrief-synthetic-review-receipt.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });return true;
}
const _receiptActivityHistory=activityHistory;
activityHistory=function(){return _receiptActivityHistory()+(isIdahoPilot()&&can('review_decisions')&&can('audit_view')&&can('export')?'<section class="card investor-actions"><h3>Source-to-decision receipt</h3><p>Save one synthetic review snapshot with source passages, current finding states, human decision reasons, linked activity IDs and CRI. This is a mutable browser record, not a production audit certificate.</p><button class="btn" onclick="exportPilotReviewReceipt()">Export review receipt</button></section>':'')};
render();

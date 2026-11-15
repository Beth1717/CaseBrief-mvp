'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function harness(){
 const notices=[],root={innerHTML:''},workspace={analysisInbox:[],events:[]};let saves=0;
 const context=vm.createContext({workspace,sessionLocked:false,sessionId:'session-test',crypto,structuredClone,
  applicationAllowed:()=>true,requirePermission:()=>true,currentIdentity:()=>({id:'local-reviewer',role:'attorney'}),
  fmtDate:value=>new Date(value).toISOString(),esc:value=>String(value).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),
  document:{getElementById:id=>id==='analysisReceiptInbox'?root:null},persist:()=>{saves++;return true},showSecurityNotice:value=>notices.push(value)});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..','analysis-receipt-import.js'),'utf8'),context);
 return {context,workspace,root,notices,get saves(){return saves}};
}
function validReceipt(){
 return {schema:'casebrief.local.synthetic-review-receipt.v1',status:'PENDING_HUMAN_REVIEW',readOnly:false,sourceSnapshotDigest:'a'.repeat(64),
  result:{tenantId:'local-synthetic-workbench',matterId:'fictional-matter-1',invocationId:'invocation-1',effects:{dispatchCount:0},findings:[{findingId:'finding-1',category:'contradiction',statement:'Two fictional timestamps differ.',reviewState:'HUMAN_REVIEW_REQUIRED',sourceRefs:['source-1','source-2'],citations:[{sourceId:'source-1',locator:'synthetic:source-1',startByte:0,endByte:12,sourceVersionId:'sha256:abc',contentSha256:'abc',quote:'DO NOT COPY THIS QUOTE'}]}]},
  umg:{status:'SUCCEEDED',acceptedCount:0,quarantinedCount:1,dispatchCount:0},events:[],decisions:[],hostAudit:[{eventId:'audit-1'}]};
}
function inputFor(receipt){const raw=JSON.stringify(receipt);return {value:'chosen.json',files:[{size:Buffer.byteLength(raw),text:async()=>raw}]}}
test('valid local analysis receipt enters quarantine only and copies no quote text',async()=>{
 const h=harness(),receipt=validReceipt(),input=inputFor(receipt);
 const result=await h.context.importCaseBriefAnalysisReceipt(input);
 assert.equal(result.status,'UNTRUSTED_QUARANTINED');assert.equal(h.workspace.analysisInbox.length,1);assert.equal(h.saves,1);
 const item=h.workspace.analysisInbox[0];assert.equal(item.status,'UNTRUSTED_QUARANTINED');assert.equal(item.umgQuarantinedCount,1);
 assert.equal(item.proposals[0].citations[0].quote,undefined);assert.ok(!JSON.stringify(item).includes('DO NOT COPY THIS QUOTE'));
 assert.equal(h.workspace.events[0].action,'analysis.receipt_imported');assert.equal(h.workspace.events[0].details.contentExcludedFromAudit,true);
 assert.ok(h.root.innerHTML.includes('Not a case fact'));assert.ok(h.notices.at(-1).includes('quarantine only'));
});
test('duplicate, read-only, non-synthetic and nonzero-dispatch receipts cannot be promoted or duplicated',async()=>{
 const h=harness(),receipt=validReceipt(),input=inputFor(receipt);
 await h.context.importCaseBriefAnalysisReceipt(input);
 const duplicate=await h.context.importCaseBriefAnalysisReceipt(input);assert.equal(duplicate.status,'duplicate');assert.equal(h.workspace.analysisInbox.length,1);assert.equal(h.saves,1);
 const historical=validReceipt();historical.readOnly=true;assert.equal(await h.context.importCaseBriefAnalysisReceipt(inputFor(historical)),false);
 const remote=validReceipt();remote.result.tenantId='remote-tenant';assert.equal(await h.context.importCaseBriefAnalysisReceipt(inputFor(remote)),false);
 const effects=validReceipt();effects.umg.dispatchCount=1;assert.equal(await h.context.importCaseBriefAnalysisReceipt(inputFor(effects)),false);
 assert.equal(h.workspace.analysisInbox.length,1);assert.equal(h.saves,1);
});

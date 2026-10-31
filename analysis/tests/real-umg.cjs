// Opt-in actual supplied Framework/H4 service check; not part of mock CI.
const assert=require('node:assert/strict');const {buildRequest,invokeLocal}=require('../../integration/umg-runtime-rev2.cjs');const {analyse,rulesProvider,hash}=require('../engine.cjs');
(async()=>{
 const fixture=structuredClone(require('../../integration/runtime-contract-v2/fixtures/supported-contradiction.request.json'));
 const original=await invokeLocal(fixture);assert.equal(original.status,'SUCCEEDED');assert.equal(original.runtime.compilerExecution,'EXECUTED');
 const sources=['The fictional interview began at 03:08.','The fictional interview began at 04:19.'].map((extract,i)=>({sourceId:'new-source-'+i,matterId:fixture.hostContext.matterId,kind:'fictional_text',locator:'synthetic:new-'+i,extract,contentHash:hash(extract),reviewedByHost:true}));
 const request=buildRequest({syntheticOnly:true,hostContext:fixture.hostContext,sources});
 const analysis=await analyse(request,{provider:rulesProvider()});assert.equal(analysis.findings.length,1);
 const wire={...request,candidateFindings:analysis.findings.map(f=>({findingId:f.findingId,category:f.category,statement:f.statement,sourceIds:f.sourceRefs}))};
 const result=await invokeLocal(wire);assert.equal(result.runtime.compilerExecution,'EXECUTED');assert.equal(result.result.acceptedFindings.length,0);assert.equal(result.result.quarantinedFindings.length,1);assert.equal(result.effects.dispatchCount,0);
 console.log(JSON.stringify({check:'Actual supplied UMG service',baselineStatus:original.status,baselineCompiler:original.runtime.compilerExecution,freshAnalysisFindings:analysis.findings.length,freshCompiler:result.runtime.compilerExecution,freshUMGAccepted:result.result.acceptedFindings.length,freshUMGQuarantined:result.result.quarantinedFindings.length,reason:result.result.quarantinedFindings[0].quarantineReason,compileReceipt:result.runtime.compileReceiptId,modelInference:'NOT_RUN'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});

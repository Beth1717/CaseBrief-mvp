'use strict';
const fs=require('node:fs'),path=require('node:path');
const {buildRequest}=require('../integration/umg-runtime-rev2.cjs');
const {analyse,rulesProvider,hash}=require('../analysis/engine.cjs');
const {createOllamaProvider}=require('../analysis/ollama.cjs');
function packetRequest(packet){
 const context=structuredClone(require('../integration/runtime-contract-v2/fixtures/supported-contradiction.request.json').hostContext);
 context.matterId=packet.packetId;context.authorization.expiresAt=new Date(Date.now()+120000).toISOString();
 return buildRequest({syntheticOnly:true,hostContext:context,sources:packet.sources.map(s=>({sourceId:s.id,matterId:packet.packetId,kind:'fictional_text',locator:'synthetic:'+s.id,extract:s.text,contentHash:hash(s.text),reviewedByHost:true}))});
}
async function evaluatePackets({engine='rules',provider,packetDir=path.join(__dirname,'../readiness/review-packets')}={}){
 if(!['rules','ollama'].includes(engine))throw new Error('Supported engines: rules, ollama');
 provider??=engine==='rules'?rulesProvider():createOllamaProvider({model:process.env.CASEBRIEF_OLLAMA_MODEL,endpoint:process.env.CASEBRIEF_OLLAMA_ENDPOINT});
 const rows=[];
 for(const file of fs.readdirSync(packetDir).filter(f=>f.endsWith('.json')).sort()){
  const bytes=fs.readFileSync(path.join(packetDir,file)),packet=JSON.parse(bytes);
  if(packet.syntheticOnly!==true||packet.schemaVersion!=='casebrief.synthetic-review-packet.v1')throw new Error('Synthetic versioned packet required');
  const row={packetId:packet.packetId,packetSha256:hash(bytes),adjudication:packet.adjudication,expectedFindings:null,misses:null,falsePositives:null};
  if(packet.sources.some(s=>s.classification==='privileged_work_product')){
   rows.push({...row,status:'NOT_RUN',reason:'Recipient-release control belongs in the role/access harness; no privileged source sent to analysis.'});continue;
  }
  const result=await analyse(packetRequest(packet),{provider});
  rows.push({...row,status:result.status,provider:result.execution,proposals:result.findings,quarantined:result.quarantined,dispatchCount:result.effects.dispatchCount});
 }
 return {schemaVersion:'casebrief.analysis.coverage-observation.v1',syntheticOnly:true,engine,
  status:'OBSERVED_OUTPUTS_AWAIT_INDEPENDENT_ADJUDICATION',legalAccuracy:null,precision:null,recall:null,
  notice:'Draft prompts and labels are not sent to the provider. Mechanical quote validation is not semantic correctness. NEEDS_INPUT may be a coverage gap, never proof the record has no issue. No attorney results are generated.',rows};
}
module.exports={evaluatePackets,packetRequest};
if(require.main===module)evaluatePackets({engine:process.argv[2]||'rules'}).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e.code||e.message);process.exitCode=1});

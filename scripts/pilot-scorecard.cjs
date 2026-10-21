const fs=require('node:fs');
function scorecard(input){
 if(input.schemaVersion!=='casebrief.pilot-evaluation.v1'||input.syntheticOnly!==true)throw new Error('Only versioned synthetic evaluations are supported.');
 const observations=input.observations, sessions=input.sessions;
 if(!Array.isArray(observations)||!Array.isArray(sessions))throw new Error('Observations and sessions must be arrays.');
 const reviewed=input.adjudication?.status==='reviewed';
 if(!['pending','reviewed'].includes(input.adjudication?.status))throw new Error('Adjudication status is required.');
 if(reviewed&&(!String(input.adjudication.reviewerId||'').trim()||!Number.isFinite(Date.parse(input.adjudication.reviewedAt))))throw new Error('Reviewed results require reviewer identity and date.');
 if(!reviewed&&(observations.length||sessions.length))throw new Error('Do not publish measurements before human adjudication.');
 const seen=new Set();
 for(const row of observations){
  if(!row.id||seen.has(row.id)||!['finding','missing_record'].includes(row.kind)||typeof row.expected!=='boolean'||typeof row.detected!=='boolean'||!String(row.basis||'').trim())throw new Error('Unique observation IDs, kind, booleans and adjudication basis are required.');
  seen.add(row.id);
 }
 const ratio=(a,b)=>b?a/b:null;
 const counts=kind=>{
  const rows=observations.filter(r=>r.kind===kind),tp=rows.filter(r=>r.expected&&r.detected).length,fp=rows.filter(r=>!r.expected&&r.detected).length,fn=rows.filter(r=>r.expected&&!r.detected).length,tn=rows.filter(r=>!r.expected&&!r.detected).length;
  return {observations:rows.length,truePositives:tp,falsePositives:fp,falseNegatives:fn,trueNegatives:tn,precision:ratio(tp,tp+fp),recall:ratio(tp,tp+fn)};
 };
 const sessionIds=new Set();
 for(const s of sessions){
  if(!s.id||sessionIds.has(s.id)||!String(s.packetId||'').trim()||!String(s.reviewerId||'').trim()||!Number.isFinite(s.baselineMinutes)||s.baselineMinutes<=0||!Number.isFinite(s.assistedMinutes)||s.assistedMinutes<0)throw new Error('Paired timing requires unique session, packet, reviewer and valid durations.');
  sessionIds.add(s.id);
 }
 const baseline=sessions.reduce((n,s)=>n+s.baselineMinutes,0),assisted=sessions.reduce((n,s)=>n+s.assistedMinutes,0);
 return {status:reviewed?'human_adjudicated_synthetic_sample':'not_measured',syntheticOnly:true,
  notice:'Human-entered synthetic evaluation; reviewer identity is asserted, not authenticated. Not attorney signoff, calibrated CRI, production qualification or a general accuracy claim.',
  adjudication:input.adjudication,findings:counts('finding'),missingRecords:counts('missing_record'),
  timing:{pairedSessions:sessions.length,baselineMinutes:sessions.length?baseline:null,assistedMinutes:sessions.length?assisted:null,savedMinutes:sessions.length?baseline-assisted:null,reductionFraction:ratio(baseline-assisted,baseline)},
  limits:'Small synthetic samples and repeated-packet learning do not establish live-case effectiveness. Include positive and negative controls; report all misses and false positives.'};
}
module.exports={scorecard};
if(require.main===module){try{const file=process.argv[2];if(!file)throw new Error('Usage: node scripts/pilot-scorecard.cjs evaluation.json');console.log(JSON.stringify(scorecard(JSON.parse(fs.readFileSync(file,'utf8'))),null,2))}catch(e){console.error(e.message);process.exitCode=1}}

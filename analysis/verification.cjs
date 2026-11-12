'use strict';
// Quote linkage, semantic support and attorney signoff are independent claims.
function verification(finding,events=[]){
 const history=events.filter(e=>e.findingId===finding.findingId);
 const assessment=history.filter(e=>e.action==='SUPPORT_ASSESSED').at(-1);
 const disposition=history.filter(e=>['CONFIRMED','DISMISSED','REOPENED'].includes(e.action)).at(-1);
 return {sourceLink:'EXACT_QUOTES_VERIFIED',
  propositionSupport:assessment?.assessment||'UNASSESSED',
  disposition:disposition?.action||'HUMAN_REVIEW_REQUIRED',
  assessedBy:assessment?.actor||null,assessmentEventId:assessment?.id||null,
  attorneyValidation:'NOT_ESTABLISHED',
  notice:'Local human assessment is self-asserted; this workspace does not verify professional credentials.'};
}
module.exports={verification};

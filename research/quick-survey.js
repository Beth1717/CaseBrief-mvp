'use strict';
document.getElementById('download').onclick=()=>{
 const answers=Object.fromEntries(new FormData(document.getElementById('survey')));
 const payload={schemaVersion:'casebrief.workflow-research.v2',createdAt:new Date().toISOString(),answers,notice:'Self-reported research response; no purchase commitment or permission for attributable publication.'};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download='casebrief-workflow-answers.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 document.getElementById('status').textContent='Answers downloaded. Return the file only through the channel agreed with the researcher.';
};
document.getElementById('survey').addEventListener('reset',()=>{document.getElementById('status').textContent='Answers cleared.'});

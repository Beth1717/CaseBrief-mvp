'use strict';
const {performance}=require('node:perf_hooks');
const boot=require('../tests/helpers/application.cjs');
const {run}=boot();const rows=[];
for(const count of [100,1000,5000]){
 run(`data.documents=Array.from({length:${count}},(_,i)=>({id:'scale-'+i,title:'Fictional record '+i,type:'Synthetic',date:'2026-07-10',excerpt:'Fictional text '+i,reviewed:false}));documentLibraryState.query='';documentLibraryState.page=0`);
 let started=performance.now();const html=run('documents()');const renderMs=performance.now()-started;
 started=performance.now();run(`updateDocumentSearch('Fictional text ${count-1}')`);const searchMs=performance.now()-started;
 rows.push({documents:count,initialRowsRendered:Math.min(count,50),htmlBytes:Buffer.byteLength(html),renderMs,searchMs,matchingRows:run('documentPage().total')});
}
console.log(JSON.stringify({scope:'Synthetic Node/minimal-DOM measurements; actual browser measures are separate. Not model throughput or legal review time.',runtime:process.version,rows},null,2));

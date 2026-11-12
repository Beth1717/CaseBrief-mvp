// Bound the rendered document list; authorise records before search or pagination.
const DOCUMENT_PAGE_SIZE=50;
let documentLibraryState={matterId:null,profile:null,query:'',page:0};
function documentPage(){
 if(documentLibraryState.matterId!==data.matter.id||documentLibraryState.profile!==activeSecurityProfile){
  documentLibraryState={matterId:data.matter.id,profile:activeSecurityProfile,query:'',page:0};
 }
 const query=documentLibraryState.query.toLowerCase();
 const allowed=data.documents.filter(canAccessDocument);
 const matching=allowed.filter(d=>!query||[d.title,d.type,d.excerpt].some(x=>String(x||'').toLowerCase().includes(query)));
 const pages=Math.max(1,Math.ceil(matching.length/DOCUMENT_PAGE_SIZE));
 documentLibraryState.page=Math.min(Math.max(0,documentLibraryState.page),pages-1);
 const start=documentLibraryState.page*DOCUMENT_PAGE_SIZE;
 return {rows:matching.slice(start,start+DOCUMENT_PAGE_SIZE),total:matching.length,start,pages,page:documentLibraryState.page};
}
function documentPageHtml(){
 const p=documentPage();
 return `<p role="status" aria-live="polite">${p.total?`${p.start+1}–${p.start+p.rows.length}`:'0'} of ${p.total} permitted matching records</p><div class="tablewrap"><table><thead><tr><th>Document</th><th>Classification</th><th>Type</th><th>Date</th><th>Status</th></tr></thead><tbody>${p.rows.map((d,index)=>`<tr><td><button class="linkbtn" onclick="openDocumentPageRecord(${index})">${esc(d.title)}</button><small class="muted"> · ${esc(d.id)}</small><div class="muted">${esc(String(d.excerpt||'').slice(0,240))}</div></td><td>${esc(documentClassification(d))}</td><td>${esc(d.type)}</td><td>${esc(d.date)}</td><td>${d.reviewed?'Reviewed':'Unreviewed'}</td></tr>`).join('')||'<tr><td colspan="5">No records available to this role and search.</td></tr>'}</tbody></table></div><div class="row"><button class="btn" onclick="changeDocumentPage(-1)" ${p.page===0?'disabled':''}>Previous documents</button><span>Page ${p.page+1} of ${p.pages}</span><button class="btn" onclick="changeDocumentPage(1)" ${p.page+1>=p.pages?'disabled':''}>Next documents</button></div>`;
}
function openDocumentPageRecord(index){
 if(!applicationAllowed()||sessionLocked||privacyMode||!can('case_view')||!Number.isInteger(index)||index<0||index>=DOCUMENT_PAGE_SIZE)return false;
 const record=documentPage().rows[index];return record?openDetail('document',record.id):false;
}
function updateDocumentSearch(query){
 if(!applicationAllowed()||sessionLocked||privacyMode||!can('case_view'))return false;
 documentLibraryState.query=String(query).slice(0,200);documentLibraryState.page=0;
 document.getElementById('documentResults').innerHTML=documentPageHtml();return true;
}
function changeDocumentPage(delta){
 if(!applicationAllowed()||sessionLocked||privacyMode||!can('case_view')||![-1,1].includes(delta))return false;
 documentLibraryState.page+=delta;document.getElementById('documentResults').innerHTML=documentPageHtml();return true;
}
const _pagedDocuments=documents;
documents=function(){
 if(!can('case_view'))return _pagedDocuments();
 documentPage();
 return `<div class="kicker">Document Library</div><h2>Case documents</h2><p class="muted">Open a document to inspect its full indexed text. Search is limited to records permitted to your current role.</p><label for="documentSearch">Search permitted documents</label><input id="documentSearch" maxlength="200" value="${esc(documentLibraryState.query)}" oninput="updateDocumentSearch(this.value)"><section id="documentResults">${documentPageHtml()}</section>`+(isIdahoPilot()&&can('review_decisions')?'<div class="row investor-actions"><button class="btn" onclick="openPilotFamilyAccess()">Family access</button></div>':'');
};
render();

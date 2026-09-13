function freshWorkspace(){return {version:3,active:'matter-001',cases:{'matter-001':structuredClone(primarySeed),'matter-002':structuredClone(intakeSeed)},events:[]}}
let workspace;try{workspace=JSON.parse(localStorage.getItem(STORE));if(!workspace||workspace.version!==3)workspace=freshWorkspace()}catch{workspace=freshWorkspace();storageOK=false}
let data=workspace.cases[workspace.active]||workspace.cases['matter-001'];
function ensureDefaults(d){for(const [k,v] of Object.entries({documents:[],evidence:[],witnesses:[],timeline:[],issues:[],authorities:[],contacts:[],messages:[],assistantMessages:[],drafts:[]})){if(!Array.isArray(d[k]))d[k]=structuredClone(v)}if(typeof d.matter.courtStage!=='number')d.matter.courtStage=0}
Object.values(workspace.cases).forEach(ensureDefaults);
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(workspace));storageOK=true}catch{storageOK=false}updateStorageNotice()}
function save(){workspace.cases[data.matter.id]=data;persist()}
function record(action,target,details={},outcome='success',initiator=currentIdentity()){workspace.events.push({id:crypto.randomUUID(),at:new Date().toISOString(),matterId:data.matter.id,sessionId,actor:{...initiator},action,target,outcome,details});persist()}
function isUnresolved(x){return x.status==='open'||x.status==='reviewed'}
function score(){return Math.max(0,100-data.issues.filter(isUnresolved).reduce((s,x)=>s+(Number(x.weight)||0),0))}
function factorGroups(){const groups={};for(const x of data.issues.filter(isUnresolved)){const k=x.category.replaceAll('_',' ');groups[k]=(groups[k]||0)+(Number(x.weight)||0)}return Object.entries(groups).sort((a,b)=>b[1]-a[1])}
function factorSummary(full=false){const rows=factorGroups();if(!rows.length)return '<div class="muted small">No scored factors.</div>';const shown=full?rows:rows.slice(0,10);return `<div class="${full?'list':'factorgrid'}">${shown.map(([k,v])=>full?`<div class="item"><div class="row" style="justify-content:space-between"><b>${esc(k)}</b><b class="warn">−${v}%</b></div><div class="small muted">Combined effect of unresolved ${esc(k)} factors on the current prototype CRI.</div></div>`:`<span class="factorline"><span>${esc(k)}</span><b>−${v}%</b></span>`).join('')}</div>`}
function srcChips(arr=[]){return arr.map(id=>{const d=data.documents.find(x=>x.id===id);if(d&&!canAccessDocument(d))return `<span class="pill restricted" title="Blocked by active role">Restricted source</span>`;return `<button class="pill source" onclick="event.stopPropagation();openDetail('document','${esc(id)}')">${esc(d?d.title:id)}</button>`}).join('')}
function fmtDate(v){if(!v)return 'Not recorded';const d=new Date(v);return Number.isNaN(d.valueOf())?esc(v):d.toLocaleString([], {year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}
function updateStorageNotice(){let el=document.getElementById('storageNotice');if(!el){el=document.createElement('div');el.id='storageNotice';el.className='callout notice';document.querySelector('.layout').before(el)}el.hidden=storageOK;el.textContent='Browser storage is unavailable. Changes are only retained for this tab session.'}
function syncPicker(){document.getElementById('casePicker').innerHTML=Object.values(workspace.cases).map(c=>`<option value="${c.matter.id}" ${c.matter.id===data.matter.id?'selected':''}>${esc(c.matter.title)}</option>`).join('')}
function switchCase(id){if(!workspace.cases[id]||!requirePermission('case_view',`case:${id}`))return;const from=data.matter.id;closeDetail();data=workspace.cases[id];ensureDefaults(data);workspace.active=id;record('case.switched',id,{from,to:id});syncPicker();showView('dashboard')}
const VIEW_PERMISSIONS={dashboard:'case_view',review:'review_decisions',timeline:'case_view',evidence:'case_view',witnesses:'case_view',documents:'case_view',authorities:'authority_research',assistant:'ai_use',drafting:'drafting',communications:'case_view',umg:'security_admin',audit:'audit_view',safeguards:'case_view',security:'case_view',survey:null,landing:null};
function nav(){
 const groups=[
  ['Matter',['dashboard','review','timeline','evidence','witnesses','documents','authorities']],
  ['Work',['assistant','drafting','communications']],
  ['Trust',['security','audit','safeguards']],
  ['System',['umg']],
  ['Research',['landing','survey']]
 ];
 const labels={dashboard:'Case Overview',review:'Review Queue',timeline:'Court + Chronology',evidence:'Evidence',witnesses:'Witnesses',documents:'Documents',authorities:'Law & Authority',assistant:'AI Assistant',drafting:'Drafting Studio',communications:'Communications',security:'Security Center',umg:'UMG Runtime',audit:'Activity History',safeguards:'Safeguards',landing:'Public View',survey:'Attorney Survey'};
 document.getElementById('sidebar').innerHTML=groups.map(([g,items])=>`<div class="navgroup">${g}</div>${items.map(i=>{const perm=VIEW_PERMISSIONS[i],allowed=!perm||can(perm);return `<button class="navbtn ${current===i?'active':''} ${allowed?'':'navlocked'}" onclick="showView('${i}')">${allowed?'':'🔒 '}${labels[i]}</button>`}).join('')}`).join('');
 const rc=document.getElementById('roleControl');if(rc)rc.innerHTML=securityRoleControl();applySecurityUI();syncPrivacyShield();syncLockScreen();
}
function showView(v){const perm=VIEW_PERMISSIONS[v];if(perm&&!requirePermission(perm,`view:${v}`))return;current=v;record('view.opened',v);nav();render()}
function courtProgress(compact=false){const idx=Math.max(0,Math.min(stages.length-1,data.matter.courtStage||0));return `<div class="court-shell"><div class="court-track">${stages.map((s,i)=>`<div class="stage ${i<idx?'done':''} ${i===idx?'current':''} clickable" tabindex="0" onclick="openDetail('courtstage','${i}')"><div class="stage-dot"></div><div class="stage-name">${esc(s)}</div>${compact?'':`<div class="stage-sub">${i<idx?'completed':i===idx?'current stage':'upcoming'}</div>`}</div>`).join('')}</div></div>`}

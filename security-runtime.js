// Security enforcement wrappers for the static MVP. These are meaningful client-side controls for demonstration,
// but production authorization must also be enforced server-side.
const _baseRender=render;
render=function(){if(!applicationAllowed())return blockApplication();const map={landing,dashboard,review,timeline,evidence,witnesses,documents,authorities,assistant,drafting,communications,umg,audit:activityHistory,safeguards,security:securityCenter,survey};const fn=map[current]||dashboard;document.getElementById('app').innerHTML=fn();updateStorageNotice();applySecurityUI();syncPrivacyShield();syncLockScreen()};

const _baseOpenDetail=openDetail;
openDetail=function(type,id){
 if(type==='document'){const d=data.documents.find(x=>x.id===id);if(!canAccessDocument(d))return securityDenied('privileged_work_product',`document:${id}`)}
 if(type==='authority'&&!requirePermission('authority_research',`authority:${id}`))return;
 if(type==='issue'&&!can('review_decisions')&&activeSecurityProfile==='client')return securityDenied('review_decisions',`issue:${id}`);
 return _baseOpenDetail(type,id)
};

const _baseBeginIssueDecision=beginIssueDecision;
beginIssueDecision=function(id,status){if(!requirePermission('review_decisions',`issue-decision:${id}`))return;return _baseBeginIssueDecision(id,status)};
const _baseToggleDocument=toggleDocument;
toggleDocument=function(id){if(!requirePermission('review_decisions',`document-review:${id}`))return;return _baseToggleDocument(id)};
const _baseMarkAuthorityVerified=markAuthorityVerified;
markAuthorityVerified=function(id){if(!requirePermission('authority_research',`authority-verify:${id}`))return;return _baseMarkAuthorityVerified(id)};

const _baseDocuments=documents;
documents=function(){const visible=data.documents.filter(canAccessDocument);const blocked=data.documents.length-visible.length;return `<div class="kicker">Document Library</div><div class="row" style="justify-content:space-between"><div><h2>Case documents</h2><p class="muted">Visibility is filtered by the active role before records are displayed.</p></div>${blocked?`<span class="pill restricted">${blocked} restricted</span>`:''}</div><div class="tablewrap"><table><thead><tr><th>Document</th><th>Classification</th><th>Type</th><th>Date</th><th>Status</th></tr></thead><tbody>${visible.map(d=>`<tr class="clickable" tabindex="0" onclick="openDetail('document','${d.id}')"><td><button class="linkbtn">${esc(d.title)}</button><div class="muted">${esc(d.excerpt)}</div></td><td><span class="pill ${documentClassification(d)==='privileged'?'high':'low'}">${esc(documentClassification(d))}</span></td><td>${esc(d.type)}</td><td>${esc(d.date)}</td><td><span class="pill ${d.reviewed?'low':'medium'}">${d.reviewed?'Reviewed':'Unreviewed'}</span></td></tr>`).join('')||'<tr><td colspan="5" class="muted">No documents available to this role.</td></tr>'}</tbody></table></div>`};

askAI=function(e){
 e.preventDefault();if(!requirePermission('ai_use','ai:question'))return;
 const input=document.getElementById('aiPrompt');const q=(input?.value||'').trim();if(!q)return;
 data.assistantMessages.push({role:'user',at:new Date().toISOString(),text:q});
 record('ai.question_asked','assistant',{promptChars:q.length,contentExcludedFromAudit:true,role:currentProfile().role});
 const res=simulateAI(q),allowed=permittedSourceIds(res.sources||[]),blocked=(res.sources||[]).filter(x=>!allowed.includes(x));
 const text=blocked.length?`${res.text}\n\nSecurity note: ${blocked.length} source${blocked.length===1?' was':'s were'} withheld because the active role is not permitted to retrieve them.`:res.text;
 data.assistantMessages.push({role:'ai',at:new Date().toISOString(),text,sources:allowed});
 record('ai.response_generated','assistant',{sourceIds:allowed,blockedSourceCount:blocked.length,simulated:true},'success',systemActor);save();render();
 setTimeout(()=>{const box=document.getElementById('chatbox');if(box)box.scrollTop=box.scrollHeight},0)
};
const _baseSimulateAI=simulateAI;
simulateAI=function(q){const accessible=data.documents.filter(canAccessDocument);if(!accessible.length)return {text:'Your current role has no source records available for AI retrieval in this matter.',sources:[]};const res=_baseSimulateAI(q);res.sources=permittedSourceIds(res.sources||[]);return res};

const _baseGenerateDraft=generateDraft;
generateDraft=function(e){if(!requirePermission('drafting','draft:generate')){e?.preventDefault?.();return}return _baseGenerateDraft(e)};
const _baseOpenDraft=openDraft;
openDraft=function(id){if(!requirePermission('drafting',`draft:${id}`))return;return _baseOpenDraft(id)};
copyLatestDraft=function(){const d=data.drafts.at(-1);if(!d||!requirePermission('export','draft:copy'))return;confirmSensitiveAction('copy draft','Copy privileged draft text to the operating-system clipboard.',()=>copyText(d.body))};
copyDraftById=function(id){const d=data.drafts.find(x=>x.id===id);if(!d||!requirePermission('export',`draft-copy:${id}`))return;confirmSensitiveAction('copy draft','Copy privileged draft text to the operating-system clipboard.',()=>copyText(d.body))};
const _rawCopyText=copyText;
copyText=async function(text){record('data.egress_attempt','clipboard',{chars:text.length,classification:'legal-work-product',contentExcluded:true});return _rawCopyText(text)};

const _baseOpenCompose=openCompose;
openCompose=function(contactId){const c=data.contacts.find(x=>x.id===contactId);const perm=communicationPermission(c);if(!requirePermission(perm,`communication:${contactId||'new'}`))return;if(activeSecurityProfile==='client'&&c&&c.role!=='Lead attorney')return securityDenied('communications_client',`communication:${contactId}`);return _baseOpenCompose(contactId)};
const _baseSendDemoMessage=sendDemoMessage;
sendDemoMessage=function(e){const c=data.contacts.find(x=>x.id===document.getElementById('msgTo')?.value);const perm=communicationPermission(c);if(activeSecurityProfile==='client'&&c&&c.role!=='Lead attorney'){e.preventDefault();return securityDenied('communications_client',`communication-send:${c.id}`)}if(!requirePermission(perm,`communication-send:${c?.id||'unknown'}`)){e.preventDefault();return}const body=document.getElementById('msgBody')?.value||'';record('communication.content_prepared',c?.id||'unknown',{chars:body.length,contentExcludedFromAudit:true});return _baseSendDemoMessage(e)};

exportActivity=function(){if(!requirePermission('export','audit:export'))return;confirmSensitiveAction('audit export','Export this matter’s activity metadata to a local JSON file. Message bodies and AI prompts are intentionally excluded from semantic audit fields where possible.',()=>{record('audit.export_confirmed',data.matter.id,{role:currentProfile().role});const payload={notice:'Browser-local MVP audit export — not a production evidentiary audit record',matterId:data.matter.id,exportedBy:currentIdentity(),exportedAt:new Date().toISOString(),events:workspace.events.filter(e=>e.matterId===data.matter.id)};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`casebrief-${data.matter.id}-activity.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)})};

const _baseCommunications=communications;
communications=function(){if(!can('communications_client')&&!can('communications_team'))return `<div class="kicker">Protected workspace</div><h2>Communications</h2><div class="callout notice">This role does not have messaging permission for this matter.</div>`;if(activeSecurityProfile!=='client')return _baseCommunications();const counsel=data.contacts.filter(c=>c.role==='Lead attorney');const history=data.messages.filter(m=>m.to===data.matter.client||m.from===data.matter.client||m.to===data.matter.attorney||m.from===data.matter.attorney);return `<div class="kicker">Secure client communication workspace</div><h2>Messages with counsel</h2><p class="muted">Client view is restricted to counsel communication; internal team contacts are hidden.</p><div class="grid"><div class="card c5"><h3>Your legal team</h3>${counsel.map(c=>`<div class="item contact"><div class="contact-main"><b>${esc(c.name)}</b><div class="muted">${esc(c.role)}</div></div><button class="btn sm" onclick="openCompose('${c.id}')">Message counsel</button></div>`).join('')||'<p class="muted">No counsel contact available.</p>'}</div><div class="card c7"><h3>Communication history</h3><div class="list">${history.slice().reverse().map(m=>`<div class="item message-row"><div class="when">${fmtDate(m.at)}</div><div><b>${esc(m.subject||'Message')}</b><div class="muted">${esc(m.from)} → ${esc(m.to)} • ${esc(m.channel)}</div><p>${esc(m.body)}</p><div class="meta">${esc(m.status)}</div></div></div>`).join('')||'<p class="muted">No client-counsel messages yet.</p>'}</div></div></div>`};

record('security.controls_initialized','session',{role:currentProfile().role,idleLockMinutes:SESSION_IDLE_MS/60000,clientSideDemo:true});nav();render();

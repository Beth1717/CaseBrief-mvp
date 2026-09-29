// Founding Pilot, Access & Trust, and Case Ingestion prototype surfaces.
// IMPORTANT: this public GitHub Pages build uses synthetic data only. Production enforcement must be server-side.

const PILOT_LABEL='Paid Founding Pilot';
const SYNTHETIC_INGEST_FIXTURES={
 court_initial:{
  sourceClass:'court_record',
  title:'Synthetic court docket snapshot',
  externalRef:'DEMO-COURT-2026-001',
  payload:'DEMO COURT SNAPSHOT|State v. Jordan Hale|CR-2026-1841|motions due 2026-08-26|synthetic only',
  facts:[
   {predicate:'case_number',value:'CR-2026-1841',locator:'docket header'},
   {predicate:'motion_deadline',value:'2026-08-26',locator:'scheduling entry'}
  ]
 },
 firm_packet:{
  sourceClass:'firm_file',
  title:'Synthetic discovery packet manifest',
  externalRef:'DEMO-FIRM-1841-A',
  payload:'DEMO FIRM PACKET|incident report|evidence log|witness interview|synthetic only',
  facts:[
   {predicate:'packet_contains',value:'Incident Report 26-1841',locator:'manifest item 1'},
   {predicate:'packet_contains',value:'Property & Evidence Log',locator:'manifest item 2'}
  ]
 },
 human_note:{
  sourceClass:'human_entered',
  title:'Synthetic attorney verification note',
  externalRef:'DEMO-HUMAN-VERIFY-1',
  payload:'DEMO HUMAN NOTE|deadline checked against scheduling order|synthetic only',
  facts:[
   {predicate:'human_verification',value:'Motion deadline checked against source document',locator:'verification note'}
  ]
 },
 court_delta:{
  sourceClass:'court_record',
  title:'Synthetic court docket delta',
  externalRef:'DEMO-COURT-2026-002',
  payload:'DEMO COURT DELTA|new motion filed|2026-08-18|synthetic only',
  facts:[
   {predicate:'new_docket_event',value:'Motion filed',locator:'new docket entry'},
   {predicate:'event_date',value:'2026-08-18',locator:'new docket entry'}
  ]
 }
};

function ensureIngestionState(d){
 if(!d.ingestion||typeof d.ingestion!=='object')d.ingestion={sources:[],assertions:[],syncs:[]};
 if(!Array.isArray(d.ingestion.sources))d.ingestion.sources=[];
 if(!Array.isArray(d.ingestion.assertions))d.ingestion.assertions=[];
 if(!Array.isArray(d.ingestion.syncs))d.ingestion.syncs=[];
}
Object.values(workspace.cases).forEach(ensureIngestionState);
ensureIngestionState(data);

function sourceClassLabel(v){
 return ({court_record:'Court record',firm_file:'Firm-provided file',human_entered:'Human-entered verification',casebrief_derived:'CaseBrief-derived'})[v]||String(v||'Source').replaceAll('_',' ');
}
function shortHash(v){return v?String(v).slice(0,16)+'…':'Pending'}
function utf8Bytes(text){
 const encoded=unescape(encodeURIComponent(String(text)));
 const bytes=new Uint8Array(encoded.length);
 for(let i=0;i<encoded.length;i++)bytes[i]=encoded.charCodeAt(i);
 return bytes;
}
async function sha256Text(text){
 const buf=await crypto.subtle.digest('SHA-256',utf8Bytes(text));
 return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function ingestionStats(){
 ensureIngestionState(data);
 return {
  sources:data.ingestion.sources.length,
  verified:data.ingestion.sources.filter(s=>s.validationStatus==='verified').length,
  quarantined:data.ingestion.sources.filter(s=>s.validationStatus==='quarantined').length,
  assertions:data.ingestion.assertions.length,
  syncs:data.ingestion.syncs.length
 };
}
function provenanceRows(){
 ensureIngestionState(data);
 if(!data.ingestion.sources.length)return '<div class="item"><b>No imported sources yet.</b><div class="muted">Use a synthetic import above to preview provenance, quarantine, hashing, verification, duplicate handling, and audit events.</div></div>';
 return data.ingestion.sources.slice().reverse().map(function(s){
  return '<div class="item"><div class="row" style="justify-content:space-between"><div><span class="pill">'+esc(sourceClassLabel(s.sourceClass))+'</span><span class="pill '+(s.validationStatus==='verified'?'low':'medium')+'">'+esc(s.validationStatus)+'</span></div><span class="small muted">'+esc(fmtDate(s.acquiredAt))+'</span></div><h3>'+esc(s.title)+'</h3><div class="detailgrid"><div class="detailbox"><span class="muted">External/source reference</span><b>'+esc(s.externalRef)+'</b></div><div class="detailbox"><span class="muted">Integrity</span><b>SHA-256 '+esc(shortHash(s.integrityHash))+'</b></div><div class="detailbox"><span class="muted">Acquired by</span><b>'+esc(s.acquiredBy)+'</b></div><div class="detailbox"><span class="muted">Derived assertions</span><b>'+String(s.assertionCount||0)+'</b></div></div>'+(s.validationStatus==='quarantined'?'<button class="btn good" onclick="verifyIngestedSource(\''+esc(s.id)+'\')">Verify source for case use</button>':'')+'</div>';
 }).join('');
}
function assertionRows(){
 ensureIngestionState(data);
 if(!data.ingestion.assertions.length)return '<p class="muted">No source-derived assertions yet.</p>';
 return data.ingestion.assertions.slice().reverse().slice(0,12).map(function(a){
  const src=data.ingestion.sources.find(s=>s.id===a.sourceId);
  return '<div class="item"><b>'+esc(a.predicate.replaceAll('_',' '))+'</b><div>'+esc(a.value)+'</div><div class="meta">Source: '+esc(src?src.title:a.sourceId)+' • Locator: '+esc(a.locator)+' • '+(a.humanVerified?'human verified':'source-derived, not yet human verified')+'</div></div>';
 }).join('');
}
async function ingestSyntheticSource(fixtureKey){
 if(!requirePermission('ingestion_manage','ingestion:'+fixtureKey))return;
 ensureIngestionState(data);
 const f=SYNTHETIC_INGEST_FIXTURES[fixtureKey];if(!f)return;
 const hash=await sha256Text(f.payload);
 const duplicate=data.ingestion.sources.find(s=>s.integrityHash===hash);
 if(duplicate){
  record('ingestion.duplicate_detected',duplicate.id,{sourceClass:f.sourceClass,externalRef:f.externalRef,integrityAlgorithm:'SHA-256',integrityHash:hash});
  showSecurityNotice('Duplicate source detected. The existing source was kept; no second copy was created.');
  render();return;
 }
 const id='source-'+crypto.randomUUID();
 const source={id:id,sourceClass:f.sourceClass,title:f.title,externalRef:f.externalRef,acquiredAt:new Date().toISOString(),acquiredBy:currentIdentity().name,integrityAlgorithm:'SHA-256',integrityHash:hash,validationStatus:'quarantined',assertionCount:f.facts.length};
 data.ingestion.sources.push(source);
 f.facts.forEach(function(fact){
  data.ingestion.assertions.push({id:'assertion-'+crypto.randomUUID(),sourceId:id,predicate:fact.predicate,value:fact.value,locator:fact.locator,extractedAt:new Date().toISOString(),extractedBy:'CaseBrief ingestion demo',humanVerified:false});
 });
 record('ingestion.source_imported',id,{sourceClass:f.sourceClass,externalRef:f.externalRef,integrityAlgorithm:'SHA-256',assertionCount:f.facts.length,quarantined:true});
 save();render();showSecurityNotice('Synthetic source imported to quarantine with provenance and SHA-256 integrity metadata.');
}
function verifyIngestedSource(id){
 if(!requirePermission('ingestion_manage','ingestion-verify:'+id))return;
 ensureIngestionState(data);const s=data.ingestion.sources.find(x=>x.id===id);if(!s)return;
 const before=s.validationStatus;s.validationStatus='verified';s.verifiedAt=new Date().toISOString();s.verifiedBy=currentIdentity().name;
 data.ingestion.assertions.filter(a=>a.sourceId===id).forEach(a=>a.humanVerified=true);
 record('ingestion.source_verified',id,{before:before,after:'verified',sourceClass:s.sourceClass,externalRef:s.externalRef});
 save();render();
}
async function runSyntheticCourtSync(){
 if(!requirePermission('ingestion_manage','court-sync'))return;
 ensureIngestionState(data);
 const started=new Date().toISOString();
 const before=data.ingestion.sources.length;
 await ingestSyntheticSource('court_delta');
 const added=data.ingestion.sources.length>before?1:0;
 data.ingestion.syncs.push({id:'sync-'+crypto.randomUUID(),at:new Date().toISOString(),startedAt:started,provider:'Synthetic court connector',added:added,changed:0,removed:0});
 record('ingestion.court_sync_completed','court-sync',{added:added,changed:0,removed:0,provider:'synthetic'});
 save();render();
}
function caseIngestion(){
 ensureIngestionState(data);const s=ingestionStats();
 return '<div class="kicker">Case Ingestion Engine</div><div class="row" style="justify-content:space-between;align-items:flex-start"><div><h2>Build the case from traceable sources</h2><p class="muted">Court records, firm files, and human-entered verification remain distinct. Original sources are preserved; CaseBrief-derived assertions point back to them.</p></div><span class="pill medium">Synthetic demo only</span></div>'+
 '<p class="callout notice"><b>Do not enter real client information in this public MVP.</b> Production ingestion requires authenticated organizations, malware scanning, encrypted storage, server-side authorization, retention controls, and approved court/provider integrations.</p>'+
 '<div class="grid"><div class="card c3"><div class="kicker">Sources</div><div class="metric">'+s.sources+'</div></div><div class="card c3"><div class="kicker">Verified</div><div class="metric">'+s.verified+'</div></div><div class="card c3"><div class="kicker">Quarantined</div><div class="metric">'+s.quarantined+'</div></div><div class="card c3"><div class="kicker">Assertions</div><div class="metric">'+s.assertions+'</div></div></div>'+
 '<div class="grid" style="margin-top:14px"><div class="card c6"><h3>1. Case shell</h3><div class="detailgrid"><div class="detailbox"><span class="muted">Jurisdiction</span><b>'+esc(data.matter.jurisdiction)+'</b></div><div class="detailbox"><span class="muted">Case number</span><b>'+esc(data.matter.number)+'</b></div><div class="detailbox"><span class="muted">Matter</span><b>'+esc(data.matter.title)+'</b></div><div class="detailbox"><span class="muted">Authorization</span><b>Matter-scoped</b></div></div><button class="btn" onclick="switchCase(\'matter-002\')">Open empty synthetic intake case</button></div>'+
 '<div class="card c6"><h3>2. Import sources</h3><p class="muted">Incoming material enters quarantine first. Duplicate detection is based on source integrity hash.</p><div class="row"><button class="btn primary" onclick="ingestSyntheticSource(\'court_initial\')">Import synthetic court record</button><button class="btn" onclick="ingestSyntheticSource(\'firm_packet\')">Import synthetic firm packet</button><button class="btn" onclick="ingestSyntheticSource(\'human_note\')">Add synthetic verification note</button><button class="btn" onclick="runSyntheticCourtSync()">Run court refresh</button></div></div>'+
 '<div class="card c7"><div class="row" style="justify-content:space-between"><div><div class="kicker">Source provenance ledger</div><h3>Original source custody + validation</h3></div><span class="pill">'+s.syncs+' sync'+(s.syncs===1?'':'s')+'</span></div><div class="list">'+provenanceRows()+'</div></div>'+
 '<div class="card c5"><div class="kicker">Derived facts</div><h3>Assertions remain source-linked</h3><p class="muted">Conflicting assertions coexist until an authorized human resolves or contextualizes them. CaseBrief does not silently overwrite one source with another.</p><div class="list">'+assertionRows()+'</div></div></div>';
}
function pilotAccess(){
 return '<div class="kicker">CaseBrief '+PILOT_LABEL+'</div><h2>Approval-only access before general release</h2><p class="metric" style="font-size:24px">Request access. Get verified. Receive an invitation.</p>'+
 '<p class="muted">There is no public self-service account creation in the pilot and no “free trial” language. Participation is paid and subject to professional/organization verification and approval.</p>'+
 '<div class="gateflow"><div class="gate"><b>1</b><span>Request pilot access</span></div><div class="gate"><b>2</b><span>Verify professional identity / organization</span></div><div class="gate"><b>3</b><span>CaseBrief approval</span></div><div class="gate"><b>4</b><span>Pilot agreement + payment</span></div><div class="gate"><b>5</b><span>Single-use expiring invitation</span></div><div class="gate"><b>6</b><span>MFA / passkey enrollment</span></div><div class="gate"><b>7</b><span>Organization + matter authorization</span></div></div>'+
 '<div class="grid" style="margin-top:14px"><div class="card c6"><h3>What a request collects</h3><ul><li>Name and professional role</li><li>Organization and work email</li><li>Jurisdiction / practice context</li><li>Bar information when applicable</li></ul><p class="callout notice">No client facts, case files, or confidential matter information belong on the public marketing-site application.</p></div><div class="card c6"><h3>What approval does not do</h3><ul><li>It does not grant access to every organization matter.</li><li>It does not bypass MFA.</li><li>It does not turn a marketing-site account into a case-data account.</li><li>It does not permit external users to search for clients/cases.</li></ul></div></div>'+
 '<div class="row" style="margin-top:14px"><button class="btn primary" onclick="showView(\'access\')">Preview Access & Trust controls</button><button class="btn" onclick="showView(\'landing\')">Back to product overview</button></div>';
}
function accessTrust(){
 const profiles=Object.entries(SECURITY_PROFILES).map(function(entry){
  const key=entry[0],p=entry[1],matters=(p.matterIds||[]).map(id=>workspace.cases[id]?.matter?.title||id).join(', ')||'None';
  return '<tr><td>'+esc(p.role)+'</td><td>'+esc(p.verification||'demo only')+'</td><td>'+esc(matters)+'</td><td>'+(p.permissions.includes('ingestion_manage')?'Yes':'No')+'</td></tr>';
 }).join('');
 return '<div class="kicker">Access & Trust</div><h2>Identity → organization → matter authorization</h2><p class="callout"><b>Production rule:</b> hiding a button is never authorization. Every protected request must be enforced server-side against the authenticated identity, organization membership, matter assignment, and permission.</p>'+
 '<div class="grid"><div class="card c4"><h3>Identity gate</h3><p class="muted">Approved invite, verified email/domain, MFA/passkey, session controls.</p></div><div class="card c4"><h3>Organization gate</h3><p class="muted">User must belong to the approved firm/office/agency tenant.</p></div><div class="card c4"><h3>Matter gate</h3><p class="muted">Organization membership alone does not grant access to every case.</p></div></div>'+
 '<div class="card" style="margin-top:14px"><h3>Demo authorization matrix</h3><div class="tablewrap"><table><thead><tr><th>Role</th><th>Verification</th><th>Authorized matters</th><th>May ingest</th></tr></thead><tbody>'+profiles+'</tbody></table></div></div>'+
 '<div class="card" style="margin-top:14px"><h3>Production controls required before real case data</h3><div class="row"><span class="pill">server-side auth</span><span class="pill">MFA / passkeys</span><span class="pill">tenant isolation</span><span class="pill">matter ACLs</span><span class="pill">invite expiry</span><span class="pill">audit log</span><span class="pill">encryption</span><span class="pill">malware scanning</span><span class="pill">secrets management</span><span class="pill">vendor/model controls</span></div></div>';
}

// Make the public landing page point to the paid, approval-only pilot without collecting data in this static build.
const _landingBeforePilot=landing;
landing=function(){
 const base=_landingBeforePilot();
 return base.replace('<div class="row"><button class="btn primary" onclick="showView(\'dashboard\')">Open demo workspace</button><button class="btn" onclick="showView(\'assistant\')">Try case AI</button></div>',
 '<div class="row"><button class="btn primary" onclick="showView(\'dashboard\')">Open synthetic demo</button><button class="btn" onclick="showView(\'pilot\')">Request Pilot Access</button><button class="btn" onclick="showView(\'assistant\')">Try case AI</button></div>')+
 '<div class="card" style="margin-top:14px"><div class="kicker">Paid Founding Pilot</div><div class="row" style="justify-content:space-between"><div><h3>Approval-only onboarding</h3><p class="muted">Pilot users are verified and individually invited. No public self-service signup and no free-trial wording.</p></div><button class="btn" onclick="showView(\'pilot\')">See pilot access model</button></div></div>';
};

// Extend the existing Security Center with the production access model.
const _securityCenterBeforeAccessTrust=securityCenter;
securityCenter=function(){
 return _securityCenterBeforeAccessTrust()+
 '<div class="card" style="margin-top:14px"><div class="row" style="justify-content:space-between"><div><div class="kicker">Access & Trust</div><h3>Approval is only the first gate</h3><p class="muted">Identity, organization membership, and matter authorization are separate controls.</p></div><button class="btn" onclick="showView(\'access\')">Open Access & Trust</button></div></div>';
};

// Keep state consistent when the active matter changes.
const _switchCaseBeforeIngestion=switchCase;
switchCase=function(id){const out=_switchCaseBeforeIngestion(id);ensureIngestionState(data);return out};

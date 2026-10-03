const STORE='casebrief_workspace_v3';
const actor={id:'demo-reviewer',name:'Demo reviewer',type:'human',verified:false};
const systemActor={id:'casebrief-demo-ai',name:'CaseBrief demo AI',type:'system',verified:false};
const sessionId=crypto.randomUUID();
let current='landing', returnFocus=null, storageOK=true;
const stages=['Intake','Initial appearance','Discovery','Motions','Pretrial','Trial','Sentencing','Appeal'];

const primarySeed={
 matter:{id:'matter-001',title:'State v. Jordan Hale',number:'CR-26-04192',client:'Jordan Hale',attorney:'Avery Chen',stage:'Pretrial / motion review',courtStage:3,nextDeadline:'2026-08-26',jurisdiction:'District Court of the Fictional State, Franklin County',filingProfile:{verifiedForDemo:true,courtName:'District Court of the Fictional State',county:'Franklin County',division:'Criminal Division',judge:'Hon. Elena Marlowe',clerk:'Clerk of the District Court',efilingSystem:'Fictional Courts eFile',prosecutorOffice:'Franklin County Prosecuting Attorney',prosecutorName:'Morgan Vale',prosecutorServiceEmail:'morgan.vale@prosecutor.example',defenseCounsel:{name:'Avery Chen',barNumber:'FSB No. 10482',firm:'Chen Defense Group',address:'410 Silver Avenue, Franklin City, FS 00000',phone:'(555) 010-0419',email:'avery.chen@defense.example'},format:{paper:'US Letter',marginInches:1,lineSpacing:1.5,font:'Times New Roman',fontSizePt:12},rules:{suppression:'Fictional Rule of Criminal Procedure 12.4',discovery:'Fictional Rule of Criminal Procedure 16.2',motions:'Fictional Local Criminal Rule 7.1',service:'Fictional Rule of Criminal Procedure 49.1'}}},
 documents:[
  {id:'doc-1',type:'Police report',title:'Incident Report 26-1841',date:'2026-07-12',reviewed:true,excerpt:'Officer report states vehicle stop occurred at 22:14 and a black backpack was located behind the passenger seat. Report references body-camera file BC-1841-A.'},
  {id:'doc-2',type:'Witness statement',title:'Mara Wells Interview',date:'2026-07-12',reviewed:false,excerpt:'Witness states the stop began around 21:55 and says the backpack was already on the curb when she arrived.'},
  {id:'doc-3',type:'Evidence log',title:'Property & Evidence Log',date:'2026-07-12',reviewed:false,excerpt:'Lists backpack, sealed packet, phone. No body-camera file appears in produced inventory.'},
  {id:'doc-4',type:'Charging document',title:'Information',date:'2026-07-14',reviewed:true,excerpt:'Alleges possession of a controlled substance and paraphernalia.'},
  {id:'doc-5',type:'Transcript',title:'Initial Hearing Excerpt',date:'2026-07-15',reviewed:false,excerpt:'Defense orally requests preservation of all video evidence. No written preservation order appears in the packet.'},
  {id:'doc-6',type:'Court order',title:'Scheduling Order',date:'2026-07-18',reviewed:true,excerpt:'Motions due August 26, 2026.'},
  {id:'doc-7',type:'Attorney note',title:'Defense Intake Note',date:'2026-07-16',reviewed:false,excerpt:'Client says backpack belonged to another occupant. Record presently contains no ownership documentation.'},
  {id:'doc-8',type:'Correspondence',title:'Discovery Follow-up Email',date:'2026-08-02',reviewed:false,excerpt:'Requests BC-1841-A body-camera video and complete chain-of-custody documentation.'}
 ],
 evidence:[
  {id:'ev-1',name:'Black backpack',status:'in inventory',related:['doc-1','doc-3']},
  {id:'ev-2',name:'Sealed packet',status:'in inventory',related:['doc-3']},
  {id:'ev-3',name:'Phone',status:'in inventory',related:['doc-3']},
  {id:'ev-4',recordId:'BC-1841-A',name:'Body-camera BC-1841-A',status:'referenced but missing',related:['doc-1','doc-8']}
 ],
 witnesses:[
  {id:'wit-1',name:'Mara Wells',role:'Civilian witness',statement:'Stop began about 21:55; backpack was on curb when she arrived.',flags:['Time conflicts with incident report','Backpack location conflicts with incident report']},
  {id:'wit-2',name:'Officer Rowan Pike',role:'Reporting officer',statement:'Stop occurred at 22:14; backpack located behind passenger seat.',flags:['Body-camera referenced but not produced']}
 ],
 timeline:[
  {id:'tl-1',time:'2026-07-12 21:55',kind:'allegation',text:'Witness reports stop already underway.',sources:['doc-2']},
  {id:'tl-2',time:'2026-07-12 22:14',kind:'established_fact',text:'Incident report records vehicle stop.',sources:['doc-1']},
  {id:'tl-3',time:'2026-07-12 22:20',kind:'established_fact',text:'Backpack and sealed packet entered into evidence.',sources:['doc-3']},
  {id:'tl-4',time:'2026-07-15 09:10',kind:'established_fact',text:'Defense orally requests preservation of video.',sources:['doc-5']},
  {id:'tl-5',time:'2026-07-15 09:11–10:02',kind:'record_gap',text:'Record packet does not explain events during this interval.',sources:['doc-5']},
  {id:'tl-6',time:'2026-07-18',kind:'established_fact',text:'Scheduling order entered; motions due August 26.',sources:['doc-6']}
 ],
 issues:[
  {id:'i1',category:'contradiction',severity:'high',weight:9,status:'open',statement:'The reported start time appears inconsistent across the incident report and witness statement.',why:'Police report records 22:14; witness reports approximately 21:55.',sources:['doc-1','doc-2']},
  {id:'i2',category:'contradiction',severity:'high',weight:9,status:'open',statement:'The recorded location of the backpack appears inconsistent across sources.',why:'Officer report says behind passenger seat; witness says already on curb.',sources:['doc-1','doc-2']},
  {id:'i3',category:'missing_evidence',severity:'high',weight:10,status:'open',statement:'Body-camera file BC-1841-A is referenced but absent from the produced evidence inventory.',why:'Referenced in incident report and discovery follow-up; not listed in produced inventory.',sources:['doc-1','doc-3','doc-8']},
  {id:'i4',category:'timeline_gap',severity:'medium',weight:7,status:'open',statement:'The current packet contains a meaningful chronology gap following the preservation request.',why:'No packet source explains the interval.',sources:['doc-5']},
  {id:'i5',category:'deadline',severity:'high',weight:8,status:'open',statement:'The recorded motion deadline requires status verification.',why:'Scheduling order sets motions due August 26, 2026.',sources:['doc-6']},
  {id:'i6',category:'unreviewed_document',severity:'medium',weight:4,status:'open',statement:'Witness interview remains unreviewed.',why:'Document review status is incomplete.',sources:['doc-2']},
  {id:'i7',category:'unreviewed_document',severity:'medium',weight:4,status:'open',statement:'Evidence log remains unreviewed.',why:'Document review status is incomplete.',sources:['doc-3']},
  {id:'i8',category:'unsupported_assertion',severity:'medium',weight:6,status:'open',statement:'The current packet does not independently establish ownership of the backpack.',why:'Client attribution appears only in defense intake note.',sources:['doc-7']},
  {id:'i9',category:'research_needed',severity:'medium',weight:6,status:'open',statement:'Attorney review is needed to determine whether the preservation/discovery concern warrants legal action.',why:'Video is referenced but not produced; significance depends on facts, jurisdiction, and procedure.',sources:['doc-1','doc-5','doc-8']},
  {id:'i10',category:'source_support',severity:'low',weight:3,status:'open',statement:'The oral preservation request appears in only one source in the current packet.',why:'No written preservation order or corroborating docket entry is included.',sources:['doc-5']},
  {id:'rights-1',category:'potential_rights_violation',severity:'high',weight:8,status:'open',statement:'Potential preservation or disclosure issue requires attorney review.',why:'The report references video, the hearing excerpt records a preservation request, and the discovery email requests production. The packet does not establish whether video was withheld, lost, or never collected.',sources:['doc-1','doc-5','doc-8'],origin:'seeded_demo_analysis'}
 ],
 authorities:[
  {id:'auth-1',title:'Brady v. Maryland',cite:'373 U.S. 83 (1963)',topic:'Disclosure of favorable material',status:'potentially relevant',note:'Potential research path when favorable evidence or disclosure obligations are implicated. Attorney must verify applicability to the actual facts and jurisdiction.',issues:['rights-1','i9'],verified:false},
  {id:'auth-2',title:'California v. Trombetta',cite:'467 U.S. 479 (1984)',topic:'Preservation of potentially exculpatory evidence',status:'potentially relevant',note:'Potential preservation framework to evaluate with the missing body-camera issue. Applicability depends on the evidence and circumstances.',issues:['rights-1','i3'],verified:false},
  {id:'auth-3',title:'Arizona v. Youngblood',cite:'488 U.S. 51 (1988)',topic:'Failure to preserve potentially useful evidence',status:'potentially relevant',note:'Research path concerning failure to preserve evidence; attorney review is required before drawing any conclusion.',issues:['rights-1','i3'],verified:false},
  {id:'auth-4',title:'Constructive possession standard',cite:'Jurisdiction-specific authority required',topic:'Possession / ownership inference',status:'research needed',note:'The current packet does not independently establish ownership of the backpack. Local authority and jury instructions should be verified.',issues:['i8'],verified:false}
 ],
 contacts:[
  {id:'person-client',name:'Jordan Hale',role:'Client',channel:'Secure client portal',status:'Active'},
  {id:'person-attorney',name:'Avery Chen',role:'Lead attorney',channel:'CaseBrief workspace',status:'Active'},
  {id:'person-investigator',name:'Nora Kim',role:'Investigator',channel:'Secure team message',status:'Active'},
  {id:'person-co',name:'Sam Patel',role:'Co-counsel',channel:'Secure team message',status:'Active'}
 ],
 messages:[
  {id:'msg-1',at:'2026-08-03T17:20:00Z',from:'Avery Chen',to:'Jordan Hale',channel:'Secure client portal',subject:'Discovery update',body:'We requested the referenced body-camera file and will update you when its status is confirmed.',status:'demo record'}
 ],
 assistantMessages:[{role:'ai',at:new Date().toISOString(),text:'I can answer questions from this synthetic case record, point to sources, surface open review items, and help start a draft. This is a simulated MVP assistant, not a live legal model.'}],
 drafts:[]
};
const intakeSeed={matter:{id:'matter-002',title:'Morgan Ellis — Intake',number:'DEMO-002',client:'Morgan Ellis',attorney:'Avery Chen',stage:'Initial intake',courtStage:0,nextDeadline:null,jurisdiction:'Synthetic intake matter'},documents:[],evidence:[],witnesses:[],timeline:[],issues:[],authorities:[],contacts:[{id:'m2-client',name:'Morgan Ellis',role:'Client',channel:'Secure client portal',status:'Pending invite'},{id:'m2-attorney',name:'Avery Chen',role:'Lead attorney',channel:'CaseBrief workspace',status:'Active'}],messages:[],assistantMessages:[{role:'ai',at:new Date().toISOString(),text:'This intake matter does not have records yet. Add documents before asking for a source-grounded case analysis.'}],drafts:[]};

// Richer deterministic demo capabilities. These remain browser-local simulations.
function narrativeCaseOverview(){
 const unresolved=data.issues.filter(isUnresolved);
 return {
  text:`${data.matter.title} is a synthetic criminal matter currently in ${data.matter.stage}. The charging document alleges possession of a controlled substance and paraphernalia. The present record centres on a black backpack and sealed packet, but the available sources do not tell one completely consistent story.

According to Incident Report 26-1841, the vehicle stop occurred at 10:14 p.m. and the backpack was found behind the passenger seat. Mara Wells gives a materially different account: she places the beginning of the stop at approximately 9:55 p.m. and says the backpack was already on the curb when she arrived. Those differences affect both the chronology and the claimed location of the central physical evidence; they are review issues, not findings about who is truthful.

The evidence log records the backpack, sealed packet, and phone, but it does not list body-camera file BC-1841-A even though the incident report references that file. The Initial Hearing Excerpt records an oral request to preserve video evidence, and the later Discovery Follow-up Email again requests BC-1841-A and complete chain-of-custody documentation. The current packet does not establish whether the video exists, was preserved, was lost, or was never collected.

The defense intake note says the client attributes the backpack to another occupant, while the current packet contains no independent ownership documentation. That makes possession and ownership inferences another unresolved factual and legal issue. Local constructive-possession authority still needs to be identified and verified.

The immediate work is therefore to confirm the status of BC-1841-A, reconcile the conflicting time and location accounts, verify the chain of custody and recorded motion deadline, research the governing search, seizure, preservation, disclosure, and possession law, and determine whether the developed facts support a motion or other relief. CaseBrief currently tracks ${unresolved.length} unresolved review items. This narrative describes the present record only; it does not decide credibility, guilt, innocence, or the legal outcome.`,
  sources:['doc-1','doc-2','doc-3','doc-4','doc-5','doc-6','doc-7','doc-8']
 };
}

function motionToSuppressText(instruction=''){
 return `DRAFT — ATTORNEY REVIEW, FACT VERIFICATION, AND JURISDICTION-SPECIFIC REVISION REQUIRED

IN THE ${data.matter.jurisdiction.toUpperCase()}

${data.matter.title}
Case No. ${data.matter.number}

DEFENDANT’S MOTION TO SUPPRESS EVIDENCE
AND REQUEST FOR EVIDENTIARY HEARING

Defendant ${data.matter.client}, through counsel, respectfully moves the Court for an order suppressing evidence obtained from the black backpack and any evidence derived from that search. In the alternative, Defendant requests an evidentiary hearing and such additional disclosure or preservation relief as the developed record supports.

PRELIMINARY STATEMENT

The present discovery contains material factual gaps and conflicting accounts concerning the vehicle stop, the location and attribution of the backpack, and a referenced body-camera recording that has not been produced in the current packet. These matters bear directly on the circumstances of the seizure and search and should be resolved on an evidentiary record before the challenged evidence is admitted.

STATEMENT OF FACTS

1. Incident Report 26-1841 states that the vehicle stop occurred at approximately 10:14 p.m. and that a black backpack was located behind the passenger seat.

2. The Mara Wells Interview places the beginning of the stop at approximately 9:55 p.m. and states that the backpack was already on the curb when the witness arrived.

3. The Property & Evidence Log lists the backpack, a sealed packet, and a phone. It does not list body-camera file BC-1841-A.

4. Incident Report 26-1841 references body-camera file BC-1841-A. The Initial Hearing Excerpt records an oral defense request to preserve video evidence, and the Discovery Follow-up Email later requests production of BC-1841-A and complete chain-of-custody documentation.

5. The present packet does not establish whether BC-1841-A exists, whether it was preserved, why it has not been produced, or whether it depicts the seizure or search.

6. The defense intake note records the client’s statement that the backpack belonged to another occupant. The present packet contains no independent ownership documentation.

ARGUMENT

I. THE STATE MUST ESTABLISH A LAWFUL BASIS FOR THE SEIZURE AND SEARCH.

The Fourth Amendment to the United States Constitution and the applicable provisions of state law protect against unreasonable searches and seizures. The prosecution bears the applicable burden under controlling law once a defendant properly challenges the legality of a warrantless search. Counsel must insert and verify the governing constitutional provision, criminal rule, burden, exceptions, and controlling state and local authorities before filing this draft.

The existing record does not identify, with sufficient clarity for a final filing, the asserted legal basis for searching the backpack. It also contains conflicting accounts about when the stop occurred and where the backpack was located. Those conflicts are material to custody, possession, standing, consent, probable cause, abandonment, and any other exception the State may assert. An evidentiary hearing is necessary to establish who seized the backpack, where it was located, when it was searched, what justification was asserted, and whether any warrant or valid exception existed.

II. THE UNPRODUCED BODY-CAMERA RECORDING AND CHAIN-OF-CUSTODY GAPS REQUIRE FACTUAL DEVELOPMENT.

The incident report references BC-1841-A, but the current evidence inventory does not contain that file. The defense requested preservation and later requested production. Before the Court rules on suppression, the State should be required to disclose the recording or explain its status, preservation history, and relevance. Counsel must verify whether Brady v. Maryland, California v. Trombetta, Arizona v. Youngblood, applicable discovery rules, or jurisdiction-specific preservation remedies apply to the developed facts; this draft does not assume that a disclosure or preservation violation has occurred.

III. SUPPRESSION OR OTHER APPROPRIATE RELIEF SHOULD FOLLOW IF THE STATE CANNOT MEET ITS BURDEN.

If the State cannot establish a lawful basis for the seizure and search under the governing law, the physical evidence recovered from the backpack and any fruits derived from it should be suppressed. If the present record is insufficient to decide that issue, the Court should conduct an evidentiary hearing and order the disclosure, preservation accounting, or other relief necessary to create a reliable record.

REQUEST FOR RELIEF

Defendant respectfully requests that the Court:

A. Set an evidentiary hearing;
B. Require the State to identify the legal basis for the seizure and search;
C. Require production of BC-1841-A or a verified explanation of its status and preservation history;
D. Suppress the evidence obtained from the backpack and any derivative evidence if the State cannot satisfy its burden; and
E. Grant any further relief the Court finds just and appropriate.

DATED: __________________

Respectfully submitted,

__________________________________
Attorney for ${data.matter.client}

ATTORNEY COMPLETION CHECKLIST

• Confirm the actual court caption, parties, filing title, and procedural rule.
• Insert controlling federal, state, and local search-and-seizure authority.
• Determine the asserted search theory: warrant, consent, probable cause, automobile exception, search incident to arrest, inventory, abandonment, or another theory.
• Verify standing and the factual basis for the client’s privacy interest.
• Confirm every factual statement against the original records and discovery.
• Determine whether the missing video supports a separate discovery, preservation, sanctions, or continuance request.
• Add certificate of service, notice of hearing, proposed order, and local formatting required by the court.
${instruction?`\nADDITIONAL DRAFTING INSTRUCTION\n\n${instruction}\n`:''}`;
}

function createMotionToSuppressDraft(instruction='',origin='Drafting Studio'){
 const d={id:crypto.randomUUID(),type:'motion_to_suppress',title:'Motion to Suppress Evidence — Draft',body:motionToSuppressText(instruction),createdAt:new Date().toISOString(),instruction};
 data.drafts.push(d);
 record('draft.generated',d.id,{type:d.type,title:d.title,sourceMatter:data.matter.id,origin,sourceIds:['doc-1','doc-2','doc-3','doc-5','doc-7','doc-8'],simulated:true});
 save();
 return d;
}

const _draftingBeforeRichDemo=drafting;
drafting=function(){return _draftingBeforeRichDemo().replace('<option value="motion_outline">','<option value="motion_to_suppress">Motion to Suppress — full draft</option><option value="motion_outline">')};

const _simulateAIBeforeRichDemo=simulateAI;
simulateAI=function(q){
 const t=String(q||'').toLowerCase();
 if(/(narrative|overview|tell me (the|about the) case|case story|full case summary)/.test(t))return narrativeCaseOverview();
 if(/(draft|write|prepare|generate).*(motion to suppress)|motion to suppress/.test(t))return {text:'I can generate a full Motion to Suppress draft from this synthetic record and save it in Drafting Studio. The draft will identify unresolved facts and jurisdiction-specific authorities that counsel must verify before filing.',sources:['doc-1','doc-2','doc-3','doc-5','doc-7','doc-8']};
 return _simulateAIBeforeRichDemo(q);
};

const _generateDraftBeforeRichDemo=generateDraft;
generateDraft=function(e){
 const type=document.getElementById('draftType')?.value;
 if(type!=='motion_to_suppress')return _generateDraftBeforeRichDemo(e);
 e.preventDefault();
 const instruction=document.getElementById('draftInstruction')?.value.trim()||'';
 createMotionToSuppressDraft(instruction);
 render();
};

const _askAIBeforeRichDemo=askAI;
askAI=function(e){
 const input=document.getElementById('aiPrompt'),q=(input?.value||'').trim();
 if(!/(draft|write|prepare|generate).*(motion to suppress)|motion to suppress/i.test(q))return _askAIBeforeRichDemo(e);
 e.preventDefault();
 if(!q||!requirePermission('ai_use','ai:question')||!requirePermission('drafting','draft:generate-from-ai'))return;
 data.assistantMessages.push({role:'user',at:new Date().toISOString(),text:q});
 record('ai.question_asked','assistant',{promptChars:q.length,contentExcludedFromAudit:true,role:currentProfile().role});
 const d=createMotionToSuppressDraft('Requested through the AI Assistant.','AI Assistant');
 const text=`I generated “${d.title}” and saved it in Drafting Studio. It includes a court-style caption, factual statement, suppression argument, requested relief, source anchors, and an attorney completion checklist. Because the current packet does not identify the State’s search theory or controlling local authority, the draft marks those items for verification rather than inventing them.`;
 data.assistantMessages.push({role:'ai',at:new Date().toISOString(),text,sources:['doc-1','doc-2','doc-3','doc-5','doc-7','doc-8']});
 record('ai.response_generated','assistant',{sourceIds:['doc-1','doc-2','doc-3','doc-5','doc-7','doc-8'],generatedDraftId:d.id,draftType:d.type,simulated:true},'success',systemActor);
 save();
 render();
 setTimeout(()=>{const box=document.getElementById('chatbox');if(box)box.scrollTop=box.scrollHeight},0);
};

render();

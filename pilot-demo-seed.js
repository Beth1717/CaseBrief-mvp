// Generated from integration/fixtures/idaho-pretrial.json; synthetic data only.
const INVESTOR_PILOT_SEED={
  "matter": {
    "id": "SYN-ID-PRETRIAL-001",
    "title": "Synthetic Idaho pretrial — Morgan Vale",
    "number": "SYN-ID-PRETRIAL-001",
    "client": "Morgan Vale",
    "attorney": "Unassigned — synthetic fixture",
    "stage": "Pretrial / source review",
    "courtStage": 4,
    "nextDeadline": null,
    "jurisdiction": "Idaho — court/county not selected",
    "syntheticOnly": true,
    "fixtureVersion": "0.1.0"
  },
  "documents": [
    {
      "id": "S01",
      "type": "Police report",
      "title": "SYNTHETIC — NOT A REAL CASE: Incident report",
      "date": "2026-07-11",
      "reviewed": false,
      "excerpt": "On July 10, 2026, I contacted Morgan Vale at 21:05. At 21:12 Vale stated, “You can look in the car.” I began the vehicle search at 21:14. At 21:18 I located a black bag on the rear floor containing suspected controlled substance. Vale said the bag was not theirs.",
      "syntheticOnly": true
    },
    {
      "id": "S02",
      "type": "Transcript",
      "title": "SYNTHETIC — NOT A REAL CASE: Camera transcript",
      "date": "2026-07-10",
      "reviewed": false,
      "excerpt": "21:09:30 Officer: I am opening the rear door now.\n21:10:05 [Officer reaches toward the rear floor.]\n21:12:10 Vale: You can look in the car.\n21:18:00 Officer: Whose black bag is this?",
      "syntheticOnly": true
    },
    {
      "id": "S03",
      "type": "Witness statement",
      "title": "SYNTHETIC — NOT A REAL CASE: Taylor Reed statement",
      "date": "2026-07-12",
      "reviewed": false,
      "excerpt": "I saw the officer open the rear door before Morgan said they could look in the car. I did not see who put the black bag there. Several people had used the car that week.",
      "syntheticOnly": true
    },
    {
      "id": "S04",
      "type": "Evidence log",
      "title": "SYNTHETIC — NOT A REAL CASE: Evidence inventory",
      "date": "2026-07-10",
      "reviewed": false,
      "excerpt": "E01: black bag, collected July 10; location: rear floor.\nE02: suspected substance, laboratory analysis requested; result pending.",
      "syntheticOnly": true
    },
    {
      "id": "S05",
      "type": "Evidence log",
      "title": "SYNTHETIC — NOT A REAL CASE: Duplicate evidence inventory",
      "date": "2026-07-10",
      "reviewed": false,
      "excerpt": "E01: black bag, collected July 10; location: rear floor.\nE02: suspected substance, laboratory analysis requested; result pending.",
      "syntheticOnly": true
    },
    {
      "id": "S06",
      "type": "Attorney note",
      "title": "SYNTHETIC — NOT A REAL CASE: Restricted attorney work note",
      "date": "2026-07-12",
      "reviewed": false,
      "excerpt": "Counsel wants to clarify the scope of consent and camera clock accuracy before forming a position. Internal strategy note: keep privileged review discussion out of any family-facing brief.",
      "syntheticOnly": true
    }
  ],
  "evidence": [
    {
      "id": "E01",
      "recordId": "E01",
      "name": "Black bag",
      "status": "in inventory",
      "related": [
        "S04"
      ]
    },
    {
      "id": "E02",
      "recordId": "E02",
      "name": "Suspected substance",
      "status": "laboratory result pending",
      "related": [
        "S04"
      ]
    }
  ],
  "witnesses": [
    {
      "id": "W01",
      "name": "Taylor Reed",
      "role": "Fictional witness",
      "statement": "I saw the officer open the rear door before Morgan said they could look in the car. I did not see who put the black bag there. Several people had used the car that week.",
      "flags": [
        "Sequence needs review; ownership not established"
      ]
    }
  ],
  "timeline": [
    {
      "id": "T01",
      "time": "2026-07-10 21:05",
      "kind": "allegation",
      "text": "Report describes officer contact.",
      "sources": [
        "S01"
      ]
    },
    {
      "id": "T02",
      "time": "2026-07-10 21:09:30",
      "kind": "allegation",
      "text": "Transcript describes door opening; clock accuracy unverified.",
      "sources": [
        "S02"
      ]
    },
    {
      "id": "T03",
      "time": "2026-07-10 21:12",
      "kind": "allegation",
      "text": "Report and transcript attribute consent statement to Vale.",
      "sources": [
        "S01",
        "S02"
      ]
    }
  ],
  "issues": [],
  "authorities": [],
  "contacts": [],
  "messages": [],
  "assistantMessages": [],
  "drafts": []
};

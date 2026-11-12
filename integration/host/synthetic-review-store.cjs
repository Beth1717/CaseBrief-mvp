// Local synthetic persistence experiment. Not an authenticated production backend.
const {DatabaseSync}=require('node:sqlite');
const {createHash,randomUUID}=require('node:crypto');
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
class SyntheticReviewStore{
 constructor({filename=':memory:',syntheticOnly=false,beforeAuditWrite=()=>{}}={}){
  if(syntheticOnly!==true)throw new Error('syntheticOnly must be explicitly true');
  this.beforeAuditWrite=beforeAuditWrite;
  this.db=new DatabaseSync(filename);
  this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
   CREATE TABLE IF NOT EXISTS invocations(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,matter TEXT NOT NULL,actor TEXT NOT NULL,body TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY,id TEXT UNIQUE NOT NULL,invocation TEXT NOT NULL REFERENCES invocations(id),body TEXT NOT NULL,previous_hash TEXT NOT NULL,hash TEXT NOT NULL);
   CREATE TRIGGER IF NOT EXISTS events_no_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'audit events cannot be updated'); END;
   CREATE TRIGGER IF NOT EXISTS events_no_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'audit events cannot be deleted'); END;`);
 }
 transaction(fn){
  this.db.exec('BEGIN IMMEDIATE');
  try{const value=fn();this.db.exec('COMMIT');return value}catch(error){this.db.exec('ROLLBACK');throw error}
 }
 event(record,type,data={}){
  this.beforeAuditWrite(type);
  const body=JSON.stringify({id:randomUUID(),invocationId:record.id,syntheticOnly:true,tenantId:record.tenantId,matterId:record.matterId,actorId:record.actorId,type,recordedAt:new Date().toISOString(),data});
  const previous=this.db.prepare('SELECT hash FROM events ORDER BY seq DESC LIMIT 1').get()?.hash||'';
  this.db.prepare('INSERT INTO events(id,invocation,body,previous_hash,hash) VALUES(?,?,?,?,?)').run(JSON.parse(body).id,record.id,body,previous,digest([previous,body]));
 }
 create(record){return this.transaction(()=>{
  this.db.prepare('INSERT INTO invocations VALUES(?,?,?,?,?)').run(record.id,record.tenantId,record.matterId,record.actorId,JSON.stringify(record));
  this.event(record,'invocation.started',{requestDigest:record.requestDigest,sourceSnapshotDigest:record.sourceSnapshotDigest});
  return structuredClone(record);
 })}
 get(id,scope){
  const row=this.db.prepare('SELECT body FROM invocations WHERE id=? AND tenant=? AND matter=? AND actor=?').get(id,scope.tenantId,scope.matterId,scope.actorId);
  if(!row)throw new Error('INVOCATION_NOT_AUTHORIZED');return JSON.parse(row.body);
 }
 update(id,scope,fn){return this.transaction(()=>{
  const record=this.get(id,scope),next=fn(structuredClone(record));
  if(next.record.id!==record.id||next.record.tenantId!==record.tenantId||next.record.matterId!==record.matterId||next.record.actorId!==record.actorId)throw new Error('INVOCATION_BINDING_CHANGED');
  this.db.prepare('UPDATE invocations SET body=? WHERE id=?').run(JSON.stringify(next.record),id);
  this.event(next.record,next.event,next.data);
  return structuredClone(next.record);
 })}
 events(id,scope){this.get(id,scope);return this.db.prepare('SELECT body FROM events WHERE invocation=? ORDER BY seq').all(id).map(row=>JSON.parse(row.body))}
 verifyAuditChain(){
  let previous='';
  for(const row of this.db.prepare('SELECT body,previous_hash,hash FROM events ORDER BY seq').all()){
   if(row.previous_hash!==previous||row.hash!==digest([previous,row.body]))return false;previous=row.hash;
  }return true;
 }
 close(){this.db.close()}
}
module.exports={SyntheticReviewStore};

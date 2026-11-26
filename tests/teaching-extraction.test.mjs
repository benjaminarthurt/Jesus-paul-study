import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=n=>JSON.parse(readFileSync(new URL("../research/index/"+n+".json",import.meta.url),"utf8"));
test("every Gospel and Pauline passage has exactly one extraction queue entry",()=>{
 const p=read("passages").filter(x=>["mt","mk","lk","jn"].includes(x.bookId)||x.sourceLayer.startsWith("paul-"));
 const q=read("teaching-extraction-queue"), s=read("sayings");
 assert.equal(q.length,p.length);
 assert.equal(new Set(q.map(x=>x.passageId)).size,q.length);
 for(const x of p){
  const r=q.find(r=>r.passageId===x.id);
  assert.ok(r,x.id);
  assert.equal(r.bookId,x.bookId);
  assert.equal(r.sourceLayer,x.sourceLayer);
  assert.deepEqual([...r.existingSpeechIds].sort(),s.filter(y=>y.passageId===x.id).map(y=>y.id).sort());
 }
});

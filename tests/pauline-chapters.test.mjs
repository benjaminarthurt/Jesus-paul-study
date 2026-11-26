import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const read = name => JSON.parse(readFileSync(new URL("../research/index/"+name+".json",import.meta.url),"utf8"));
const chapters=read("pauline-chapters"),books=read("books");
const expected={"ro":[16,"ROM"],"1co":[16,"1CO"],"2co":[13,"2CO"],"ga":[6,"GAL"],"php":[4,"PHP"],"1th":[5,"1TH"],"phm":[1,"PHM"],"eph":[6,"EPH"],"col":[4,"COL"],"2th":[3,"2TH"],"1ti":[6,"1TI"],"2ti":[4,"2TI"],"tit":[3,"TIT"]};
test("all 87 Pauline chapters are present exactly once",()=>{
 assert.equal(chapters.length,87);
 for(const [id,[count]] of Object.entries(expected)) assert.deepEqual(chapters.filter(c=>c.bookId===id).map(c=>c.chapter).sort((a,b)=>a-b),Array.from({length:count},(_,i)=>i+1));
});
test("chapter records preserve attribution, source URLs and valid themes",()=>{
 for(const c of chapters){
  assert.equal(c.sourceLayer,books.find(b=>b.id===c.bookId).group);
  assert.equal(c.sourceUrl,"https://ebible.org/engwebp/"+expected[c.bookId][1]+String(c.chapter).padStart(2,"0")+".htm");
  assert.ok(existsSync(new URL("../research/topics/"+c.topic+".md",import.meta.url)));
  assert.ok(c.summary.length>=20);
  assert.ok(["draft","source-checked","reviewed"].includes(c.status));
 }
});

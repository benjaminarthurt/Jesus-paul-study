import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load = filename => JSON.parse(readFileSync(filename, "utf8"));
const sayings = load("research/index/sayings.json");
const passages = new Map(load("research/index/passages.json").map(p=>[p.id,p]));
const markSayings = sayings.filter(s=>s.bookId==="mk");

test("saying IDs are unique, scoped and stable",()=>{
  assert.equal(new Set(sayings.map(s=>s.id)).size,sayings.length);
  assert.ok(markSayings.length >= 35);
  assert.ok(markSayings.every(s=>s.id.startsWith("mk-s-") && s.status === "draft"));
});
test("all spans are inside their parent Mark literary units",()=>{
  for(const s of markSayings) {
    const p=passages.get(s.passageId);
    assert.ok(p,s.id + " parent");
    const [ch,start,end] = p.id.slice(3).split("-").map(Number);
    assert.equal(s.chapter,ch,s.id);
    assert.ok(s.startVerse >= start && s.endVerse <= end,s.id);
    assert.notEqual(p.unitType,"disputed");
  }
});
test("selected spans have distinct audiences and narrative contexts",()=>{
  assert.ok(new Set(markSayings.map(s=>s.audience)).size >= 5);
  assert.ok(sayings.some(s=>s.speechType === "parable"));
  assert.ok(sayings.some(s=>s.speechType === "prayer"));
  assert.ok(sayings.some(s=>s.speechType === "instruction"));
});
test("parallel links are always labeled candidates, not verified identities",()=>{
  assert.ok(sayings.some(s=>s.parallels.length));
  assert.ok(sayings.every(s=>s.parallels.every(p=>p.status==="candidate")));
});
test("Mark 16 longer ending is kept outside this core speech index",()=>{
  assert.ok(markSayings.every(s=>s.chapter!==16));
  assert.ok(passages.has("mk-16-09-20"));
});
test("contextual cautions survive into the registry",()=>{
  assert.match(sayings.find(s=>s.id==="mk-s-07-18-23")?.caution??" ",/Mark 7:19/);
  assert.match(sayings.find(s=>s.id==="mk-s-12-43-44")?.caution??" ",/widow/);
});

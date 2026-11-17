import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const passages=JSON.parse(readFileSync("research/index/passages.json","utf8"));
const mark=passages.filter(p=>p.bookId==="mk");
test("Mark has mapped chapter units across all 16 chapters",()=>{
  const chapters=new Set(mark.map(p=>Number(p.id.split("-")[1])));
  assert.equal(chapters.size,16);
  assert.ok(mark.length>=75);
});
test("Gospel context and action are not all labeled spoken teaching",()=>{
  assert.ok(mark.some(p=>p.unitType==="context"));
  assert.ok(mark.some(p=>p.unitType==="action"));
  assert.ok(mark.some(p=>p.unitType==="speech"));
  assert.ok(mark.some(p=>p.unitType==="parable"));
});
test("Mark's longer ending is visibly cautioned",()=>{
  const longer=mark.find(p=>p.id==="mk-16-09-20");
  assert.equal(longer?.unitType,"disputed");
  assert.equal(longer?.textualStatus,"disputed-longer-ending");
  assert.ok(longer?.textualNote?.length>40);
});

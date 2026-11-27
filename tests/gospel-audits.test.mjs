import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const load = name => JSON.parse(readFileSync(new URL("../research/index/" + name + ".json", import.meta.url)));
const decisions = new Map(load("teaching-extraction-queue").map(row => [row.passageId, row.gospelAudit]));

test("every indexed Mark parent has a source-specific disposition", () => {
  for (const p of load("passages").filter(p => p.bookId === "mk")) {
    assert.equal(decisions.get(p.id)?.sourceUrl, p.sourceUrl, p.id);
  }
  assert.equal(decisions.get("mk-07-01-23").disposition, "composite");
  assert.equal(decisions.get("mk-16-01-08").disposition, "other-speakers");
  assert.equal(decisions.get("mk-16-09-20").disposition, "disputed-speech");
  assert.deepEqual(decisions.get("mk-16-09-20").units.map(u => u.startVerse), [15, 16, 17]);
});

test("use the council's question, Peter's recollection and the narrator's gloss as distinct evidence", () => {
  const trial = decisions.get("mk-14-43-65");
  assert.ok(trial.units.some(u => u.startVerse === 62));
  assert.ok(trial.units.every(u => u.endVerse < 58 || u.startVerse > 61));
  assert.equal(decisions.get("mk-14-66-72").units[0].form, "reported-prediction");
  assert.ok(decisions.get("mk-03-20-30").units.every(u => u.endVerse < 30));
});

test("John distinguishes narrator explanations, reported sayings and other speakers", () => {
  for (const p of load("passages").filter(p => p.bookId === "jn")) {
    assert.equal(decisions.get(p.id)?.sourceUrl, p.sourceUrl, p.id);
  }
  assert.deepEqual(decisions.get("jn-01-29-34").units, []);
  assert.deepEqual(decisions.get("jn-09-13-34").units, []);
  assert.equal(decisions.get("jn-18-01-11").units.find(u => u.startVerse === 9).form, "reported-teaching");
  assert.equal(decisions.get("jn-04-43-45").units[0].form, "reported-teaching");
  assert.deepEqual(decisions.get("jn-05-16-18").units.map(u => u.endVerse), [17]);
  assert.deepEqual(decisions.get("jn-07-37-39").units.map(u => u.endVerse), [38]);
});

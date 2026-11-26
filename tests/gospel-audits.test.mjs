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

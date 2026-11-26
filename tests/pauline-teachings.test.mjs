import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateExtraction} from "../scripts/validate-extraction.mjs";

const load = name => JSON.parse(readFileSync(new URL("../research/index/" + name + ".json", import.meta.url)));

test("validate teaching boundaries, sources, authorship, topics and Gospel links", () => {
  assert.deepEqual(validateExtraction(), []);
  const rows = load("pauline-teachings");
  assert.equal(new Set(rows.map(t => t.id)).size, rows.length);
  assert.equal(new Set(rows.map(t => t.bookId)).size, 13);
  for (const t of rows) assert.ok(["draft", "source-checked", "reviewed"].includes(t.status));
});

test("cross-chapter decisions preserve chapter-specific sources and distinct voices", () => {
  const rows = load("pauline-teachings");
  const decisions = load("pauline-extraction-dispositions");
  for (const id of ["1th-02-17-03-13", "ro-09-30-10-03", "2co-06-14-07-01"]) {
    const urls = decisions.find(d => d.passageId === id).primaryTextCheck.chapterUrls;
    assert.equal(new Set(urls).size, 2);
    assert.deepEqual(new Set(rows.filter(t => t.passageId === id).map(t => t.sourceUrl)), new Set(urls));
  }
  assert.equal(rows.find(t => t.id === "2co-t-06-16-18").attribution, "scriptural-divine-speech");
  assert.equal(rows.find(t => t.id === "2co-t-07-01-01").attribution, "letter-discourse");
});

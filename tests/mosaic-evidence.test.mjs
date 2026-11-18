import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseFrontmatter } from "../scripts/frontmatter.mjs";

const read = file => JSON.parse(readFileSync(file,"utf8"));
const passages = read("research/index/passages.json");
const sources = read("research/index/sources.json");
const evidence = read("research/index/evidence.json").filter(e => e.comparisonId === "law-and-faith");
const study = parseFrontmatter(readFileSync("research/comparisons/law-and-faith.md","utf8"));
const topic = parseFrontmatter(readFileSync("research/topics/mosaic-law.md","utf8"));
const passageIds = new Set(passages.map(p=>p.id));
const sourceIds = new Set(sources.map(s=>s.id));

test("law study declares sources, context and both perspectives", () => {
  assert.equal(study.status,"draft");
  assert.equal(study.classification,"apparent-tension");
  assert.ok(study.jesus.includes("mt-05-17-20"));
  assert.ok(study.paul.includes("ro-03-28-31"));
  assert.ok(study.paul.includes("ga-03-23-25"));
  assert.ok(study.context.includes("ac-15-01-29"));
  assert.ok(study.sourceIds.length >= 5);
});

test("new law-related passages are reciprocal topic members", () => {
  const law = passages.filter(p=>p.topics.includes("mosaic-law"));
  for (const p of law) assert.ok(topic.passages.includes(p.id),p.id);
});

test("bibliography explicitly distinguishes publisher abstract-only access", () => {
  assert.ok(sources.some(s=>s.accessScope==="publisher-abstract-only"));
  assert.ok(sources.some(s=>s.accessScope==="full-text"));
  assert.ok(sources.some(s=>s.id==="williams-2024-mark7" && s.url.includes("doi.org")));
});

test("evidence claims have traceable primary and secondary sources and counterreadings", () => {
  assert.equal(new Set(evidence.map(e=>e.id)).size,evidence.length);
  assert.ok(evidence.length>=6);
  for (const e of evidence) {
    assert.equal(e.comparisonId,"law-and-faith");
    assert.equal(e.status,"draft");
    assert.ok(e.alternateReading.length>40);
    assert.ok(e.limitation.length>40);
    assert.ok(e.passageIds.every(id=>passageIds.has(id) && [...study.jesus,...study.paul,...study.context].includes(id)));
    assert.ok(e.sourceIds.every(id=>sourceIds.has(id) && study.sourceIds.includes(id)));
  }
  assert.ok(evidence.some(e=>e.assessment==="agreement"));
  assert.ok(evidence.some(e=>e.assessment==="tension"));
});

test("passage links use the correct primary Bible edition", () => {
  assert.ok(passages.some(p=>p.id==="ac-15-01-29" && p.sourceUrl==="https://ebible.org/engwebp/ACT15.htm"));
  const sayings=read("research/index/sayings.json");
  assert.ok(sayings.every(s=>s.sourceEdition==="World English Bible (Protestant edition)"));
  assert.ok(sayings.every(s=>s.sourceUrl.startsWith("https://ebible.org/engwebp/")));
});

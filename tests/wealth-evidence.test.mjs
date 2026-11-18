import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseFrontmatter } from "../scripts/frontmatter.mjs";

const read = file => JSON.parse(readFileSync(file, "utf8"));
const passages = read("research/index/passages.json");
const sources = read("research/index/sources.json");
const allEvidence = read("research/index/evidence.json");
const wealthEvidence = allEvidence.filter(e => e.comparisonId === "wealth-and-generosity");
const study = parseFrontmatter(readFileSync("research/comparisons/wealth-and-generosity.md","utf8"));
const topic = parseFrontmatter(readFileSync("research/topics/wealth-poverty.md","utf8"));
const passageIds = new Set(passages.map(p => p.id));
const sourceIds = new Set(sources.map(s => s.id));
const declared = new Set([...study.jesus, ...study.paul, ...(study.context ?? [])]);

test("wealth study preserves Jesus, undisputed Paul and disputed contextual sources", () => {
  assert.equal(study.status,"draft");
  assert.equal(study.classification,"different-emphasis");
  assert.ok(study.jesus.includes("mk-10-17-31"));
  assert.ok(study.jesus.includes("mt-25-31-46"));
  assert.ok(study.paul.includes("2co-08-01-15"));
  assert.ok(study.paul.includes("ro-15-25-28"));
  assert.ok(study.context.includes("1ti-06-06-19"));
  assert.ok(study.context.includes("ac-04-32-37"));
  for (const id of study.jesus) assert.match(passages.find(p=>p.id===id)?.sourceLayer??" ",/^jesus-/);
  for (const id of study.paul) assert.equal(passages.find(p=>p.id===id)?.sourceLayer,"paul-undisputed");
  assert.equal(passages.find(p=>p.id==="1ti-06-06-19")?.sourceLayer,"paul-disputed");
});

test("all wealth topic indexes include the new records and Galatians 2", () => {
  for (const p of passages.filter(p=>p.topics.includes("wealth-poverty"))) {
    assert.ok(topic.passages.includes(p.id),p.id);
  }
  assert.ok(topic.passages.includes("ga-02-01-10"));
  assert.ok(readFileSync("research/topics/wealth-poverty.md","utf8").includes("/comparisons/wealth-and-generosity/"));
});

test("wealth evidence uses real declared passages and sources", () => {
  assert.ok(wealthEvidence.length >= 9);
  assert.equal(new Set(allEvidence.map(x=>x.id)).size,allEvidence.length);
  for (const item of wealthEvidence) {
    assert.equal(item.status,"draft");
    assert.ok(item.title.length > 20);
    assert.ok(item.alternateReading.length > 40);
    assert.ok(item.limitation.length > 40);
    assert.ok(item.passageIds.every(id=>passageIds.has(id) && declared.has(id)),item.id);
    assert.ok(item.sourceIds.every(id=>sourceIds.has(id) && study.sourceIds.includes(id)),item.id);
  }
  assert.ok(wealthEvidence.some(e=>e.assessment==="tension"));
  assert.ok(wealthEvidence.some(e=>e.assessment==="agreement"));
  assert.ok(wealthEvidence.some(e=>e.assessment==="interpretation-dependent"));
});

test("source access reflects what was inspected and distinguishes a pastoral commentary", () => {
  assert.equal(sources.find(s=>s.id==="barclay-2023-rich-poverty")?.accessScope,"full-text");
  assert.equal(sources.find(s=>s.id==="welborn-2013-equality")?.accessScope,"publisher-abstract-only");
  assert.equal(sources.find(s=>s.id==="kubis-2015-widow")?.accessScope,"publisher-abstract-only");
  assert.equal(sources.find(s=>s.id==="shively-2012-mark10")?.type,"pastoral-commentary");
});

test("every new passage uses correct indexed book and primary edition link", () => {
  const check = {
    "1co-16-01-04":"1CO16",
    "2co-09-01-15":"2CO09",
    "ro-15-25-28":"ROM15",
    "lk-19-01-10":"LUK19",
    "1ti-06-06-19":"1TI06"
  };
  for (const [id,chapter] of Object.entries(check)) {
    assert.equal(passages.find(p=>p.id===id)?.sourceUrl,`https://ebible.org/engwebp/${chapter}.htm`);
  }
});


test("every wealth comparison passage links to its primary chapter", () => {
  for (const id of [...study.jesus,...study.paul,...study.context]) {
    const passage=passages.find(p=>p.id===id);
    assert.ok(passage,id);
    assert.match(passage.sourceUrl??"",/^https:\/\/ebible\.org\/engwebp\/[0-9A-Z]+\.htm$/i,id);
  }
});

test("modern wealth application has explicit ancient/modern and policy boundaries", () => {
  const dossier = readFileSync("research/modern-issues/wealth-inequality.md","utf8");
  const meta = parseFrontmatter(dossier);
  assert.equal(meta.status, "draft");
  assert.deepEqual(meta.topicRefs, ["wealth-poverty"]);
  assert.ok(dossier.includes("/comparisons/wealth-and-generosity/"));
  assert.ok(dossier.includes("/sources/"));
  assert.match(dossier, /Contemporary|contemporary|modern tax/i);
  assert.match(dossier, /voluntary charity/i);
  assert.match(dossier, /structural reform/i);
  assert.match(dossier, /prosperity teaching/i);
  assert.match(dossier, /abstracts/i);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseFrontmatter } from "../scripts/frontmatter.mjs";

const read = f => JSON.parse(readFileSync(f,"utf8"));
const passages = read("research/index/passages.json");
const sources = read("research/index/sources.json");
const evidence = read("research/index/evidence.json");
const study = parseFrontmatter(readFileSync("research/comparisons/women-and-assembly.md","utf8"));
const topic = parseFrontmatter(readFileSync("research/topics/women-authority.md","utf8"));
const dossier = readFileSync("research/comparisons/women-and-assembly.md","utf8");
const byPassage = new Map(passages.map(p=>[p.id,p]));
const sourceIds = new Set(sources.map(s=>s.id));
const claims = evidence.filter(e=>e.comparisonId==="women-and-assembly");

test("women study distinguishes Gospels, Paul's undisputed letters and later witnesses",()=>{
  assert.equal(study.status,"draft");
  assert.equal(study.classification,"apparent-tension");
  assert.ok(study.jesus.includes("jn-20-11-18"));
  assert.ok(study.jesus.includes("lk-08-01-03"));
  assert.ok(study.paul.includes("1co-11-02-16"));
  assert.ok(study.paul.includes("ro-16-01-16"));
  assert.ok(study.context.includes("1ti-02-08-15"));
  assert.ok(study.context.includes("ac-18-24-26"));
  assert.ok(study.context.includes("tit-02-03-05"));
  for(const id of study.jesus)assert.match(byPassage.get(id)?.sourceLayer??"",/^jesus-/);
  for(const id of study.paul)assert.equal(byPassage.get(id)?.sourceLayer,"paul-undisputed",id);
  assert.equal(byPassage.get("1ti-02-08-15")?.sourceLayer,"paul-disputed");
  assert.equal(byPassage.get("ac-18-24-26")?.sourceLayer,"acts");
});

test("all women's topic entries are reciprocal and published comparison link works",()=>{
  const membership=passages.filter(p=>p.topics.includes("women-authority")).map(p=>p.id);
  assert.ok(membership.length>=20);
  assert.deepEqual([...topic.passages].sort(),[...membership].sort());
  assert.ok(readFileSync("research/topics/women-authority.md","utf8").includes("/comparisons/women-and-assembly/"));
});

test("all women comparison passages have direct source URLs",()=>{
  for(const id of [...study.jesus,...study.paul,...study.context]){
    const p=byPassage.get(id);
    assert.ok(p,id);
    assert.match(p.sourceUrl??"",/^https:\/\/ebible\.org\/engwebp\/[A-Z0-9]+\.htm$/i,id);
  }
});

test("the Corinthians speech restriction is labeled as a contested positional variant",()=>{
  const p=byPassage.get("1co-14-34-35");
  assert.equal(p?.sourceLayer,"paul-undisputed");
  assert.equal(p?.textualStatus,"transposed-in-some-manuscripts");
  assert.match(p?.textualNote??"",/after v\.40/);
  assert.match(p?.textualNote??"",/critical-apparatus review/i);
  assert.ok(dossier.includes("after verse 40"));
  assert.ok(dossier.includes("interpolation"));
  assert.ok(!study.jesus.includes("mk-16-09-20"));
});

test("ten evidence claims have explicit references, objections and access limits",()=>{
  assert.ok(claims.length>=10);
  const declared=new Set([...study.jesus,...study.paul,...study.context]);
  for(const claim of claims){
    assert.equal(claim.status,"draft");
    for(const field of ["observation","alternateReading","limitation"])assert.ok(claim[field]?.length>=40,`${claim.id} ${field}`);
    assert.ok(claim.passageIds.every(id=>declared.has(id)&&byPassage.has(id)),claim.id);
    assert.ok(claim.sourceIds.every(id=>sourceIds.has(id)&&study.sourceIds.includes(id)),claim.id);
  }
  assert.ok(claims.some(c=>c.assessment==="agreement"));
  assert.ok(claims.some(c=>c.assessment==="tension"));
  assert.ok(claims.some(c=>c.assessment==="interpretation-dependent"));
  assert.ok(claims.some(c=>c.kind==="text-critical"));
});

test("source records identify the two contested issues and publication type honestly",()=>{
  assert.equal(sources.find(s=>s.id==="sybrandi-2024-romans16")?.accessScope,"full-text");
  assert.equal(sources.find(s=>s.id==="burer-wallace-2001-junia")?.accessScope,"publisher-abstract-only");
  assert.equal(sources.find(s=>s.id==="niccum-1997-cor14")?.accessScope,"publisher-abstract-only");
  assert.equal(sources.find(s=>s.id==="bfc-2023-1tim2")?.type,"denominational-report");
  assert.equal(sources.find(s=>s.id==="collins-2010-pastorals")?.accessScope,"publisher-abstract-only");
});

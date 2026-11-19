import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseFrontmatter } from "../scripts/frontmatter.mjs";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const dossiers=read("research/index/jesus-paul-dossiers.json");
const passageRecords=read("research/index/passages.json");
const sayRecords=read("research/index/sayings.json");
const passages=new Map(passageRecords.map(p=>[p.id,p]));
const sayings=new Map(sayRecords.map(s=>[s.id,s]));
const sources=new Map(read("research/index/sources.json").map(s=>[s.id,s]));
const byId=new Map(dossiers.map(d=>[d.id,d]));
const paulineLetters=new Set(["ro","1co","2co","ga","php","1th","phm"]);
const allowed=new Set(["agreement","different-emphasis","extension","apparent-tension",
  "direct-contradiction","insufficient-evidence","interpretation-dependent"]);

test("pilot comparisons have stable IDs, honest statuses, and complete counterreadings",()=>{
  assert.ok(dossiers.length>=10);
  assert.equal(new Set(dossiers.map(d=>d.id)).size,dossiers.length);
  for(const d of dossiers){
    assert.match(d.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(d.status,"draft",d.id);
    assert.ok(allowed.has(d.classification),d.id);
    for(const field of ["title","researchQuestion","assessment","commonGround","counterReading","limitations"])
      assert.ok(typeof d[field]==="string"&&d[field].length>=35,`${d.id}: ${field}`);
    assert.ok(d.differences.length>=2,d.id);
    assert.ok(d.differences.every(x=>x.length>=35),d.id);
  }
});

test("all seven generally undisputed letters appear as direct Pauline witnesses",()=>{
  const seen=new Set();
  let paulLinks=0,gospelLinks=0;
  for(const d of dossiers){
    assert.ok(d.jesus.length>0,d.id);
    assert.ok(d.paul.length>0,d.id);
    for(const w of d.paul){
      const p=passages.get(w.passageId);
      assert.ok(p,`${d.id}: ${w.passageId}`);
      assert.equal(p.sourceLayer,"paul-undisputed",d.id);
      assert.ok(paulineLetters.has(p.bookId),d.id);
      assert.ok(p.sourceUrl.startsWith("https://ebible.org/engwebp/"),w.passageId);
      seen.add(p.bookId);paulLinks++;
    }
    for(const w of d.jesus){
      const p=passages.get(w.passageId);
      assert.ok(p,`${d.id}: ${w.passageId}`);
      assert.ok(["jesus-synoptic","jesus-john"].includes(p.sourceLayer),d.id);
      assert.notEqual(p.unitType,"disputed",w.passageId);
      if(w.sayingId){
        const s=sayings.get(w.sayingId);
        assert.ok(s,`${d.id}: ${w.sayingId}`);
        assert.equal(s.passageId,p.id,w.sayingId);
        assert.equal(s.bookId,p.bookId,w.sayingId);
      }
      gospelLinks++;
    }
  }
  assert.deepEqual([...seen].sort(),[...paulineLetters].sort());
  assert.equal(paulLinks,26);
  assert.equal(gospelLinks,24);
});

test("nine new Pauline passages have correct edition, provenance and reciprocal topics",()=>{
  const ids=["ro-12-14-21","ro-13-01-07","1co-07-17-24","1co-13-01-13",
    "php-02-01-11","php-04-04-07","1th-04-09-12","1th-05-12-22","phm-01-08-21"];
  for(const id of ids){
    const p=passages.get(id);
    assert.ok(p,id);
    assert.equal(p.status,"draft",id);
    assert.equal(p.sourceLayer,"paul-undisputed",id);
    const m=/^([a-z0-9]+)-(\d{2})-(\d{2})-(\d{2})$/.exec(id);
    assert.ok(m,id);
    assert.ok(p.reference.endsWith(`${Number(m[2])}:${Number(m[3])}–${Number(m[4])}`),id);
    assert.match(p.sourceUrl,/^https:\/\/ebible\.org\/engwebp\/(?:ROM|1CO|PHP|1TH|PHM)\d\d\.htm$/);
    assert.ok(p.topics.length>0,id);
    for(const topic of p.topics){
      const meta=parseFrontmatter(readFileSync(`research/topics/${topic}.md`,"utf8"));
      assert.ok(meta.passages.includes(p.id),`${topic} misses ${p.id}`);
    }
  }
});

test("secondary sources retain their access limitations and the primary edition is declared",()=>{
  for(const d of dossiers){
    assert.equal(d.primarySourceId,"web-protestant-66",d.id);
    assert.ok(d.sourceIds.includes(d.primarySourceId),d.id);
    assert.equal(new Set(d.sourceIds).size,d.sourceIds.length,d.id);
    for(const id of d.sourceIds)assert.ok(sources.has(id),`${d.id}: ${id}`);
    assert.ok(sources.get(d.primarySourceId)?.accessScope==="full-text");
  }
  const law=byId.get("law-fulfillment-and-gentile-observance");
  assert.ok(law.sourceIds.includes("thiessen-2016-gentiles"));
  assert.equal(sources.get("thiessen-2016-gentiles").accessScope,"publisher-abstract-only");
});

test("authorship and manuscript-contested texts stay contextual, not direct Pauline",()=>{
  const women=byId.get("women-witnesses-and-pauline-coworkers");
  const context=women.context;
  assert.ok(context.some(x=>x.passageId==="1ti-02-08-15"));
  assert.ok(context.some(x=>x.passageId==="1co-14-34-35"));
  assert.ok(!women.paul.some(x=>x.passageId.startsWith("1ti-")));
  assert.equal(passages.get("1ti-02-08-15").sourceLayer,"paul-disputed");
  assert.equal(passages.get("1co-14-34-35").sourceLayer,"paul-undisputed");
  assert.ok(passages.get("1co-14-34-35").textualNote);
  for(const d of dossiers){
    for(const x of d.context??[]){
      assert.ok(passages.has(x.passageId),d.id);
      assert.ok(x.reason.length>=30,d.id);
      assert.ok(!d.paul.some(w=>w.passageId===x.passageId),d.id);
    }
  }
});

test("the direct contradiction category requires explicit common-scope proof",()=>{
  const flagged=dossiers.filter(d=>d.classification==="direct-contradiction");
  assert.equal(flagged.length,0,"No pilot claim has been reviewed to this standard");
  const validator=readFileSync("scripts/validate-content.mjs","utf8");
  for(const field of ["propositionA","propositionB","sameScopeAnalysis","remainingCounterEvidence"])
    assert.ok(validator.includes(field),field);
  assert.match(validator,/dossier\.classification==="direct-contradiction"/);
  assert.ok(dossiers.some(d=>d.classification==="apparent-tension"));
  assert.ok(dossiers.some(d=>d.classification==="agreement"));
  assert.ok(dossiers.some(d=>d.classification==="insufficient-evidence"));
});

test("high-risk Jesus-Paul comparisons preserve narrative and legal distinctions",()=>{
  const neighbor=byId.get("neighbor-love-and-the-law");
  assert.ok(neighbor.jesus.some(w=>w.passageId==="lk-10-25-37"));
  assert.match(neighbor.limitations,/lawyer, not Jesus/i);
  const slavery=byId.get("slavery-belonging-and-onesimus");
  assert.equal(slavery.classification,"insufficient-evidence");
  assert.match(slavery.limitations,/manumission/i);
  assert.ok(slavery.paul.some(w=>w.passageId==="phm-01-08-21"));
  const marriage=byId.get("divorce-the-lord-and-pauls-guidance");
  assert.match(marriage.assessment,/instruction of the Lord/i);
  assert.ok(marriage.paul.some(w=>w.passageId==="1co-07-10-16"));
  const state=byId.get("political-authority-and-taxation");
  assert.equal(state.classification,"apparent-tension");
  assert.ok(state.paul.some(w=>w.passageId==="ro-13-01-07"));
  assert.match(state.limitations,/contemporary government/i);
});

test("Jesus-Paul pages expose taxonomy, original sources, crosslinks and no-JS fallback",()=>{
  const index=readFileSync("src/pages/jesus-paul/index.astro","utf8");
  const detail=readFileSync("src/pages/jesus-paul/[id].astro","utf8");
  const layout=readFileSync("src/layouts/Base.astro","utf8");
  const home=readFileSync("src/pages/index.astro","utf8");
  const comparisons=readFileSync("src/pages/comparisons/index.astro","utf8");
  const sourcePage=readFileSync("src/pages/passages/[id].astro","utf8");
  const teachingPage=readFileSync("src/pages/teachings/[id].astro","utf8");
  const css=readFileSync("src/styles/site.css","utf8");
  assert.match(index,/data-topic=\{d.topicId\}/);
  assert.match(index,/data-class=\{d.classification\}/);
  assert.match(index,/id="jp-count"/);
  assert.match(index,/no dossier here has yet established a direct contradiction/i);
  assert.match(detail,/\bsourceUrl\b/);
  assert.match(detail,/counterReading/);
  assert.match(detail,/limitations/);
  assert.match(detail,/compareHref/);
  assert.match(detail,/sourceLayer==="paul-disputed"/);
  assert.match(layout,/href="\/jesus-paul\/"/);
  assert.match(home,/href="\/jesus-paul\/"/);
  assert.match(comparisons,/href="\/jesus-paul\/"/);
  assert.match(sourcePage,/jesusPaulStudies/);
  assert.match(teachingPage,/jesusPaulStudies/);
  assert.match(css,/\.jp-witness-columns/);
  assert.match(css,/\.jp-card\[hidden\]/);
});

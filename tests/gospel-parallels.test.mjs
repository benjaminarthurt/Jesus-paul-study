import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseFrontmatter } from "../scripts/frontmatter.mjs";
import { dossierSearchText } from "../src/lib/gospel-dossier-search.mjs";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const dossiers=read("research/index/gospel-parallels.json");
const passages=new Map(read("research/index/passages.json").map(p=>[p.id,p]));
const sayings=new Map(read("research/index/sayings.json").map(s=>[s.id,s]));
const sourceIds=new Set(read("research/index/sources.json").map(s=>s.id));
const books=new Set(["mt","mk","lk","jn"]);
const byId=new Map(dossiers.map(x=>[x.id,x]));

test("Gospel dossiers have unique stable IDs and substantial competing analyses",()=>{
  assert.ok(dossiers.length>=15);
  assert.equal(new Set(dossiers.map(x=>x.id)).size,dossiers.length);
  for(const d of dossiers){
    assert.match(d.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(d.status,"draft");
    assert.ok(["parallel-tradition","related-traditions","distinct-presentations"].includes(d.comparisonType),d.id);
    const meta=parseFrontmatter(readFileSync(`research/topics/${d.topicId}.md`,"utf8"));
    assert.ok(meta.title,d.id);
    for(const field of ["title","researchQuestion","commonGround","literaryContext","alternativeReading","limitation"]){
      assert.ok(d[field]?.length>=25,`${d.id}: ${field}`);
    }
    assert.ok(d.observedDifferences.length>=2,d.id);
    assert.ok(d.observedDifferences.every(x=>x.length>=25),d.id);
  }
});

test("every Gospel witness resolves to the correct Gospel passage and optional child saying",()=>{
  let links=0;
  for(const d of dossiers){
    assert.ok(d.witnesses.length>=2&&d.witnesses.length<=4,d.id);
    assert.equal(new Set(d.witnesses.map(x=>x.bookId)).size,d.witnesses.length,d.id);
    for(const w of d.witnesses){
      links++;
      assert.ok(books.has(w.bookId),d.id);
      assert.ok(["parallel","related","distinct-scene"].includes(w.relation),d.id);
      assert.ok(w.note.length>=25,d.id);
      const parent=passages.get(w.passageId);
      assert.ok(parent,`${d.id}: ${w.passageId}`);
      assert.equal(parent.bookId,w.bookId,d.id);
      assert.ok(parent.sourceUrl.startsWith("https://ebible.org/engwebp/"),d.id);
      assert.ok(parent.sourceLayer.startsWith("jesus-"),d.id);
      if(parent.unitType==="disputed")assert.notEqual(w.relation,"parallel",d.id);
      if(w.sayingId){
        const saying=sayings.get(w.sayingId);
        assert.ok(saying,`${d.id}: ${w.sayingId}`);
        assert.equal(saying.passageId,parent.id,d.id);
        assert.equal(saying.bookId,w.bookId,d.id);
      }
    }
  }
  assert.equal(links,51,"Initial curated witnesses should remain an explicitly reviewed set");
});

test("bibliographic sources are real, distinct, and transparent about limited access",()=>{
  for(const d of dossiers){
    assert.ok(d.sourceIds.length>0,d.id);
    assert.equal(new Set(d.sourceIds).size,d.sourceIds.length,d.id);
    for(const id of d.sourceIds)assert.ok(sourceIds.has(id),`${d.id}: ${id}`);
  }
  const bibliography=read("research/index/sources.json");
  assert.equal(bibliography.find(s=>s.id==="kloppenborg-2023-synoptic")?.accessScope,"publisher-abstract-only");
  assert.equal(bibliography.find(s=>s.id==="felix-just-john-synoptics")?.accessScope,"full-text");
});

test("known distinct scenes are not falsely grouped as certain parallel events",()=>{
  const anointing=byId.get("anointing-stories");
  const luke=anointing.witnesses.find(w=>w.bookId==="lk");
  assert.equal(luke.passageId,"lk-07-36-50");
  assert.equal(luke.relation,"distinct-scene");
  assert.ok(anointing.observedDifferences.some(x=>/Luke 7/i.test(x)));
  const temple=byId.get("temple-action-placement");
  const john=temple.witnesses.find(w=>w.bookId==="jn");
  assert.equal(john.passageId,"jn-02-13-22");
  assert.equal(john.relation,"related");
  assert.match(temple.alternativeReading,/two temple actions/i);
  const sabbath=byId.get("sabbath-healing");
  assert.equal(sabbath.witnesses.find(w=>w.bookId==="jn")?.relation,"distinct-scene");
});

test("specific speaker and manuscript cautions are not erased by Gospel comparison",()=>{
  const commandments=byId.get("love-god-and-neighbor");
  assert.equal(commandments.witnesses.find(w=>w.bookId==="lk")?.passageId,"lk-10-25-37");
  assert.match(commandments.observedDifferences.join(" "),/expert articulates/i);
  const meal=byId.get("final-meal-traditions");
  assert.ok(passages.get(meal.witnesses.find(w=>w.bookId==="lk").passageId)?.textualNote);
  assert.match(meal.limitation,/Luke 22:19–20/);
  const empty=byId.get("empty-tomb-witnesses");
  assert.ok(empty.witnesses.some(w=>w.bookId==="mk"&&w.passageId==="mk-16-01-08"));
  assert.ok(!empty.witnesses.some(w=>w.passageId==="mk-16-09-20"));
  assert.ok(dossiers.filter(d=>d.witnesses.length===4).length>=7);
});

test("responsive four-Gospel routes link research, source text, and compared passages",()=>{
  const index=readFileSync("src/pages/gospel-parallels/index.astro","utf8");
  const detail=readFileSync("src/pages/gospel-parallels/[id].astro","utf8");
  const css=readFileSync("src/styles/site.css","utf8");
  const home=readFileSync("src/pages/index.astro","utf8");
  const compare=readFileSync("src/pages/compare/index.astro","utf8");
  assert.match(index,/data-topic=\{d.topicId\}/);
  assert.match(index,/data-type=\{d.comparisonType\}/);
  assert.match(index,/id="dossier-count"/);
  assert.match(detail,/dossier.witnesses.find/);
  assert.match(detail,/sourceUrl/);
  assert.match(detail,/\/passages\//);
  assert.match(detail,/\/teachings\//);
  assert.match(detail,/compareHref/);
  assert.match(detail,/not establish that this theme is absent/);
  assert.match(css,/\.gospel-witness-grid/);
  assert.match(css,/gospel-dossier-card\[hidden\]/);
  assert.match(home,/href="\/gospel-parallels\/"/);
  assert.match(compare,/href="\/gospel-parallels\/"/);
});

test("Gospel comparison dossiers are discoverable from source passage and teaching pages",()=>{
  const detail=readFileSync("src/pages/gospel-parallels/[id].astro","utf8");
  const source=readFileSync("src/pages/passages/[id].astro","utf8");
  const teaching=readFileSync("src/pages/teachings/[id].astro","utf8");
  assert.match(source,/gospelDossiers.filter/);
  assert.match(source,/gospelStudies.map/);
  assert.match(source,/gospel-parallels/);
  assert.match(teaching,/gospelDossiers.filter/);
  assert.match(teaching,/w.sayingId===saying.id/);
  assert.match(teaching,/gospelStudies.map/);
  assert.match(detail,/passages/);
  assert.match(detail,/teachings/);
});

test("widow's-offering differences reflect the primary Mark/Luke textual contrasts",()=>{
  const widow=byId.get("widows-offering");
  assert.match(widow.commonGround,/both.*scribes.*widows/i);
  assert.match(widow.literaryContext,/shared juxtaposition/i);
  assert.equal(widow.observedDifferences.length,2);
  assert.match(widow.observedDifferences[0],/Mark.*summoning his disciples.*Luke.*without an explicit summons/i);
  assert.match(widow.observedDifferences[1],/Mark.*quadrans.*Luke.*without that conversion/i);
  assert.ok(!widow.observedDifferences.some(d=>/immediately after criticism|similar juxtaposition/i.test(d)));
});

test("theme search includes topic IDs and display titles, not just dossier prose",()=>{
  const index=readFileSync("src/pages/gospel-parallels/index.astro","utf8");
  assert.match(index,/data-search=\{dossierSearchText\(d, topicTitles.get\(d.topicId\) \?\? ""\)\}/);
  const allTopics=new Map(dossiers.map(d=>{
    const meta=parseFrontmatter(readFileSync(`research/topics/${d.topicId}.md`,"utf8"));
    return [d.topicId,meta.title];
  }));
  const wealthy=dossiers.filter(d=>d.topicId==="wealth-poverty");
  assert.ok(wealthy.length>=3);
  for(const d of wealthy){
    const text=dossierSearchText(d,allTopics.get(d.topicId));
    assert.ok(text.includes("poverty"),d.id);
    assert.ok(text.includes("obligation"),d.id);
    assert.ok(text.includes("wealth-poverty"),d.id);
  }
  // The helper must preserve ordinary content searching as well.
  assert.match(dossierSearchText(byId.get("temple-action-placement"),"Authority"),/temple/);
});

test("four-Gospel comparison cards show selected saying-specific textual cautions",()=>{
  const detail=readFileSync("src/pages/gospel-parallels/[id].astro","utf8");
  assert.match(detail,/entry\.saying\?\.caution/);
  assert.match(detail,/Selected saying caution:/);
  assert.match(detail,/\{entry\.saying\.caution\}/);
  const prayer=byId.get("prayer-models");
  for(const bookId of ["mt","lk"]){
    const selected=prayer.witnesses.find(w=>w.bookId===bookId);
    assert.ok(selected?.sayingId,bookId);
    const saying=sayings.get(selected.sayingId);
    assert.ok(saying?.caution?.length>40,bookId);
  }
});

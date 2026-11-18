import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JOHN_CHAPTER_LAST_VERSE, isValidJohnSpan } from "../scripts/john-verses.mjs";
import { parseFrontmatter } from "../scripts/frontmatter.mjs";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const passages=read("research/index/passages.json");
const sayings=read("research/index/sayings.json");
const john=passages.filter(x=>x.bookId==="jn");
const johnSayings=sayings.filter(x=>x.bookId==="jn");
const byId=new Map(john.map(x=>[x.id,x]));

test("John maps all 21 chapters with one literary unit per canonical reference verse",()=>{
  assert.equal(JOHN_CHAPTER_LAST_VERSE.length,21);
  assert.ok(john.length>=85);
  assert.equal(new Set(john.map(x=>x.id)).size,john.length);
  const cells=JOHN_CHAPTER_LAST_VERSE.map(last=>Array(last).fill(0));
  for(const p of john){
    const m=/^jn-(\d{2})-(\d{2})-(\d{2})$/.exec(p.id);
    assert.ok(m,p.id);
    const [ch,first,last]=m.slice(1).map(Number);
    assert.ok(isValidJohnSpan(ch,first,last),p.id);
    assert.equal(p.reference,`John ${ch}:${first}–${last}`);
    assert.equal(p.sourceUrl,`https://ebible.org/engwebp/JHN${m[1]}.htm`);
    assert.equal(p.sourceLayer,"jesus-john");
    assert.equal(p.status,"draft");
    assert.ok(["speech","dialogue","parable","action","context","prayer","illustration","disputed"].includes(p.unitType),p.id);
    assert.ok(typeof p.title==="string"&&p.title.length>4,p.id);
    for(let v=first;v<=last;v++)cells[ch-1][v-1]++;
  }
  for(const [chapter,row] of cells.entries())for(const [v,count] of row.entries())
    assert.equal(count,1,`John ${chapter+1}:${v+1}`);
});

test("John selected sayings are attributed only to valid same-Gospel, non-disputed parents",()=>{
  assert.ok(johnSayings.length>=85);
  assert.equal(new Set(johnSayings.map(x=>x.id)).size,johnSayings.length);
  let candidates=0;
  for(const s of johnSayings){
    const m=/^jn-s-(\d{2})-(\d{2})-(\d{2})$/.exec(s.id);
    assert.ok(m,s.id);
    const [ch,first,last]=m.slice(1).map(Number);
    assert.ok(isValidJohnSpan(ch,first,last),s.id);
    assert.equal(s.bookId,"jn");
    assert.equal(s.status,"draft");
    assert.equal(s.reference,`John ${ch}:${first}${first===last?"":"–"+last}`);
    const parent=byId.get(s.passageId);
    assert.ok(parent,s.id);
    const p=/^jn-(\d{2})-(\d{2})-(\d{2})$/.exec(parent.id);
    assert.ok(p,s.id);
    assert.equal(ch,Number(p[1]),s.id);
    assert.ok(first>=Number(p[2])&&last<=Number(p[3]),s.id);
    assert.notEqual(parent.unitType,"disputed",s.id);
    assert.ok(s.topics.every(t=>parent.topics.includes(t)),s.id);
    assert.equal(s.sourceUrl,`https://ebible.org/engwebp/JHN${p[1]}.htm`);
    for(const c of s.parallels){
      assert.ok(["mk","mt","lk"].includes(c.bookId),s.id);
      assert.ok(["related","parallel"].includes(c.relationship),s.id);
      assert.equal(c.status,"candidate",s.id);
      candidates++;
    }
  }
  assert.ok(candidates>=10);
});

test("John's later adulterous-woman passage and uncertain John 3 speaker remain separated",()=>{
  assert.equal(byId.get("jn-07-53-53")?.unitType,"disputed");
  assert.equal(byId.get("jn-08-01-11")?.unitType,"disputed");
  assert.equal(byId.get("jn-07-53-53")?.textualStatus,"disputed-pericope-adulterae");
  assert.equal(byId.get("jn-08-01-11")?.textualStatus,"disputed-pericope-adulterae");
  for(const id of ["jn-03-16-21","jn-03-31-36"]){
    assert.equal(byId.get(id)?.unitType,"context");
    assert.ok(byId.get(id)?.textualNote?.includes("speaker")||byId.get(id)?.textualNote?.includes("speaking"),id);
    assert.equal(byId.get(id)?.textualStatus,undefined,"Speaker uncertainty must not be mislabeled a manuscript variant");
  }
  for(const id of ["jn-07-53-53","jn-08-01-11","jn-03-16-21","jn-03-31-36"]){
    assert.ok(!johnSayings.some(x=>x.passageId===id),id);
  }
  assert.ok(!johnSayings.some(x=>x.reference.startsWith("John 8:1–")));
});

test("John's manuscript variants and pastoral interpretation cautions remain distinct",()=>{
  for(const [id,status] of [
    ["jn-01-01-18","variant-prologue-1-18"],
    ["jn-05-01-15","disputed-5-3b-4"],
    ["jn-07-53-53","disputed-pericope-adulterae"],
    ["jn-08-01-11","disputed-pericope-adulterae"],
    ["jn-09-35-41","variant-son-of-man-or-god"]
  ]){
    const p=byId.get(id);
    assert.equal(p?.textualStatus,status,id);
    assert.ok(p.textualNote.length>=60,id);
  }
  for(const id of ["jn-20-19-23","jn-21-24-25"]){
    assert.equal(byId.get(id)?.textualStatus,undefined);
    assert.ok(byId.get(id)?.textualNote?.length>=60);
  }
  for(const id of ["jn-s-09-35-39","jn-s-20-19-23","jn-s-21-15-19"]){
    assert.ok(johnSayings.find(s=>s.id===id)?.caution?.length>40,id);
  }
});

test("Every John topic association is reciprocal and the existing study IDs survive",()=>{
  const known=new Set(passages.map(x=>x.id));
  const topicIds=[...new Set(john.flatMap(x=>x.topics))];
  for(const topic of topicIds){
    const meta=parseFrontmatter(readFileSync(`research/topics/${topic}.md`,"utf8"));
    for(const passage of john.filter(x=>x.topics.includes(topic)))
      assert.ok(meta.passages.includes(passage.id),`${topic} lacks ${passage.id}`);
    assert.ok(meta.passages.every(x=>known.has(x)),topic);
  }
  assert.ok(byId.has("jn-04-07-42"),"Samaritan woman study citation preserved");
  assert.ok(byId.has("jn-20-11-18"),"Mary Magdalene study citation preserved");
  assert.equal(byId.get("jn-04-07-42")?.unitType,"dialogue");
  assert.equal(byId.get("jn-20-11-18")?.unitType,"dialogue");
});

test("John is exposed in all four Gospel book and teaching navigation",()=>{
  const book=readFileSync("src/pages/books/[slug].astro","utf8");
  const browser=readFileSync("src/pages/teachings/index.astro","utf8");
  const detail=readFileSync("src/pages/teachings/[id].astro","utf8");
  const home=readFileSync("src/pages/index.astro","utf8");
  assert.ok(book.includes("john ? 21"));
  assert.ok(book.includes('"JHN"'));
  assert.ok(browser.includes("All four indexed Gospels"));
  assert.ok(browser.includes("data-book={s.bookId}"));
  assert.ok(detail.includes('jn:"JHN"'));
  assert.ok(home.includes("Matthew, Mark, Luke, and John"));
});

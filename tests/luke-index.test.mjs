import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LUKE_CHAPTER_LAST_VERSE, isValidLukeSpan } from "../scripts/luke-verses.mjs";
import { parseFrontmatter } from "../scripts/frontmatter.mjs";

const read = path => JSON.parse(readFileSync(path,"utf8"));
const passages = read("research/index/passages.json");
const sayings = read("research/index/sayings.json");
const luke = passages.filter(x=>x.bookId==="lk");
const lukeSayings = sayings.filter(x=>x.bookId==="lk");
const byPassage = new Map(luke.map(x=>[x.id,x]));

test("Luke's 24-chapter literary index has valid references and no missing or duplicate verse coverage",()=>{
  assert.equal(LUKE_CHAPTER_LAST_VERSE.length,24);
  assert.ok(luke.length>=140);
  const visited=LUKE_CHAPTER_LAST_VERSE.map(last=>Array(last).fill(0));
  for(const p of luke){
    const id=/^lk-(\d{2})-(\d{2})-(\d{2})$/.exec(p.id);
    assert.ok(id,p.id);
    const [chapter,first,last]=id.slice(1).map(Number);
    assert.ok(isValidLukeSpan(chapter,first,last),p.id);
    assert.equal(p.reference,`Luke ${chapter}:${first}–${last}`,p.id);
    assert.equal(p.sourceUrl,`https://ebible.org/engwebp/LUK${id[1]}.htm`,p.id);
    assert.equal(p.status,"draft",p.id);
    assert.ok(p.title,p.id);
    assert.ok(["speech","dialogue","parable","action","context","prayer","illustration"].includes(p.unitType),p.id);
    for(let verse=first;verse<=last;verse++)visited[chapter-1][verse-1]++;
  }
  for(const [ch,arr] of visited.entries())for(const [verse,count] of arr.entries())
    assert.equal(count,1,`Luke ${ch+1}:${verse+1}`);
});

test("Luke's selected sayings have parent and topic integrity",()=>{
  assert.ok(lukeSayings.length>=100);
  assert.ok(lukeSayings.every(s=>s.bookId==="lk"&&s.status==="draft"));
  let candidates=0;
  const seen=new Set();
  for(const s of lukeSayings){
    assert.match(s.id,/^lk-s-\d{2}-\d{2}-\d{2}$/);
    assert.ok(!seen.has(s.id),s.id);seen.add(s.id);
    const parent=byPassage.get(s.passageId);
    assert.ok(parent,s.id);
    const match=/^lk-(\d{2})-(\d{2})-(\d{2})$/.exec(parent.id);
    assert.ok(match);
    assert.equal(s.chapter,Number(match[1]),s.id);
    assert.ok(s.startVerse>=Number(match[2])&&s.endVerse<=Number(match[3]),s.id);
    assert.ok(s.topics.every(t=>parent.topics.includes(t)),s.id);
    assert.equal(s.sourceUrl,`https://ebible.org/engwebp/LUK${match[1]}.htm`);
    for(const p of s.parallels){
      assert.ok(["mk","mt","jn"].includes(p.bookId),s.id);
      assert.ok(["parallel","related"].includes(p.relationship),s.id);
      assert.equal(p.status,"candidate",s.id);
      candidates++;
    }
  }
  assert.ok(candidates>=100);
});

test("Luke topic navigation remains reciprocal for every new unit",()=>{
  const topicIds=[...new Set(luke.flatMap(x=>x.topics))];
  const allIds=new Set(passages.map(x=>x.id));
  for(const id of topicIds){
    const meta=parseFrontmatter(readFileSync(`research/topics/${id}.md`,"utf8"));
    for(const p of luke.filter(x=>x.topics.includes(id)))assert.ok(meta.passages.includes(p.id),`${id} missing ${p.id}`);
    for(const p of meta.passages)assert.ok(allIds.has(p),`${id}: invalid ${p}`);
  }
  const divorce=byPassage.get("lk-16-18-18");
  const divorceSaying=lukeSayings.find(x=>x.id==="lk-s-16-18-18");
  const doc=parseFrontmatter(readFileSync("research/topics/marriage-divorce.md","utf8"));
  assert.ok(divorce.topics.includes("marriage-divorce"));
  assert.ok(divorceSaying?.topics.includes("marriage-divorce"));
  assert.ok(doc.passages.includes("lk-16-18-18"));
});

test("Luke's infancy narratives remain narrative, not teachings attributed to Jesus",()=>{
  assert.ok(byPassage.get("lk-01-26-38")?.unitType==="context");
  assert.ok(byPassage.get("lk-01-46-56")?.unitType==="prayer");
  assert.equal(byPassage.get("lk-14-12-14")?.unitType,"speech","Unit describes literary form; selected sayings carry instruction speechType");
  assert.ok(!lukeSayings.some(s=>s.chapter===1));
  assert.ok(lukeSayings.some(s=>s.id==="lk-s-02-49-49"));
});

test("Luke textual variants stay visible and tagged as unresolved",()=>{
  for(const [id,key] of [
    ["lk-10-01-12","seventy-or-seventy-two"],
    ["lk-22-39-46","disputed-angel-and-sweat"],
    ["lk-23-32-43","disputed-prayer-23-34"],
    ["lk-24-50-53","variant-ascension-wording"]
  ]){
    const p=byPassage.get(id);
    assert.equal(p?.textualStatus,key);
    assert.ok(p.textualNote.length>=60);
  }
  for(const id of ["lk-s-10-02-12","lk-s-22-40-46","lk-s-23-34-34","lk-s-11-02-04"]){
    assert.ok(lukeSayings.find(s=>s.id===id)?.caution?.length>40,id);
  }
});

test("Luke is available in the book catalog and Gospel teaching filter",()=>{
  const book=readFileSync("src/pages/books/[slug].astro","utf8");
  const browser=readFileSync("src/pages/teachings/index.astro","utf8");
  const details=readFileSync("src/pages/teachings/[id].astro","utf8");
  assert.ok(book.includes("luke ? 24"));
  assert.ok(book.includes('"LUK"'));
  assert.ok(browser.includes("All three indexed Gospels"));
  assert.ok(browser.includes("data-book={s.bookId}"));
  assert.ok(details.includes("bookName.get(saying.bookId)"));
  assert.ok(details.includes("candidateChapterUrl"));
  assert.ok(byPassage.has("lk-10-25-37"));
  assert.ok(byPassage.has("lk-15-11-32"));
});

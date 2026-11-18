import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MATTHEW_CHAPTER_LAST_VERSE, isValidMatthewSpan } from "../scripts/matthew-verses.mjs";
import { parseFrontmatter } from "../scripts/frontmatter.mjs";

const read = file => JSON.parse(readFileSync(file,"utf8"));
const passages = read("research/index/passages.json");
const sayings = read("research/index/sayings.json");
const matthew = passages.filter(p=>p.bookId==="mt");
const matthewSayings = sayings.filter(s=>s.bookId==="mt");
const marked = passages.filter(p=>p.bookId==="mk");
const topics = [...new Set(matthew.flatMap(p=>p.topics))];

test("Matthew pilot maps every verse once across all 28 chapters", () => {
  assert.equal(MATTHEW_CHAPTER_LAST_VERSE.length,28);
  assert.ok(matthew.length>=110);
  const seen=MATTHEW_CHAPTER_LAST_VERSE.map(v=>Array(v).fill(0));
  for(const p of matthew) {
    const m=/^mt-(\d{2})-(\d{2})-(\d{2})$/.exec(p.id);
    assert.ok(m,p.id);
    const [ch,first,last]=m.slice(1).map(Number);
    assert.ok(isValidMatthewSpan(ch,first,last),p.id);
    assert.equal(p.reference,`Matthew ${ch}:${first}–${last}`);
    assert.ok(["speech","dialogue","parable","action","context","prayer"].includes(p.unitType),p.id);
    assert.ok(p.title && p.title.length>4,p.id);
    assert.equal(p.sourceUrl,`https://ebible.org/engwebp/MAT${m[1]}.htm`);
    assert.equal(p.status,"draft");
    for(let verse=first;verse<=last;verse++)seen[ch-1][verse-1]++;
  }
  for(const [i,a] of seen.entries())for(const [v,count] of a.entries())assert.equal(count,1,`Matthew ${i+1}:${v+1}`);
});

test("Matthew units preserve non-speech narrative and text-critical cautions",()=>{
  assert.ok(matthew.some(p=>p.unitType==="context" && p.id==="mt-01-01-17"));
  assert.ok(matthew.some(p=>p.unitType==="action"));
  assert.ok(matthew.some(p=>p.unitType==="parable"));
  assert.ok(matthew.some(p=>p.unitType==="speech"));
  assert.match(matthew.find(p=>p.id==="mt-17-14-21")?.textualNote??"",/17:21/);
  assert.equal(matthew.find(p=>p.id==="mt-25-31-46")?.unitType,"speech");
  assert.ok(marked.some(p=>p.id==="mk-16-09-20" && p.textualStatus==="disputed-longer-ending"));
});

test("Matthew sayings are scoped to correct parents and Gospel references",()=>{
  assert.ok(matthewSayings.length>=70);
  const byId=new Map(matthew.map(p=>[p.id,p]));
  const seen=new Set();
  let candidateCount=0;
  for(const s of matthewSayings){
    assert.match(s.id,/^mt-s-\d{2}-\d{2}-\d{2}$/);
    assert.ok(!seen.has(s.id),s.id);seen.add(s.id);
    assert.equal(s.status,"draft");
    assert.equal(s.bookId,"mt");
    const parent=byId.get(s.passageId);
    assert.ok(parent,s.id);
    const m=/^mt-(\d{2})-(\d{2})-(\d{2})$/.exec(parent.id);
    assert.ok(m);
    assert.equal(s.chapter,Number(m[1]),s.id);
    assert.ok(s.startVerse>=Number(m[2]) && s.endVerse<=Number(m[3]),s.id);
    assert.ok(s.topics.every(t=>parent.topics.includes(t)),s.id);
    assert.equal(s.sourceUrl,`https://ebible.org/engwebp/MAT${m[1]}.htm`);
    for(const p of s.parallels){
      assert.ok(["mk","lk","jn"].includes(p.bookId));
      assert.equal(p.status,"candidate");
      assert.ok(["parallel","related"].includes(p.relationship));
      candidateCount++;
    }
  }
  assert.ok(candidateCount>=90);
});

test("the reciprocal research topic indexes include the new Matthew unit links",()=>{
  const all=new Set(passages.map(p=>p.id));
  for (const topic of topics){
    const path=`research/topics/${topic}.md`;
    const meta=parseFrontmatter(readFileSync(path,"utf8"));
    for(const id of matthew.filter(p=>p.topics.includes(topic)).map(p=>p.id)){
      assert.ok(meta.passages.includes(id),`${topic} is missing ${id}`);
    }
    assert.ok(meta.passages.every(id=>all.has(id)),topic);
  }
});

test("Matthew is a teaching-browser source alongside Mark",()=>{
  const browser=readFileSync("src/pages/teachings/index.astro","utf8");
  const detail=readFileSync("src/pages/teachings/[id].astro","utf8");
  const book=readFileSync("src/pages/books/[slug].astro","utf8");
  assert.ok(browser.includes('id="teaching-book"'));
  assert.ok(browser.includes('data-book={s.bookId}'));
  assert.ok(browser.includes("normalizeQuery"));
  assert.ok(detail.includes("bookName.get(saying.bookId)"));
  assert.ok(detail.includes("candidateChapterUrl"));
  assert.ok(book.includes("matthew ? 28"));
  assert.ok(book.includes("sourcePrefix"));
});

test("Matthew divorce teaching and parent are discoverable from marriage-divorce",()=>{
  const saying=matthewSayings.find(s=>s.id==="mt-s-05-31-32");
  const parent=matthew.find(p=>p.id==="mt-05-21-48");
  const topic=parseFrontmatter(readFileSync("research/topics/marriage-divorce.md","utf8"));
  assert.ok(saying?.topics.includes("marriage-divorce"),"Matthew 5:31–32 must appear in the teachings topic filter");
  assert.ok(parent?.topics.includes("marriage-divorce"),"Parent research passage must carry the topic");
  assert.ok(topic.passages.includes(parent.id),"Marriage and Divorce topic must link the parent passage");
  assert.ok(saying.topics.every(t=>parent.topics.includes(t)),"The saying's topics must be represented by its parent");
});

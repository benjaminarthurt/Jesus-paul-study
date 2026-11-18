import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  normalizeQuery, passageSearchText, matchesPassage, choosePair,
  compareHref, defaultPair, corpusLabels, primaryUrlIsTrusted
} from "../src/lib/passage-search.mjs";

const text = file => readFileSync(file,"utf8");
const read = file => JSON.parse(text(file));
const passages = read("research/index/passages.json");
const books = read("research/index/books.json");
const knownIds = new Set(passages.map(p=>p.id));

test("every indexed passage has a stable URL and a real WEBP chapter reference",()=>{
  assert.ok(passages.length >= 245,"Matthew expansion should not reduce the indexed corpus");
  assert.equal(knownIds.size,passages.length);
  for(const passage of passages){
    assert.ok(primaryUrlIsTrusted(passage.sourceUrl), passage.id);
    assert.ok(existsSync("src/pages/passages/[id].astro"));
    const chapter=passage.id.match(/^([1-3]?[a-z]+)-(\d{2})-/);
    assert.ok(chapter,passage.id);
    assert.ok(books.some(b=>b.id===passage.bookId),passage.id);
    assert.match(passage.reference,/[0-9]+:[0-9]+/);
  }
});

test("search covers reference, metadata, topics and editorial summaries",()=>{
  const romans=passages.find(p=>p.id==="ro-16-01-16");
  const search=passageSearchText(romans,"Romans",["Women, Equality, and Religious Authority"]);
  assert.ok(search.includes("romans 16"));
  assert.ok(search.includes("women"));
  assert.ok(search.includes("paul-undisputed"));
  assert.equal(normalizeQuery("  Women   AUTHORITY "),"women authority");
  const item={search,book:romans.bookId,topics:romans.topics.join(" "),corpus:romans.sourceLayer,status:romans.status,variant:"false"};
  assert.ok(matchesPassage(item,{query:"Romans Women",book:"ro",topic:"women-authority",corpus:"paul-undisputed",status:"draft"}));
  assert.equal(matchesPassage(item,{book:"lk"}),false);
  assert.equal(matchesPassage(item,{query:"unknown term"}),false);
  assert.equal(matchesPassage(item,{variantOnly:true}),false);
  assert.equal(matchesPassage({...item,variant:"true"},{variantOnly:true}),true);
  assert.equal(matchesPassage(item,{topic:"women"}),false); // facet IDs are exact
});

test("pair URL is deterministic, shareable and rejects invalid source IDs",()=>{
  assert.ok(knownIds.has(defaultPair.left));
  assert.ok(knownIds.has(defaultPair.right));
  assert.deepEqual(choosePair(knownIds,{left:"jn-20-11-18",right:"1co-14-34-35"}),{left:"jn-20-11-18",right:"1co-14-34-35"});
  assert.deepEqual(choosePair(knownIds,{left:"not-a-passage",right:"1co-14-34-35"}),{left:defaultPair.left,right:"1co-14-34-35"});
  assert.equal(compareHref("jn-20-11-18","1co-14-34-35"),"/compare/?left=jn-20-11-18&right=1co-14-34-35");
  assert.equal(choosePair(knownIds,{left:"1co-14-34-35",right:"1co-14-34-35"}).right,"1co-14-34-35");
});

test("source URL policy accepts only the verified WEBP chapter host and paths",()=>{
  assert.ok(primaryUrlIsTrusted("https://ebible.org/engwebp/MRK16.htm"));
  assert.equal(primaryUrlIsTrusted("https://evil.example/engwebp/MRK16.htm"),false);
  assert.equal(primaryUrlIsTrusted("http://ebible.org/engwebp/MRK16.htm"),false);
  assert.equal(primaryUrlIsTrusted("https://ebible.org/engwebp/MRK16.htm?ref=foo"),false);
  assert.equal(primaryUrlIsTrusted("https://ebible.org/engwebp/../../MALWARE"),false);
});

test("source-layer labels clearly distinguish Gospel, Pauline authorship and Acts",()=>{
  assert.match(corpusLabels["jesus-synoptic"],/Gospel/i);
  assert.match(corpusLabels["paul-undisputed"],/undisputed/i);
  assert.match(corpusLabels["paul-disputed"],/disputed/i);
  assert.match(corpusLabels.acts,/narrative/i);
});

test("static pages protect research cautions and cannot masquerade as full Bible text",()=>{
  const search=text("src/pages/search/index.astro");
  const compare=text("src/pages/compare/index.astro");
  const passage=text("src/pages/passages/[id].astro");
  const layout=text("src/layouts/Base.astro");
  const config=text("astro.config.mjs");
  assert.ok(search.includes("not a full Bible concordance"));
  assert.ok(search.includes("aria-live"));
  assert.ok(search.includes("textualNote"));
  assert.ok(compare.includes("not verse-by-verse Bible text"));
  assert.ok(compare.includes("choosePair"));
  assert.ok(compare.includes("popstate"));
  assert.ok(compare.includes("textualNote"));
  assert.ok(passage.includes("Textual caution"));
  assert.ok(passage.includes("sourceNames"));
  assert.ok(passage.includes('"/sources/#source-"'));
  assert.ok(layout.includes('href="/search/"'));
  assert.ok(layout.includes('href="/compare/"'));
  assert.ok(layout.includes('rel="canonical"'));
  assert.ok(config.includes("PUBLIC_SITE_URL"));
});

test("citation range searches normalize ASCII and Unicode dash characters",()=>{
  const matthew=passages.find(p=>p.id==="mt-05-17-20");
  const galatians=passages.find(p=>p.id==="ga-03-23-25");
  assert.ok(matthew && galatians);
  assert.equal(normalizeQuery("Matthew 5:17–20"),"matthew 5:17-20");
  assert.equal(normalizeQuery("Matthew 5:17—20"),"matthew 5:17-20");
  assert.equal(normalizeQuery("Matthew 5:17−20"),"matthew 5:17-20");
  const card = p => ({search:passageSearchText(p),book:p.bookId,topics:p.topics.join(" "),corpus:p.sourceLayer,status:p.status,variant:"false"});
  assert.ok(matchesPassage(card(matthew),{query:"Matthew 5:17-20"}));
  assert.ok(matchesPassage(card(matthew),{query:"Matthew 5:17–20"}));
  assert.ok(matchesPassage(card(galatians),{query:"Galatians 3:23-25"}));
  assert.ok(matchesPassage(card(galatians),{query:"Galatians 3:23–25"}));
});

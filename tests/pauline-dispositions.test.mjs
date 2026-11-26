import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';const load=n=>JSON.parse(readFileSync(new URL('../research/index/'+n+'.json',import.meta.url),'utf8'));test('all Pauline parents have a preliminary disposition and exact teaching links',()=>{const p=load('passages').filter(x=>x.sourceLayer.startsWith('paul-')),t=load('pauline-teachings'),d=load('pauline-extraction-dispositions');assert.deepEqual(d.map(x=>x.passageId).sort(),p.map(x=>x.id).sort());for(const x of d){assert.deepEqual(x.teachingIds.slice().sort(),t.filter(y=>y.passageId===x.passageId).map(y=>y.id).sort());assert.equal(x.reviewStatus,'pending');}});

test("inspected letter inventories distinguish English inspection from editorial review", () => {
  const dispositions = load("pauline-extraction-dispositions");
  for (const book of Object.keys(load("pauline-verse-counts"))) {
    const parents = load("passages").filter(p => p.bookId === book);
    for (const p of parents) {
      const d = dispositions.find(d => d.passageId === p.id);
      assert.ok(d.primaryTextCheck.chapterUrls.includes(p.sourceUrl), p.reference);
      assert.ok(d.note.length > 20);
    }
  }
});

test("reported voices retain the attribution evidence and the letter's authorship layer", () => {
  const teachings = load("pauline-teachings");
  for (const [id, attribution, sourceLayer] of [
    ["1ti-t-04-01-03", "reported-spirit-speech", "paul-disputed"],
    ["tit-t-01-12-14", "quoted-human-speech", "paul-disputed"],
    ["1co-t-06-12-14", "contested-voice", "paul-undisputed"],
    ["ro-t-16-21-23", "quoted-human-speech", "paul-undisputed"],
  ]) {
    const teaching = teachings.find(t => t.id === id);
    assert.equal(teaching.attribution, attribution);
    assert.equal(teaching.sourceLayer, sourceLayer);
    assert.ok(teaching.attributionNote);
  }
});

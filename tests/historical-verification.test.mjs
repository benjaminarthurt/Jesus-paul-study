import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
const rows=JSON.parse(readFileSync(new URL('../research/index/historical-verification.json',import.meta.url),'utf8'));
test('historical verification ledger has unique resolvable draft reviews',()=>{
 assert.ok(rows.length>=25);
 assert.equal(new Set(rows.map(r=>r.reviewId)).size,rows.length);
 for(const r of rows){assert.ok(existsSync(new URL(`../research/reviews/${r.reviewId}.md`,import.meta.url)));assert.ok(['pending-recheck','selected-english-text-rechecked'].includes(r.verification));assert.equal(r.publicationStatus,'draft');}
});

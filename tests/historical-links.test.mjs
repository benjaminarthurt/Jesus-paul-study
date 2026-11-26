import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const rows=JSON.parse(readFileSync(new URL('../research/index/historical-verification.json',import.meta.url),'utf8'));
test('historical studies have valid period and comparison links',()=>{for(const r of rows){assert.ok(['early','late-antique','medieval','reformation','modern'].includes(r.period));assert.ok(r.comparisonIds.length);assert.equal(new Set(r.comparisonIds).size,r.comparisonIds.length);for(const id of r.comparisonIds)assert.ok(existsSync(new URL('../research/comparisons/'+id+'.md',import.meta.url)),id);}});

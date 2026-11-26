import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {paulineCoverage} from "../src/lib/pauline-coverage.mjs";
const read=n=>JSON.parse(readFileSync(new URL("../research/index/"+n+".json",import.meta.url),"utf8"));
test("coverage handles overlapping and cross-chapter ranges",()=>{
 const [r]=paulineCoverage({x:[5,5]},[{bookId:"x",reference:"X 1:2–2:2"},{bookId:"x",reference:"X 1:3–4"}]);
 assert.equal(r.covered,6);
 assert.deepEqual(r.chapters.map(c=>c.gaps),[[{start:1,end:1}],[{start:3,end:5}]]);
});
test("invalid ranges fail",()=>assert.throws(()=>paulineCoverage({x:[5]},[{bookId:"x",reference:"X 1:1–6"}])));
test("all Pauline references fit provisional verse inventory",()=>{
 const rows=paulineCoverage(read("pauline-verse-counts"),read("passages"));
 assert.equal(rows.length,13);
 assert.equal(rows.flatMap(r=>r.chapters).length,87);
 for(const r of rows)for(const c of r.chapters)assert.equal(c.covered+c.gaps.reduce((s,g)=>s+g.end-g.start+1,0),c.total);
});

test("all provisional Pauline verse slots intersect an indexed reference",()=>{
 for(const r of paulineCoverage(read("pauline-verse-counts"),read("passages"))) assert.equal(r.covered,r.total,r.bookId);
});

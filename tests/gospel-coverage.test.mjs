import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {paulineCoverage} from "../src/lib/pauline-coverage.mjs";
const read=n=>JSON.parse(readFileSync(new URL("../research/index/"+n+".json",import.meta.url),"utf8"));
test("Gospel references fit provisional verse numbering",()=>{
 const rows=paulineCoverage(read("gospel-verse-counts"),read("passages"));
 assert.equal(rows.length,4);
 assert.equal(rows.flatMap(r=>r.chapters).length,89);
 for(const r of rows)for(const c of r.chapters)assert.equal(c.covered+c.gaps.reduce((s,g)=>s+g.end-g.start+1,0),c.total);
});

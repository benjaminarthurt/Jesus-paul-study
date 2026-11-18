import test from "node:test";
import assert from "node:assert/strict";
import { MARK_CHAPTER_LAST_VERSE, isValidMarkSpan } from "../scripts/mark-verses.mjs";
test("there are sixteen defined chapter boundaries",()=>{
  assert.equal(MARK_CHAPTER_LAST_VERSE.length,16);
  assert.deepEqual(MARK_CHAPTER_LAST_VERSE.slice(9,12),[52,33,44]);
});
test("existing edge verses validate",()=>{
  assert.equal(isValidMarkSpan(10,46,52),true);
  assert.equal(isValidMarkSpan(16,9,20),true); // only a reference-range check; textual status remains disputed
});
test("nonexistent and malformed verses are rejected",()=>{
  for(const span of [[10,46,99],[9,42,51],[16,9,21],[0,1,5],[17,1,2],[7,0,4],[7,5,4],[7,1.5,3]]) {
    assert.equal(isValidMarkSpan(...span),false,JSON.stringify(span));
  }
});

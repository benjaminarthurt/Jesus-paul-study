import test from "node:test";
import assert from "node:assert/strict";
import { parseFrontmatter } from "../scripts/frontmatter.mjs";

test("accepts valid quoted scalar and quoted inline array", () => {
  const result = parseFrontmatter([
    "---", 'status: "draft"', 'passages: ["mt-05-17-20", "ga-03-23-25"]', "---", "Body"
  ].join("\n"));
  assert.equal(result.status, "draft");
  assert.deepEqual(result.passages, ["mt-05-17-20", "ga-03-23-25"]);
});
test("accepts YAML block arrays", () => {
  const result = parseFrontmatter([
    "---", "status: draft", "passages:", "  - mt-05-17-20", "  - ga-03-23-25", "---", "Body"
  ].join("\n"));
  assert.deepEqual(result.passages, ["mt-05-17-20", "ga-03-23-25"]);
});
test("rejects malformed or duplicate-key YAML", () => {
  assert.throws(() => parseFrontmatter("---\nstatus: [broken\n---\n"));
  assert.throws(() => parseFrontmatter("---\nstatus: draft\nstatus: reviewed\n---\n"));
});
test("rejects missing frontmatter or non-map YAML", () => {
  assert.throws(() => parseFrontmatter("not frontmatter"));
  assert.throws(() => parseFrontmatter("---\n- list\n---\n"));
});

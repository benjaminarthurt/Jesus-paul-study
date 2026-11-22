import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const collections = [
  ["topics", "research/topics"],
  ["comparisons", "research/comparisons"],
  ["modern-issues", "research/modern-issues"],
  ["research-reviews", "research/reviews"]
];
const routes = new Map(collections.map(([route, dir]) => [route, dir]));

test("rendered research Markdown links use published site routes", () => {
  for (const [, dir] of collections) {
    for (const file of readdirSync(dir).filter(name => name.endsWith(".md"))) {
      const source = readFileSync(join(dir, file), "utf8");
      for (const match of source.matchAll(/\[[^\]]+\]\(([^\s)]+)(?:\s+["'][^"']+["'])?\)/g)) {
        const href = match[1];
        assert.doesNotMatch(href, /^(?![a-z][a-z0-9+.-]*:|\/)[^?#]+\.md(?:[?#].*)?$/i,
          `${dir}/${file}: ${href} points to a repository file rather than a published route`);
        const url = href.match(/^\/(topics|comparisons|modern-issues|research-reviews)\/([^/?#]+)\/?(?:[?#].*)?$/);
        if (url) {
          const targetDir = routes.get(url[1]);
          assert.ok(existsSync(join(targetDir, url[2] + ".md")),
            `${dir}/${file}: site route ${href} has no matching research page`);
        }
      }
    }
  }
});

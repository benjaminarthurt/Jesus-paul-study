import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";

const [base, revision] = process.argv.slice(2);
const root = new URL(base.endsWith("/") ? base : base + "/");
assert.equal(root.protocol, "https:");
assert.match(revision, /^[0-9a-f]{40}$/);

async function check() {
  for (const route of ["", "compare/", "gospel-parallels/passages/", "passages/mk-16-09-20/", "pauline-teachings/1co-t-07-10-11/"]) {
    const url = new URL(route, root);
    const response = await fetch(url, {signal: AbortSignal.timeout(15000), cache: "no-store"});
    assert.equal(response.status, 200, url.href);
    const html = await response.text();
    assert.ok(html.includes('name="study-revision" content="' + revision + '"'), "Unexpected deployed revision at " + url.href);
    assert.ok(html.includes('rel="canonical" href="' + url.href + '"'), "Wrong canonical at " + url.href);
    if (route === "") {
      const stylesheet = html.match(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/)?.[1];
      assert.ok(stylesheet, "Missing production stylesheet");
      const css = await fetch(new URL(stylesheet, root), {signal: AbortSignal.timeout(15000)});
      assert.equal(css.status, 200);
      assert.match(css.headers.get("content-type") || "", /text\/css/);
    }
  }
}
for (let attempt = 1; ; attempt++) {
  try {
    await check();
    console.log("Verified deployed revision " + revision + " at " + root.href);
    break;
  } catch (error) {
    if (attempt === 8) throw error;
    console.warn(error.message);
    await setTimeout(10000);
  }
}

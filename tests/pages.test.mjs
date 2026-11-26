import test from "node:test";
import assert from "node:assert/strict";
import { mountHtml } from "../src/lib/mount-html.mjs";

test("project deployment mounts links and forms without altering prose, fragments or remote URLs", async () => {
  const html = '<a href="/read/?a=1&amp;b=2">/read/</a><form action="/compare/"></form><a href="#a">x</a><a href="//example.org/">external</a><a href="/study/already/">x</a>';
  const expected = html.replace('href="/read/', 'href="/study/read/').replace('action="/compare/', 'action="/study/compare/');
  assert.equal(await mountHtml(html, "/study/"), expected);
  assert.equal(await mountHtml(html, "/"), html);
});

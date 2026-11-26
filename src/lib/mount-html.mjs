import { finished } from "node:stream/promises";
import { SAXParser } from "parse5-sax-parser";
import { sitePath } from "./site-path.mjs";

export async function mountHtml(html, base) {
  if (!base || base === "/") return html;
  const parser = new SAXParser({sourceCodeLocationInfo: true});
  const parts = [];
  let copied = 0;
  // Astro generates its own asset URLs under base. Mount the authored navigation
  // here so links in rendered Markdown and in Astro components follow one rule.
  parser.on("startTag", ({tagName, attrs, sourceCodeLocation}) => {
    const name = tagName === "a" ? "href" : tagName === "form" ? "action" : null;
    const attr = attrs.find(a => a.name === name);
    if (!attr || sitePath(attr.value, base) === attr.value) return;
    const {startOffset, endOffset} = sourceCodeLocation.attrs[name];
    const raw = html.slice(startOffset, endOffset);
    const offset = startOffset + raw.indexOf("/");
    parts.push(html.slice(copied, offset), base.replace(/\/+$/, ""));
    copied = offset;
  });
  parser.resume();
  const done = finished(parser);
  parser.end(html);
  await done;
  parts.push(html.slice(copied));
  return parts.join("");
}

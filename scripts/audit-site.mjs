/**
 * Build-output smoke checks: internal navigation, same-page fragments, and
 * canonical URLs. Not a substitute for WCAG screen-reader/manual testing.
 *
 * Usage: npm run build && npm run test:site
 * With PUBLIC_SITE_URL set, checks Astro's generated canonical URLs.
 */
import { sitePath } from "../src/lib/site-path.mjs";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { resolve, join, dirname, relative, sep } from "node:path";

const dist=resolve("dist");
if(!existsSync(dist))throw Error("dist/ missing; run npm run build first");
function visit(directory) {
  return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const file=join(directory,entry.name);
    return entry.isDirectory()?visit(file):entry.isFile()&&file.endsWith(".html")?[file]:[];
  });
}
const files=visit(dist);
const failures=[];
const syntheticOrigin="https://site.example.test";
const configuredSite=process.env.PUBLIC_SITE_URL?new URL(process.env.PUBLIC_SITE_URL):null;
if(configuredSite&&(configuredSite.protocol!=="https:"||configuredSite.pathname!=="/"))
  failures.push("PUBLIC_SITE_URL must be an HTTPS site origin at the root for current root-relative routes");
const base = (process.env.PUBLIC_BASE_PATH || "/").replace(/\/+$/, "");
const origin=configuredSite?.origin??syntheticOrigin;
const idsCache=new Map();
const matchAttr=(source,attribute)=>[...source.matchAll(new RegExp(`\\b${attribute}\\s*=\\s*(["'])(.*?)\\1`,"gi"))].map(m=>m[2]);
const unescapeHtml=text=>text.replaceAll("&amp;","&").replaceAll("&quot;",'"').replaceAll("&#39;","'");
const isWithinDist=target=>target===dist||target.startsWith(dist+sep);
const displayedUrl=file=>{
  let rel=relative(dist,file).split(sep).join("/");
  return sitePath(rel==="index.html"?"/":"/"+rel.replace(/index\.html$/,""), base);
};
function destination(url){
  const path=decodeURIComponent(url.pathname);
  if (base && !path.startsWith(base + "/")) return null;
  const file=resolve(dist,"." + path.slice(base.length));
  if(!isWithinDist(file))return null;
  if(existsSync(file)&&statSync(file).isFile())return file;
  const indexed=join(file,"index.html");
  return existsSync(indexed)?indexed:null;
}
let count=0,checkedLinks=0,checkedFragments=0,checkedCanonicals=0;
for(const file of files){
  count++;
  const html=readFileSync(file,"utf8");
  const here=displayedUrl(file);
  const ids=new Set(matchAttr(html,"id").map(unescapeHtml));
  idsCache.set(file,ids);
  // Anchor hrefs are user-facing navigation; do not treat CSS/scripts as pages.
  for(const raw of [...html.matchAll(/<a\b[^>]*?\bhref\s*=\s*(["'])(.*?)\1/gi)].map(m=>m[2])){
    const href=unescapeHtml(raw);
    if(!href||/^(?:mailto|tel|javascript):/i.test(href))continue;
    let url;
    try{url=new URL(href,new URL(here,origin));}
    catch{failures.push(`${here}: malformed link ${href}`);continue;}
    if(url.origin!==origin)continue;
    checkedLinks++;
    const target=destination(url);
    if(!target){failures.push(`${here}: missing internal target ${url.pathname}`);continue;}
    if(url.hash){
      checkedFragments++;
      let fragment;
      try{fragment=decodeURIComponent(url.hash.slice(1));}
      catch{failures.push(`${here}: malformed fragment ${url.hash}`);continue;}
      const targetHtml=readFileSync(target,"utf8");
      const targetIds=idsCache.get(target)??new Set(matchAttr(targetHtml,"id").map(unescapeHtml));
      idsCache.set(target,targetIds);
      if(!targetIds.has(fragment))failures.push(`${here}: missing fragment ${url.pathname}#${fragment}`);
    }
  }
  for (const tag of html.match(/<(?:link|script|form)\b[^>]*>/gi) ?? []) {
    const attr = tag.startsWith("<script") ? "src" : tag.startsWith("<form") ? "action" : "href";
    for (const raw of matchAttr(tag, attr)) {
      const url = new URL(unescapeHtml(raw), new URL(here, origin));
      if (url.origin === origin && !destination(url)) failures.push(here + ": missing asset or form destination " + url.pathname);
    }
  }
  if(configuredSite){
    const matches=[...html.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=(["'])(.*?)\1/gi)];
    if(matches.length!==1){failures.push(`${here}: expected one canonical tag, got ${matches.length}`);continue;}
    const actual=unescapeHtml(matches[0][2]);
    const expected=new URL(here,configuredSite).href;
    checkedCanonicals++;
    if(actual!==expected)failures.push(`${here}: canonical ${actual} != ${expected}`);
  }
}
// A missing reciprocal link can leave both endpoints valid but disconnect the evidence.
const indexData = name => JSON.parse(readFileSync(new URL("../research/index/" + name + ".json", import.meta.url), "utf8"));
function requirePageLink(from, to) {
  const page = join(dist, from, "index.html");
  if (!existsSync(page) || !matchAttr(readFileSync(page, "utf8"), "href").map(unescapeHtml).includes(sitePath(to, base))) {
    failures.push(from + ": missing required evidence link " + to);
  }
}
const parallelPage = join(dist, "gospel-parallels/passages/index.html");
const indexedPairs = existsSync(parallelPage)
  ? matchAttr(readFileSync(parallelPage, "utf8"), "href").map(href => new URL(unescapeHtml(href), origin))
      .filter(url => url.pathname === sitePath("/compare/", base) && url.searchParams.has("left") && url.searchParams.has("right"))
      .map(url => [url.searchParams.get("left"), url.searchParams.get("right")].sort().join("/"))
  : [];
const expectedPairs = indexData("gospel-audit-links").map(link => [...link.passages].sort().join("/"));
if (JSON.stringify(indexedPairs.sort()) !== JSON.stringify(expectedPairs.sort())) {
  failures.push("Gospel passage-pair directory must link each registered pair exactly once.");
}
for (const {passages: [left, right]} of indexData("gospel-audit-links")) {
  requirePageLink("passages/" + left, "/passages/" + right + "/");
  requirePageLink("passages/" + right, "/passages/" + left + "/");
}
for (const teaching of indexData("pauline-teachings")) {
  requirePageLink("passages/" + teaching.passageId, "/pauline-teachings/" + teaching.id + "/");
  requirePageLink("pauline-teachings/" + teaching.id, "/passages/" + teaching.passageId + "/");
}
if(!count)failures.push("No generated HTML files found");
const summary=`Audited ${count} HTML pages, ${checkedLinks} internal links, ${checkedFragments} fragments, ${checkedCanonicals} canonicals.`;
if(failures.length){console.error(summary+"\n"+failures.slice(0,80).join("\n"));if(failures.length>80)console.error(`... ${failures.length-80} more`);process.exitCode=1;}
else console.log(summary+" No broken targets found.");

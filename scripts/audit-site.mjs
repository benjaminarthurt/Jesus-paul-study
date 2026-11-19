/**
 * Build-output smoke checks: internal navigation, same-page fragments, and
 * canonical URLs. Not a substitute for WCAG screen-reader/manual testing.
 *
 * Usage: npm run build && npm run test:site
 * With PUBLIC_SITE_URL set, checks Astro's generated canonical URLs.
 */
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
const origin=configuredSite?.origin??syntheticOrigin;
const idsCache=new Map();
const matchAttr=(source,attribute)=>[...source.matchAll(new RegExp(`\\b${attribute}\\s*=\\s*(["'])(.*?)\\1`,"gi"))].map(m=>m[2]);
const unescapeHtml=text=>text.replaceAll("&amp;","&").replaceAll("&quot;",'"').replaceAll("&#39;","'");
const isWithinDist=target=>target===dist||target.startsWith(dist+sep);
const displayedUrl=file=>{
  let rel=relative(dist,file).split(sep).join("/");
  return rel==="index.html"?"/":"/"+rel.replace(/index\.html$/,"");
};
function destination(url){
  const path=decodeURIComponent(url.pathname);
  const file=resolve(dist,"."+path);
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
  if(configuredSite){
    const matches=[...html.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=(["'])(.*?)\1/gi)];
    if(matches.length!==1){failures.push(`${here}: expected one canonical tag, got ${matches.length}`);continue;}
    const actual=unescapeHtml(matches[0][2]);
    const expected=new URL(here,configuredSite).href;
    checkedCanonicals++;
    if(actual!==expected)failures.push(`${here}: canonical ${actual} != ${expected}`);
  }
}
if(!count)failures.push("No generated HTML files found");
const summary=`Audited ${count} HTML pages, ${checkedLinks} internal links, ${checkedFragments} fragments, ${checkedCanonicals} canonicals.`;
if(failures.length){console.error(summary+"\n"+failures.slice(0,80).join("\n"));if(failures.length>80)console.error(`... ${failures.length-80} more`);process.exitCode=1;}
else console.log(summary+" No broken targets found.");

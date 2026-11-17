import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const readJson = path => JSON.parse(readFileSync(path, "utf8"));
const books = readJson("research/index/books.json");
const passages = readJson("research/index/passages.json");
const errors = [];
const validStatuses = new Set(["draft", "source-checked", "reviewed"]);
const validGroups = new Set(["gospels","acts","paul-undisputed","paul-disputed","other-nt"]);
const validLayers = new Set(["jesus-synoptic","jesus-john","paul-undisputed","paul-disputed","acts","other-nt"]);
const validComparisons = new Set(["agreement","different-emphasis","extension","apparent-tension","direct-contradiction","insufficient-evidence"]);
const unique = (items, key, label) => {
  const seen = new Set();
  for (const item of items) {
    if (!item[key] || seen.has(item[key])) errors.push(`${label}: missing or duplicate ${key} ${item[key]}`);
    seen.add(item[key]);
  }
};
unique(books,"id","books");
unique(passages,"id","passages");
if (books.length !== 27) errors.push(`Expected 27 NT books, got ${books.length}`);
const bookIds = new Set(books.map(b => b.id));
const passageById = new Map(passages.map(p=>[p.id,p]));
for(const book of books) if (!validGroups.has(book.group)) errors.push(`Invalid book group: ${book.id}`);
for(const p of passages) {
  if (!bookIds.has(p.bookId)) errors.push(`Unknown book: ${p.id}`);
  if (!validLayers.has(p.sourceLayer)) errors.push(`Unknown source layer: ${p.id}`);
  if (!validStatuses.has(p.status)) errors.push(`Invalid status: ${p.id}`);
  if (!Array.isArray(p.topics)) errors.push(`Missing topics: ${p.id}`);
}
function collection(folder) {
  return readdirSync(folder).filter(x=>x.endsWith(".md")).map(name=>{
    const text = readFileSync(join(folder,name),"utf8");
    if (!text.startsWith("---\n")) { errors.push(`No YAML frontmatter: ${name}`); return {id:name.slice(0,-3),meta:""}; }
    const end = text.indexOf("\n---",4);
    if (end === -1) errors.push(`Unclosed YAML frontmatter: ${name}`);
    return {id:name.slice(0,-3),meta:text.slice(4,end===-1?undefined:end)};
  });
}
function scalar(meta,key) {return (meta.match(new RegExp(`^${key}:\\s*(.*)$`,"m"))||[])[1]?.trim();}
function array(meta,key) {
  const found = meta.match(new RegExp(`^${key}:\\s*\\[(.*)\\]$`,"m"));
  if (!found) { errors.push(`Missing array ${key}`); return []; }
  return found[1].split(",").map(x=>x.trim()).filter(Boolean);
}
const topics = collection("research/topics");
const topicIds = new Set(topics.map(x=>x.id));
for(const entry of topics) {
  if(!validStatuses.has(scalar(entry.meta,"status"))) errors.push(`Invalid status in topic ${entry.id}`);
  for (const id of array(entry.meta,"passages")) if(!passageById.has(id)) errors.push(`Unknown passage ${id} in topic ${entry.id}`);
}
for(const passage of passages) for(const topic of passage.topics || []) if (!topicIds.has(topic)) errors.push(`Unknown topic ${topic} in passage ${passage.id}`);
for(const entry of collection("research/comparisons")) {
  if(!validStatuses.has(scalar(entry.meta,"status"))) errors.push(`Invalid status in comparison ${entry.id}`);
  if(!validComparisons.has(scalar(entry.meta,"classification"))) errors.push(`Invalid classification in ${entry.id}`);
  for(const id of array(entry.meta,"jesus")) {
    const p = passageById.get(id);
    if(!p || !p.sourceLayer.startsWith("jesus-")) errors.push(`Invalid Jesus passage ${id} in comparison ${entry.id}`);
  }
  for(const id of array(entry.meta,"paul")) {
    const p = passageById.get(id);
    if(!p || !p.sourceLayer.startsWith("paul-")) errors.push(`Invalid Pauline passage ${id} in comparison ${entry.id}`);
  }
}
for(const entry of collection("research/modern-issues")) {
  if(!validStatuses.has(scalar(entry.meta,"status"))) errors.push(`Invalid status in issue ${entry.id}`);
  for(const id of array(entry.meta,"topicRefs")) if (!topicIds.has(id)) errors.push(`Unknown topic ${id} in issue ${entry.id}`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${books.length} books, ${passages.length} passages and research links.`);
}

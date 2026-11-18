import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter } from "./frontmatter.mjs";
import { isValidMarkSpan } from "./mark-verses.mjs";

const readJson = path => JSON.parse(readFileSync(path, "utf8"));
const books = readJson("research/index/books.json");
const passages = readJson("research/index/passages.json");
const sources = readJson("research/index/sources.json");
const evidenceRows = readJson("research/index/evidence.json");
const errors = [];
const statuses = new Set(["draft", "source-checked", "reviewed"]);
const groups = new Set(["gospels", "acts", "paul-undisputed", "paul-disputed", "other-nt"]);
const layers = new Set(["jesus-synoptic", "jesus-john", "paul-undisputed", "paul-disputed", "acts", "other-nt"]);
const classifications = new Set(["agreement", "different-emphasis", "extension", "apparent-tension", "direct-contradiction", "insufficient-evidence"]);

function checkUnique(items, key, label) {
  const seen = new Set();
  for (const item of items) {
    if (!item[key] || seen.has(item[key])) errors.push(label + ": missing or duplicate " + key + " " + item[key]);
    seen.add(item[key]);
  }
}
function requireStrings(value, label) {
  if (!Array.isArray(value) || value.some(x => typeof x !== "string" || !x.trim())) {
    errors.push(label + ": expected an array of nonempty strings");
    return [];
  }
  return value;
}
function collection(folder) {
  // Keep in sync with the flat glob patterns in src/content.config.ts.
  return readdirSync(folder, { withFileTypes: true })
    .filter(x => x.isFile() && x.name.endsWith(".md"))
    .map(({ name }) => {
      const filename = join(folder, name);
      try {
        return { id: name.slice(0, -3), meta: parseFrontmatter(readFileSync(filename, "utf8"), filename) };
      } catch (error) {
        errors.push(String(error.message));
        return { id: name.slice(0, -3), meta: {} };
      }
    });
}
function statusCheck(meta, label) {
  if (!statuses.has(meta.status)) errors.push(label + ": invalid status " + String(meta.status));
}

checkUnique(books, "id", "books");
checkUnique(passages, "id", "passages");
if (books.length !== 27) errors.push("Expected 27 NT books, got " + books.length);
const booksById = new Map(books.map(book => [book.id, book]));
const passagesById = new Map(passages.map(passage => [passage.id, passage]));
for (const book of books) {
  if (!groups.has(book.group)) errors.push("Invalid book group: " + book.id);
}
for (const passage of passages) {
  const book = booksById.get(passage.bookId);
  if (!book) errors.push("Unknown book: " + passage.id);
  if (!layers.has(passage.sourceLayer)) errors.push("Unknown source layer: " + passage.id);
  if (!statuses.has(passage.status)) errors.push("Invalid status: " + passage.id);
  requireStrings(passage.topics, "Passage topics " + passage.id);
  if (book && passage.sourceLayer !== "jesus-synoptic" && passage.sourceLayer !== "jesus-john"
      && book.group !== passage.sourceLayer) {
    errors.push("Source layer/group mismatch in " + passage.id);
  }
  if (book && passage.sourceLayer === "jesus-synoptic" && !["mt", "mk", "lk"].includes(book.id)) {
    errors.push("Synoptic Jesus passage outside a Synoptic Gospel: " + passage.id);
  }
  if (book && passage.sourceLayer === "jesus-john" && book.id !== "jn") {
    errors.push("Johannine Jesus passage outside John: " + passage.id);
  }
}
const topics = collection("research/topics");
checkUnique(topics, "id", "topic files");
const topicIds = new Set(topics.map(t => t.id));
for (const entry of topics) {
  statusCheck(entry.meta, "Topic " + entry.id);
  for (const id of requireStrings(entry.meta.passages, "Topic passages " + entry.id)) {
    if (!passagesById.has(id)) errors.push("Unknown passage " + id + " in topic " + entry.id);
  }
}
for (const passage of passages) {
  for (const topic of Array.isArray(passage.topics) ? passage.topics : []) {
    if (!topicIds.has(topic)) errors.push("Unknown topic " + topic + " in passage " + passage.id);
  }
}

const topicPassages = new Map(topics.map(entry=>[entry.id,new Set(Array.isArray(entry.meta.passages) ? entry.meta.passages : [])]));
for (const passage of passages) {
  for (const topic of Array.isArray(passage.topics) ? passage.topics : []) {
    if (topicIds.has(topic) && !topicPassages.get(topic).has(passage.id)) {
      errors.push("Passage " + passage.id + " links topic " + topic + " but is missing from that topic's index");
    }
  }
}

const comparisonEntries = collection("research/comparisons");
for (const entry of comparisonEntries) {
  statusCheck(entry.meta, "Comparison " + entry.id);
  if (!classifications.has(entry.meta.classification)) errors.push("Invalid comparison classification: " + entry.id);
  for (const id of requireStrings(entry.meta.jesus, "Comparison Jesus references " + entry.id)) {
    const passage = passagesById.get(id);
    if (!passage || !passage.sourceLayer.startsWith("jesus-")) errors.push("Invalid Jesus passage " + id + " in " + entry.id);
  }
  for (const id of requireStrings(entry.meta.paul, "Comparison Paul references " + entry.id)) {
    const passage = passagesById.get(id);
    if (!passage || !passage.sourceLayer.startsWith("paul-")) errors.push("Invalid Pauline passage " + id + " in " + entry.id);
  }
}
for (const entry of collection("research/modern-issues")) {
  statusCheck(entry.meta, "Modern issue " + entry.id);
  for (const id of requireStrings(entry.meta.topicRefs, "Issue topicRefs " + entry.id)) {
    if (!topicIds.has(id)) errors.push("Unknown topic " + id + " in modern issue " + entry.id);
  }
}


const sourceIds = new Set();
const accessScopes = new Set(["full-text", "publisher-abstract-only", "selected-excerpt"]);
for (const source of sources) {
  if (typeof source.id !== "string" || !source.id || sourceIds.has(source.id)) errors.push("Missing or duplicate source id " + String(source.id));
  sourceIds.add(source.id);
  if (!["primary-edition", "scholarly-overview", "peer-reviewed-article", "academic-book", "historical-overview"].includes(source.type)) errors.push("Unknown source type " + source.id);
  if (!accessScopes.has(source.accessScope)) errors.push("Unknown source accessScope " + source.id);
  if (!["author","title","publisher","location","note"].every(k => typeof source[k] === "string" && source[k].trim())) errors.push("Source required metadata missing: " + source.id);
  try {
    const url = new URL(source.url);
    if (url.protocol !== "https:") errors.push("Source URL must be HTTPS: " + source.id);
  } catch { errors.push("Source URL malformed: " + source.id); }
}
const comparisonMap = new Map(comparisonEntries.map(entry => [entry.id, entry]));
for (const entry of comparisonEntries) {
  for (const id of requireStrings(entry.meta.context ?? [], "Comparison context " + entry.id)) {
    if (!passagesById.has(id)) errors.push("Unknown context passage " + id + " in " + entry.id);
  }
  for (const id of requireStrings(entry.meta.sourceIds ?? [], "Comparison sources " + entry.id)) {
    if (!sourceIds.has(id)) errors.push("Unknown bibliographic source " + id + " in " + entry.id);
  }
}
checkUnique(evidenceRows, "id", "evidence");
for (const row of evidenceRows) {
  const comparison = comparisonMap.get(row.comparisonId);
  if (!comparison) { errors.push("Evidence " + row.id + ": unknown comparison"); continue; }
  if (!statuses.has(row.status)) errors.push("Evidence " + row.id + ": invalid status");
  if (!["textual-observation", "counterexample", "text-critical", "source-comparison", "historical-interpretation"].includes(row.kind)) {
    errors.push("Evidence " + row.id + ": unknown kind");
  }
  if (!["tension","agreement","interpretation-dependent"].includes(row.assessment)) errors.push("Evidence " + row.id + ": unknown assessment");
  for (const field of ["title","observation","alternateReading","limitation"]) {
    if (typeof row[field] !== "string" || row[field].trim().length < 20) errors.push("Evidence " + row.id + ": missing substantial " + field);
  }
  const declaredPassageIds = new Set([...comparison.meta.jesus,...comparison.meta.paul,...(comparison.meta.context??[])]);
  const declaredSourceIds = new Set(comparison.meta.sourceIds??[]);
  for (const id of requireStrings(row.passageIds,"Evidence passages " + row.id)) {
    if (!passagesById.has(id)) errors.push("Evidence " + row.id + ": unknown passage " + id);
    if (!declaredPassageIds.has(id)) errors.push("Evidence " + row.id + ": undeclared comparison passage " + id);
  }
  for (const id of requireStrings(row.sourceIds,"Evidence sources " + row.id)) {
    if (!sourceIds.has(id)) errors.push("Evidence " + row.id + ": unknown source " + id);
    if (!declaredSourceIds.has(id)) errors.push("Evidence " + row.id + ": undeclared comparison source " + id);
  }
}

const validMarkKinds = new Set(["speech", "dialogue", "parable", "action", "context", "disputed", "composite"]);
const markUnits = passages.filter(p => p.bookId === "mk");
const chapterSet = new Set();
for (const p of markUnits) {
  if (!p.unitType || !validMarkKinds.has(p.unitType)) errors.push("Unknown Mark unitType: " + p.id);
  const m = /^mk-(\d{2})-(\d{2})-(\d{2})$/.exec(p.id);
  if (!m) { errors.push("Invalid Mark passage ID " + p.id); continue; }
  const ch = Number(m[1]), start = Number(m[2]), end = Number(m[3]);
  if (!isValidMarkSpan(ch, start, end)) errors.push("Invalid Mark reference bounds: " + p.id);
  if (p.reference !== `Mark ${ch}:${start}–${end}`) errors.push("Mark reference/ID mismatch: " + p.id);
  chapterSet.add(ch);
  if (p.sourceUrl !== `https://ebible.org/engwebp/MRK${m[1]}.htm`) errors.push("Unexpected primary text link: " + p.id);
}
if (chapterSet.size !== 16) errors.push("Mark inventory does not yet cover all 16 chapters");
const longerEnding = passagesById.get("mk-16-09-20");
if (!longerEnding || longerEnding.textualStatus !== "disputed-longer-ending" || longerEnding.unitType !== "disputed") {
  errors.push("Disputed Mark 16:9–20 must carry an explicit textual warning");
}


const sayings = readJson("research/index/sayings.json");
const sayingTypes = new Set(["proclamation", "call", "instruction", "response", "illustration", "question", "parable", "explanation", "argument", "teaching", "critique", "observation", "warning", "symbolic-action", "prayer"]);
const audiences = new Set(["public", "crowd", "disciples", "individual", "individuals", "questioners", "opponents", "onlookers", "God"]);
checkUnique(sayings, "id", "sayings");
for (const saying of sayings) {
  const label = "Saying " + String(saying.id);
  const match = /^mk-s-(\d{2})-(\d{2})-(\d{2})$/.exec(saying.id || "");
  if (!match) { errors.push(label + ": invalid ID"); continue; }
  const [chapter, first, last] = match.slice(1).map(Number);
  const expectedRef = "Mark " + chapter + ":" + first + (first === last ? "" : "–" + last);
  if (saying.chapter !== chapter || saying.startVerse !== first || saying.endVerse !== last || !isValidMarkSpan(chapter, first, last)) {
    errors.push(label + ": invalid chapter or verse bounds");
  }
  if (saying.bookId !== "mk" || saying.reference !== expectedRef) errors.push(label + ": reference / ID mismatch");
  const parent = passagesById.get(saying.passageId);
  if (!parent || parent.bookId !== "mk") {
    errors.push(label + ": unknown or non-Markan parent");
  } else {
    const bounds = /^mk-(\d{2})-(\d{2})-(\d{2})$/.exec(parent.id);
    if (!bounds || Number(bounds[1]) !== chapter || first < Number(bounds[2]) || last > Number(bounds[3])) {
      errors.push(label + ": verses outside parent literary unit");
    }
    if (parent.unitType === "disputed" || chapter === 16) errors.push(label + ": Mark 16 longer ending must be held outside core sayings");
  }
  if (!statuses.has(saying.status)) errors.push(label + ": invalid status");
  if (!sayingTypes.has(saying.speechType)) errors.push(label + ": invalid speechType");
  if (!audiences.has(saying.audience)) errors.push(label + ": invalid audience");
  if (typeof saying.title !== "string" || !saying.title.trim() || typeof saying.summary !== "string" || !saying.summary.trim()) {
    errors.push(label + ": missing title/summary");
  }
  for (const topic of requireStrings(saying.topics, label + " topics")) {
    if (!topicIds.has(topic)) errors.push(label + ": unknown topic " + topic);
    if (parent && !parent.topics.includes(topic)) errors.push(label + ": topic not linked from parent " + topic);
  }
  if (saying.sourceEdition !== "World English Bible (Protestant edition)" || saying.sourceUrl !== "https://ebible.org/engwebp/MRK" + match[1] + ".htm") {
    errors.push(label + ": unknown primary edition or chapter URL");
  }
  if (!Array.isArray(saying.parallels)) {
    errors.push(label + ": missing parallel candidates");
    continue;
  }
  const related = new Set();
  for (const p of saying.parallels) {
    const book = booksById.get(p.bookId);
    if (!book || !["mt","lk","jn"].includes(book.id)) errors.push(label + ": parallel book must be Matthew, Luke or John");
    if (!["parallel", "related"].includes(p.relationship) || p.status !== "candidate") errors.push(label + ": unvalidated parallel relation");
    if (typeof p.reference !== "string" || !/^(Matthew|Luke|John) \d+:\d+(?:[–-]\d+)?$/.test(p.reference)) errors.push(label + ": invalid parallel reference");
    if (book && !p.reference.startsWith(book.title + " ")) errors.push(label + ": parallel book label mismatch");
    if (related.has(p.reference)) errors.push(label + ": duplicate parallel " + p.reference);
    related.add(p.reference);
  }
}
if (sayings.length < 35) errors.push("Mark speech-bearing pilot unexpectedly incomplete");
const contestedMark = sayings.find(s => s.id === "mk-s-07-18-23");
if (!contestedMark || !contestedMark.caution) errors.push("Mark 7:19 narrative/translation caution is missing from saying detail");
const widowsSaying = sayings.find(s => s.id === "mk-s-12-43-44");
if (!widowsSaying || !widowsSaying.caution) errors.push("Mark 12 widow passage requires interpretation caution");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Validated " + books.length + " books, " + passages.length + " passages and research links.");
}

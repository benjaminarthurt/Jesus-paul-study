import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter } from "./frontmatter.mjs";

const readJson = path => JSON.parse(readFileSync(path, "utf8"));
const books = readJson("research/index/books.json");
const passages = readJson("research/index/passages.json");
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
for (const entry of collection("research/comparisons")) {
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

const validMarkKinds = new Set(["speech", "dialogue", "parable", "action", "context", "disputed", "composite"]);
const markUnits = passages.filter(p => p.bookId === "mk");
const chapterSet = new Set();
for (const p of markUnits) {
  if (!p.unitType || !validMarkKinds.has(p.unitType)) errors.push("Unknown Mark unitType: " + p.id);
  const m = /^mk-(\d{2})-(\d{2})-(\d{2})$/.exec(p.id);
  if (!m) { errors.push("Invalid Mark passage ID " + p.id); continue; }
  const ch = Number(m[1]), start = Number(m[2]), end = Number(m[3]);
  if (ch < 1 || ch > 16 || start < 1 || end < start) errors.push("Invalid Mark reference bounds: " + p.id);
  if (p.reference !== `Mark ${ch}:${start}–${end}`) errors.push("Mark reference/ID mismatch: " + p.id);
  chapterSet.add(ch);
  if (p.sourceUrl !== `https://ebible.org/engwebp/MRK${m[1]}.htm`) errors.push("Unexpected primary text link: " + p.id);
}
if (chapterSet.size !== 16) errors.push("Mark inventory does not yet cover all 16 chapters");
const longerEnding = passagesById.get("mk-16-09-20");
if (!longerEnding || longerEnding.textualStatus !== "disputed-longer-ending" || longerEnding.unitType !== "disputed") {
  errors.push("Disputed Mark 16:9–20 must carry an explicit textual warning");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Validated " + books.length + " books, " + passages.length + " passages and research links.");
}

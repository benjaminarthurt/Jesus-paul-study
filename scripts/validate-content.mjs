import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter } from "./frontmatter.mjs";
import { isValidMarkSpan } from "./mark-verses.mjs";
import { MATTHEW_CHAPTER_LAST_VERSE, isValidMatthewSpan } from "./matthew-verses.mjs";
import { LUKE_CHAPTER_LAST_VERSE, isValidLukeSpan } from "./luke-verses.mjs";
import { JOHN_CHAPTER_LAST_VERSE, isValidJohnSpan } from "./john-verses.mjs";

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
  if (!["primary-edition", "scholarly-overview", "peer-reviewed-article", "academic-book", "historical-overview", "pastoral-commentary", "denominational-report"].includes(source.type)) errors.push("Unknown source type " + source.id);
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

const validMarkKinds = new Set(["speech", "dialogue", "parable", "action", "context", "disputed", "composite", "prayer", "illustration"]);
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



const matthewUnits = passages.filter(p => p.bookId === "mt");
const matthewCoverage = MATTHEW_CHAPTER_LAST_VERSE.map(last => Array(last).fill(0));
for (const p of matthewUnits) {
  const m = /^mt-(\d{2})-(\d{2})-(\d{2})$/.exec(p.id);
  if (!m) { errors.push("Malformed Matthew unit ID " + p.id); continue; }
  const [chapter,first,last] = m.slice(1).map(Number);
  if (!isValidMatthewSpan(chapter,first,last)) { errors.push("Invalid Matthew span " + p.id); continue; }
  if (p.reference !== `Matthew ${chapter}:${first}–${last}`) errors.push("Matthew reference/id mismatch " + p.id);
  if (!validMarkKinds.has(p.unitType)) errors.push("Matthew unit lacks an accepted literary kind: " + p.id);
  if (typeof p.title !== "string" || !p.title.trim()) errors.push("Matthew unit missing a title: " + p.id);
  if (p.sourceUrl !== `https://ebible.org/engwebp/MAT${m[1]}.htm`) errors.push("Matthew unit has incorrect source chapter: " + p.id);
  for (let verse=first;verse<=last;verse++) matthewCoverage[chapter-1][verse-1]++;
}
for (let ch=1;ch<=matthewCoverage.length;ch++) {
  for (let verse=1;verse<=matthewCoverage[ch-1].length;verse++) {
    if (matthewCoverage[ch-1][verse-1] !== 1) errors.push(`Matthew ${ch}:${verse} is indexed ${matthewCoverage[ch-1][verse-1]} times; expected one`);
  }
}
if (matthewUnits.length < 100) errors.push("Preliminary Matthew literary inventory is unexpectedly incomplete");
const matthewVerse21 = passagesById.get("mt-17-14-21");
if (!matthewVerse21?.textualNote) errors.push("Matthew 17:21 requires its textual warning");



const lukeUnits = passages.filter(p => p.bookId === "lk");
const lukeCoverage = LUKE_CHAPTER_LAST_VERSE.map(last => Array(last).fill(0));
for (const p of lukeUnits) {
  const match = /^lk-(\d{2})-(\d{2})-(\d{2})$/.exec(p.id);
  if (!match) { errors.push("Malformed Luke unit ID " + p.id); continue; }
  const [chapter,first,last] = match.slice(1).map(Number);
  if (!isValidLukeSpan(chapter,first,last)) { errors.push("Invalid Luke span " + p.id); continue; }
  if (p.reference !== `Luke ${chapter}:${first}–${last}`) errors.push("Luke reference/id mismatch " + p.id);
  if (!validMarkKinds.has(p.unitType)) errors.push("Luke literary unit lacks a recognized kind " + p.id);
  if (typeof p.title !== "string" || !p.title.trim()) errors.push("Luke unit missing title " + p.id);
  if (p.sourceUrl !== `https://ebible.org/engwebp/LUK${match[1]}.htm`) errors.push("Luke source chapter mismatch " + p.id);
  for(let verse=first;verse<=last;verse++) lukeCoverage[chapter-1][verse-1]++;
}
for(let chapter=1;chapter<=lukeCoverage.length;chapter++) {
  for(let verse=1;verse<=lukeCoverage[chapter-1].length;verse++) {
    const coverage=lukeCoverage[chapter-1][verse-1];
    if(coverage!==1) errors.push(`Luke ${chapter}:${verse} indexed ${coverage} times; expected exactly one`);
  }
}
if(lukeUnits.length<140) errors.push("Luke literary inventory unexpectedly incomplete");
for(const [id,variant] of [
  ["lk-10-01-12","seventy-or-seventy-two"],
  ["lk-10-17-20","seventy-or-seventy-two"],
  ["lk-22-39-46","disputed-angel-and-sweat"],
  ["lk-23-32-43","disputed-prayer-23-34"],
  ["lk-24-50-53","variant-ascension-wording"]
]) {
  const p=passagesById.get(id);
  if(p?.textualStatus!==variant || !p?.textualNote) errors.push("Luke textual caution missing for "+id);
}


const johnUnits = passages.filter(p => p.bookId === "jn");
const johnCoverage = JOHN_CHAPTER_LAST_VERSE.map(last => Array(last).fill(0));
for (const p of johnUnits) {
  const match = /^jn-(\d{2})-(\d{2})-(\d{2})$/.exec(p.id);
  if(!match){errors.push("Malformed John literary unit ID "+p.id);continue;}
  const [chapter,first,last]=match.slice(1).map(Number);
  if(!isValidJohnSpan(chapter,first,last)){errors.push("Invalid John bounds "+p.id);continue;}
  if(p.reference!==`John ${chapter}:${first}–${last}`)errors.push("John ID/reference mismatch "+p.id);
  if(!validMarkKinds.has(p.unitType))errors.push("John literary kind not recognized "+p.id);
  if(typeof p.title!=="string" || !p.title.trim())errors.push("John unit missing title "+p.id);
  if(p.sourceLayer!=="jesus-john")errors.push("John unit attribution layer mismatch "+p.id);
  if(p.sourceUrl!==`https://ebible.org/engwebp/JHN${match[1]}.htm`)errors.push("John source chapter URL mismatch "+p.id);
  for(let verse=first;verse<=last;verse++)johnCoverage[chapter-1][verse-1]++;
}
for(let chapter=1;chapter<=johnCoverage.length;chapter++){
  for(let verse=1;verse<=johnCoverage[chapter-1].length;verse++){
    if(johnCoverage[chapter-1][verse-1]!==1)errors.push(`John ${chapter}:${verse} assigned ${johnCoverage[chapter-1][verse-1]} units; expected one`);
  }
}
if(johnUnits.length<85)errors.push("John literary inventory unexpectedly incomplete");
for(const [id,status] of [
  ["jn-01-01-18","variant-prologue-1-18"],
  ["jn-05-01-15","disputed-5-3b-4"],
  ["jn-07-53-53","disputed-pericope-adulterae"],
  ["jn-08-01-11","disputed-pericope-adulterae"],
  ["jn-09-35-41","variant-son-of-man-or-god"]
]){
  const p=passagesById.get(id);
  if(!p || p.textualStatus!==status || !p.textualNote)errors.push("John manuscript caution missing "+id);
}
for(const id of ["jn-03-16-21","jn-03-31-36"]){
  const p=passagesById.get(id);
  if(p?.unitType!=="context" || !p.textualNote || p.textualStatus)errors.push("John speaker uncertainty mislabeled "+id);
}

const sayings = readJson("research/index/sayings.json");
const sayingTypes = new Set(["proclamation", "call", "instruction", "response", "illustration", "question", "parable", "explanation", "argument", "teaching", "critique", "observation", "warning", "symbolic-action", "prayer", "dialogue"]);
const audiences = new Set(["public", "crowd", "disciples", "individual", "individuals", "questioners", "opponents", "onlookers", "God"]);
const gospelNames = { mk: "Mark", mt: "Matthew", lk: "Luke", jn: "John" };
const sourceChapters = { mk: "MRK", mt: "MAT", lk: "LUK", jn: "JHN" };
const verseChecks = { mk: isValidMarkSpan, mt: isValidMatthewSpan, lk: isValidLukeSpan, jn: isValidJohnSpan };
checkUnique(sayings, "id", "sayings");
for (const saying of sayings) {
  const label = "Saying " + String(saying.id);
  const match = /^(mk|mt|lk|jn)-s-(\d{2})-(\d{2})-(\d{2})$/.exec(saying.id || "");
  if (!match) { errors.push(label + ": invalid ID"); continue; }
  const bookId = match[1];
  const [chapter, first, last] = match.slice(2).map(Number);
  const expectedRef = gospelNames[bookId] + " " + chapter + ":" + first + (first === last ? "" : "–" + last);
  if (saying.bookId !== bookId || saying.reference !== expectedRef) errors.push(label + ": reference / ID mismatch");
  if (saying.chapter !== chapter || saying.startVerse !== first || saying.endVerse !== last ||
      !verseChecks[bookId](chapter, first, last)) errors.push(label + ": invalid chapter or verse bounds");
  const parent = passagesById.get(saying.passageId);
  if (!parent || parent.bookId !== bookId) {
    errors.push(label + ": unknown or wrong-Gospel parent");
  } else {
    const bounds = /^(mk|mt|lk|jn)-(\d{2})-(\d{2})-(\d{2})$/.exec(parent.id);
    if (!bounds || Number(bounds[2]) !== chapter || first < Number(bounds[3]) || last > Number(bounds[4])) {
      errors.push(label + ": verses outside parent literary unit");
    }
    if (parent.unitType === "disputed" || (bookId==="mk" && chapter===16)) {
      errors.push(label + ": disputed Mark 16 ending must be outside the core sayings pilot");
    }
  }
  if (!statuses.has(saying.status)) errors.push(label + ": invalid status");
  if (!sayingTypes.has(saying.speechType)) errors.push(label + ": invalid speechType");
  if (!audiences.has(saying.audience)) errors.push(label + ": invalid audience");
  if (typeof saying.title !== "string" || !saying.title.trim() || typeof saying.summary !== "string" || !saying.summary.trim()) {
    errors.push(label + ": missing title/summary");
  }
  for (const topic of requireStrings(saying.topics,label + " topics")) {
    if (!topicIds.has(topic)) errors.push(label + ": unknown topic " + topic);
    if (parent && !parent.topics.includes(topic)) errors.push(label + ": topic not linked from parent " + topic);
  }
  if (saying.sourceEdition !== "World English Bible (Protestant edition)" ||
      saying.sourceUrl !== `https://ebible.org/engwebp/${sourceChapters[bookId]}${match[2]}.htm`) {
    errors.push(label + ": unexpected primary edition or chapter URL");
  }
  if (!Array.isArray(saying.parallels)) { errors.push(label + ": missing parallel candidates"); continue; }
  const seen = new Set();
  for (const p of saying.parallels) {
    const book = booksById.get(p.bookId);
    if (!book || !Object.keys(gospelNames).includes(p.bookId) || p.bookId === bookId) errors.push(label + ": invalid cross-Gospel parallel book");
    if (!["parallel","related"].includes(p.relationship) || p.status !== "candidate") errors.push(label + ": unverified parallel label");
    if (typeof p.reference !== "string" || !/^(Matthew|Mark|Luke|John) \d+:\d+(?:[–-]\d+)?$/.test(p.reference)) {
      errors.push(label + ": invalid parallel reference");
    }
    if (book && !p.reference.startsWith(book.title + " ")) errors.push(label + ": parallel book label mismatch");
    if (seen.has(p.reference)) errors.push(label + ": repeated parallel " + p.reference);
    seen.add(p.reference);
  }
}
if (sayings.filter(s => s.bookId==="mk").length < 35) errors.push("Mark sayings pilot unexpectedly incomplete");
if (sayings.filter(s => s.bookId==="mt").length < 65) errors.push("Matthew sayings pilot unexpectedly incomplete");
if (sayings.filter(s => s.bookId==="lk").length < 100) errors.push("Luke sayings pilot unexpectedly incomplete");
if (sayings.filter(s => s.bookId==="jn").length < 85) errors.push("John sayings pilot unexpectedly incomplete");
for(const saying of sayings.filter(s=>s.bookId==="jn")){
  const p=passagesById.get(saying.passageId);
  if(p?.unitType==="disputed" || ["jn-03-16-21","jn-03-31-36"].includes(saying.passageId))errors.push("Disputed or uncertain John passage cannot be core Jesus saying "+saying.id);
}
const contestedMark = sayings.find(s => s.id==="mk-s-07-18-23");
if (!contestedMark?.caution) errors.push("Mark 7:19 caution missing");
const widowsSaying = sayings.find(s => s.id==="mk-s-12-43-44");
if (!widowsSaying?.caution) errors.push("Mark 12 widow interpretation caution missing");
for(const id of ["lk-s-10-02-12","lk-s-22-40-46","lk-s-23-34-34"]) {
  if (!sayings.find(s=>s.id===id)?.caution) errors.push("Luke saying textual caution missing: "+id);
}
const lordsPrayer = sayings.find(s => s.id==="mt-s-06-09-13");
if (!lordsPrayer?.caution) errors.push("Matthew 6 prayer-text caution missing");


// A Gospel dossier gathers selected *literary* witnesses; a parallel does not
// establish eyewitness independence, identical wording, or historical sequence.
const gospelDossiers=readJson("research/index/gospel-parallels.json");
const selectedSayingById=new Map(sayings.map(s=>[s.id,s]));
const allowedDossierTypes=new Set(["parallel-tradition","related-traditions","distinct-presentations"]);
const allowedWitnessRelations=new Set(["parallel","related","distinct-scene"]);
const gospelBookIds=new Set(["mt","mk","lk","jn"]);
checkUnique(gospelDossiers,"id","Gospel dossiers");
for(const dossier of gospelDossiers){
  const label="Gospel dossier "+String(dossier.id);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(dossier.id??""))errors.push(label+": invalid URL ID");
  if(dossier.status!=="draft")errors.push(label+": unexpected review status");
  if(!allowedDossierTypes.has(dossier.comparisonType))errors.push(label+": invalid comparison kind");
  if(!topicIds.has(dossier.topicId))errors.push(label+": unknown research topic");
  for(const key of ["title","researchQuestion","commonGround","literaryContext","alternativeReading","limitation"]){
    if(typeof dossier[key]!=="string"||dossier[key].trim().length<25)errors.push(label+": missing substantial "+key);
  }
  if(!Array.isArray(dossier.observedDifferences)||dossier.observedDifferences.length<2||
    dossier.observedDifferences.some(x=>typeof x!=="string"||x.trim().length<25)){
    errors.push(label+": expected at least two substantial observed differences");
  }
  const ids=requireStrings(dossier.sourceIds,label+" sources");
  if(ids.length===0||new Set(ids).size!==ids.length)errors.push(label+": missing or duplicated bibliography IDs");
  for(const id of ids)if(!sourceIds.has(id))errors.push(label+": unregistered bibliography source "+id);
  if(!Array.isArray(dossier.witnesses)||dossier.witnesses.length<2||dossier.witnesses.length>4){
    errors.push(label+": expected 2–4 Gospel witnesses");continue;
  }
  const seenBooks=new Set();
  for(const w of dossier.witnesses){
    if(!gospelBookIds.has(w.bookId)||seenBooks.has(w.bookId))errors.push(label+": duplicate or non-Gospel witness "+w.bookId);
    seenBooks.add(w.bookId);
    if(!allowedWitnessRelations.has(w.relation))errors.push(label+": invalid relationship for "+w.bookId);
    if(typeof w.note!=="string"||w.note.trim().length<25)errors.push(label+": insufficient witness observation "+w.bookId);
    const parent=passagesById.get(w.passageId);
    if(!parent||parent.bookId!==w.bookId||!parent.sourceLayer.startsWith("jesus-")){
      errors.push(label+": missing or incorrect Gospel parent "+w.passageId);
    }else if(parent.unitType==="disputed"&&w.relation==="parallel"){
      errors.push(label+": disputed manuscript text cannot be ordinary secure parallel "+w.passageId);
    }
    if(w.sayingId){
      const saying=selectedSayingById.get(w.sayingId);
      if(!saying||saying.bookId!==w.bookId||saying.passageId!==w.passageId)
        errors.push(label+": selected speech span has wrong parent "+w.sayingId);
    }
  }
}
if(gospelDossiers.length<15)errors.push("Expected at least 15 preliminary Gospel comparison dossiers");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Validated " + books.length + " books, " + passages.length + " passages and research links.");
}

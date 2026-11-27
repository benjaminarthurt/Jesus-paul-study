import { readFileSync, existsSync } from "node:fs";

import { gospelUnitAnchor } from "../src/lib/gospel-unit.mjs";

const load = name => JSON.parse(readFileSync(new URL("../research/index/" + name + ".json", import.meta.url)));
const attributions = new Set(["letter-discourse", "lord-attributed-instruction", "received-jesus-tradition", "reported-lord-response", "scriptural-divine-speech", "scripture-citation", "claimed-lord-authority", "contested-voice", "reported-spirit-speech", "quoted-human-speech", "received-saying"]);
const teachingTypes = new Set(["greeting", "instruction", "exhortation", "rhetorical-question", "doctrinal-argument", "prayer", "narrative-example", "confession", "quotation"]);
const dispositions = new Set(["direct-speech", "reported-speech", "disputed-speech", "ambiguous-speaker", "other-speakers", "narrative", "reported-action", "composite"]);
const forms = new Set(["instruction", "question", "promise", "claim", "teaching", "warning", "reported-prediction", "reported-teaching", "symbolic-action", "blessing", "greeting", "response", "parable", "prayer"]);
const relationships = new Set(["direct-synoptic-parallel", "partial-parallel", "related-in-different-context", "repeated-saying", "thematic-resemblance"]);

export function validateExtraction() {
  const parents = new Map(load("passages").map(p => [p.id, p]));
  const lengths = load("pauline-verse-counts");
  const teachings = load("pauline-teachings");
  const decisions = load("pauline-extraction-dispositions");
  const audited = new Set();
  const errors = [];
  for (const t of teachings) {
    const p = parents.get(t.passageId);
    if (!p || !lengths[p.bookId]) {
      errors.push("Invalid Pauline parent: " + t.id);
      continue;
    }
    const [first, start, third, fourth] = p.id.split("-").slice(1).map(Number);
    const last = fourth === undefined ? first : third;
    const end = fourth ?? third;
    const chapterLength = lengths[p.bookId][t.chapter - 1];
    if (!Number.isInteger(t.chapter) || !chapterLength || t.chapter < first || t.chapter > last ||
        !Number.isInteger(t.startVerse) || !Number.isInteger(t.endVerse) ||
        t.startVerse < (t.chapter === first ? start : 1) || t.endVerse > (t.chapter === last ? end : chapterLength) ||
        t.endVerse > chapterLength || t.endVerse < t.startVerse) errors.push("Invalid teaching span: " + t.id);
    const chapterUrl = p.sourceUrl.replace(/\d\d\.htm$/, String(t.chapter).padStart(2, "0") + ".htm");
    if (t.sourceUrl !== chapterUrl || p.bookId !== t.bookId || p.sourceLayer !== t.sourceLayer ||
        !attributions.has(t.attribution) || !teachingTypes.has(t.teachingType)) errors.push("Invalid attribution or source: " + t.id);
    if (!t.topics.length || t.topics.some(id => !/^[a-z-]+$/.test(id) ||
        !existsSync(new URL("../research/topics/" + id + ".md", import.meta.url)))) errors.push("Invalid teaching topic: " + t.id);
  }
  for (const d of decisions.filter(d => d.primaryTextCheck)) {
    const p = parents.get(d.passageId);
    const check = d.primaryTextCheck;
    if (!p || check.edition !== "WEBP" || !check.scope || !check.date || check.chapterUrls[0] !== p.sourceUrl ||
        !d.note || (d.disposition === "context-only") !== (d.teachingIds.length === 0)) errors.push("Invalid primary-text disposition: " + d.passageId);
    for (const id of d.teachingIds) {
      const t = teachings.find(t => t.id === id);
      if (!t?.teachingType || !check.chapterUrls.includes(t.sourceUrl)) errors.push("Incomplete teaching collation: " + id);
    }
  }
  for (const row of load("teaching-extraction-queue").filter(r => r.gospelAudit)) {
    const p = parents.get(row.passageId);
    const a = row.gospelAudit;
    if (!p || !["mt", "mk", "lk", "jn"].includes(p.bookId) || p.sourceUrl !== a.sourceUrl ||
        !dispositions.has(a.disposition) || a.edition !== "WEBP" || !a.note || !a.date) {
      errors.push("Invalid Gospel audit: " + row.passageId);
      continue;
    }
    audited.add(p.id);
    const [, , start, end] = p.id.split("-").map(Number);
    const anchors = a.units.map(gospelUnitAnchor);
    if (new Set(anchors).size !== anchors.length) errors.push("Duplicate Gospel unit anchor: " + p.id);
    for (const u of a.units) {
      if (!Number.isInteger(u.startVerse) || !Number.isInteger(u.endVerse) || u.startVerse < start || u.endVerse > end ||
          u.startVerse > u.endVerse || !forms.has(u.form) || !u.audience || !u.summary) errors.push("Invalid Gospel unit: " + p.id);
    }
  }
  const pairs = new Set();
  for (const link of load("gospel-audit-links")) {
    const [a, b] = link.passages;
    const pair = [...link.passages].sort().join("/");
    if (link.passages.length !== 2 || a === b || !audited.has(a) || !audited.has(b) || pairs.has(pair) ||
        !relationships.has(link.relationship) || link.status !== "candidate" || !link.note) errors.push("Invalid Gospel comparison: " + pair);
    pairs.add(pair);
  }
  return errors;
}

/**
 * Non-blocking editorial triage report. A literary unit tagged "speech",
 * "dialogue" or "prayer" may contain someone OTHER than Jesus speaking.
 * Lack of a selected saying is a review candidate, not proof of an omission.
 */
import { readFileSync } from "node:fs";
const read=path=>JSON.parse(readFileSync(path,"utf8"));
const passages=read("research/index/passages.json");
const sayings=read("research/index/sayings.json");
const bookNames={mk:"Mark",mt:"Matthew",lk:"Luke",jn:"John"};
const kinds=new Set(["speech","dialogue","prayer"]);
const byParent=new Map();
for(const s of sayings)byParent.set(s.passageId,(byParent.get(s.passageId)??0)+1);
console.log("# Gospel selected-speech review queue");
console.log("");
console.log("Editorial triage only: speech/dialogue/prayer units can include interlocutors, biblical songs, or narrative framing. A missing selected saying does NOT establish missing Jesus speech.");
console.log("");
console.log("| Gospel | Literary units | Selected spans | Speech/dialogue/prayer units awaiting inspection |");
console.log("| --- | ---: | ---: | ---: |");
for(const [id,name] of Object.entries(bookNames)){
  const units=passages.filter(p=>p.bookId===id);
  const selected=sayings.filter(s=>s.bookId===id);
  const candidates=units.filter(p=>kinds.has(p.unitType)&&!byParent.has(p.id));
  console.log(`| ${name} | ${units.length} | ${selected.length} | ${candidates.length} |`);
}
console.log("");
for(const [id,name] of Object.entries(bookNames)){
  const candidates=passages.filter(p=>p.bookId===id&&kinds.has(p.unitType)&&!byParent.has(p.id));
  console.log(`## ${name} — ${candidates.length} review candidates`);
  console.log("");
  if(!candidates.length)console.log("No unselected speech/dialogue/prayer units remain under this simple filter.");
  else for(const p of candidates)console.log(`- \`${p.id}\` — ${p.title??p.reference} (check actual speaker and context)`);
  console.log("");
}
console.log("Special cautions: Luke 1's Mary/Zechariah songs are not Jesus sayings; Matthew 3's Baptist teaching is not Jesus speech; Mark 16:1–8 has no direct Jesus utterance. Compare against the actual WEBP text and critical apparatus before marking source-checked.");

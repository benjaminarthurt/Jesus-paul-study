/**
 * Display labels for preliminary literary units. Manuscript uncertainty is
 * not always an ending: John 7:53–8:11 is a disputed passage, while Mark
 * 16:9–20 is specifically a disputed ending.
 */
const labels=Object.freeze({
  speech: "Recorded speech",
  dialogue: "Encounter / dialogue",
  parable: "Parable",
  action: "Narrated action",
  context: "Context / narrative",
  prayer: "Prayer in context",
  illustration: "Teaching illustration",
  disputed: "Disputed passage",
  composite: "Composite reference"
});

export function literaryUnitLabel(kind, passageId) {
  if (kind === "disputed" && passageId === "mk-16-09-20") return "Disputed ending";
  return labels[kind] || kind;
}

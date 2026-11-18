// Pure, browser-independent helpers used by search, comparison, and regression tests.
// Summaries are editorial paraphrases; no Bible text is embedded in the application.
export const defaultPair = Object.freeze({
  left: "mt-05-17-20",
  right: "ga-03-23-25"
});

export const corpusLabels = Object.freeze({
  "jesus-synoptic": "Synoptic Gospel narrative",
  "jesus-john": "Gospel of John narrative",
  "paul-undisputed": "Generally undisputed Pauline letter",
  "paul-disputed": "Disputed Pauline authorship",
  acts: "Acts: later narrative witness",
  "other-nt": "Other New Testament voice"
});

export function normalizeQuery(value) {
  return String(value ?? "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export function passageSearchText(passage, bookTitle = "", topicTitles = []) {
  return normalizeQuery([
    passage.reference, passage.title ?? "", passage.summary, bookTitle,
    ...(topicTitles ?? []), ...(passage.topics ?? []),
    passage.sourceLayer, passage.textualNote ?? ""
  ].join(" "));
}

export function matchesPassage(record, filters = {}) {
  const query = normalizeQuery(filters.query);
  const search = normalizeQuery(record.search ?? "");
  return (!query || query.split(" ").every(token => search.includes(token))) &&
    (!filters.book || record.book === filters.book) &&
    (!filters.topic || String(record.topics ?? "").split(" ").includes(filters.topic)) &&
    (!filters.corpus || record.corpus === filters.corpus) &&
    (!filters.status || record.status === filters.status) &&
    (!filters.variantOnly || record.variant === "true");
}

export function choosePair(ids, params = {}, defaults = defaultPair) {
  const existing = new Set(ids);
  const chosen = { left: defaults.left, right: defaults.right };
  for (const side of ["left","right"]) {
    const id = params[side];
    if (typeof id === "string" && existing.has(id)) chosen[side] = id;
  }
  return chosen;
}

export function compareHref(left, right) {
  const query = new URLSearchParams({left,right});
  return `/compare/?${query.toString()}`;
}

export function primaryUrlIsTrusted(url) {
  if (typeof url !== "string") return false;
  try {
    const target = new URL(url);
    return target.protocol === "https:" &&
      target.hostname === "ebible.org" &&
      /^\/engwebp\/[A-Z0-9]+\.htm$/.test(target.pathname) &&
      !target.search && !target.hash;
  } catch {
    return false;
  }
}

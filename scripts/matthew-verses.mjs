/**
 * Reference-boundary counts for the 28 chapters of Matthew, in the
 * World English Bible Protestant 66-book chapter division.
 * These validate reference ranges, not manuscript originality.
 */
export const MATTHEW_CHAPTER_LAST_VERSE=Object.freeze([
  25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36,
  39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20
]);
export function isValidMatthewSpan(chapter,first,last) {
  return Number.isInteger(chapter) && chapter >= 1 &&
    chapter <= MATTHEW_CHAPTER_LAST_VERSE.length &&
    Number.isInteger(first) && Number.isInteger(last) &&
    first >= 1 && last >= first && last <= MATTHEW_CHAPTER_LAST_VERSE[chapter-1];
}

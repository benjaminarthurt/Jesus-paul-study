/**
 * Canonical chapter verse counts for Mark in the 66-book World English Bible.
 * Chapter 16 includes verses 9–20 for reference-boundary validation ONLY;
 * they remain explicitly textually disputed for interpretation.
 */
export const MARK_CHAPTER_LAST_VERSE = Object.freeze([
  45, 28, 35, 41, 43, 56, 37, 38,
  50, 52, 33, 44, 37, 72, 47, 20
]);
export function isValidMarkSpan(chapter, first, last) {
  return Number.isInteger(chapter) && chapter >= 1 && chapter <= MARK_CHAPTER_LAST_VERSE.length
    && Number.isInteger(first) && Number.isInteger(last)
    && first >= 1 && last >= first && last <= MARK_CHAPTER_LAST_VERSE[chapter - 1];
}

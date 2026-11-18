/**
 * Canonical Luke chapter verse bounds for the site's WEBP reference edition.
 * Reference coverage does NOT imply independent manuscript verification.
 */
export const LUKE_CHAPTER_LAST_VERSE=Object.freeze([
  80,52,38,44,39,49,50,56,62,42,54,59,
  35,35,32,31,37,43,48,47,38,71,56,53
]);
export function isValidLukeSpan(chapter,first,last) {
  return Number.isInteger(chapter)&&chapter>=1&&chapter<=LUKE_CHAPTER_LAST_VERSE.length&&
    Number.isInteger(first)&&Number.isInteger(last)&&first>=1&&last>=first&&
    last<=LUKE_CHAPTER_LAST_VERSE[chapter-1];
}

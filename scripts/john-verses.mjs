/**
 * John reference-chapter verse counts for the WEBP edition used on this site.
 * These validate navigational coverage, not the originality of disputed text.
 */
export const JOHN_CHAPTER_LAST_VERSE=Object.freeze([
  51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25
]);
export function isValidJohnSpan(chapter,first,last){
  return Number.isInteger(chapter) && chapter>=1 && chapter<=JOHN_CHAPTER_LAST_VERSE.length &&
    Number.isInteger(first) && Number.isInteger(last) && first>=1 &&
    last>=first && last<=JOHN_CHAPTER_LAST_VERSE[chapter-1];
}

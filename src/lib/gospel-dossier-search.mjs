/**
 * Text used for the four-Gospel dossier finder. Include taxonomy keys and
 * human-readable topic labels so searches for e.g. "poverty" or "obligation"
 * find studies regardless of whether prose uses those exact words.
 */
export function dossierSearchText(dossier, topicTitle = "") {
  return [
    dossier.title,
    dossier.topicId,
    topicTitle,
    dossier.researchQuestion,
    dossier.commonGround,
    ...(Array.isArray(dossier.observedDifferences) ? dossier.observedDifferences : [])
  ].filter(Boolean).join(" ").toLowerCase();
}

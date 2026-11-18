# Four-Gospel comparison dossiers: method

This is an **editorial comparison layer**, not a harmonized life of Jesus or an independently verified critical Greek synopsis.

Each record in `research/index/gospel-parallels.json` defines a research question, a preliminary common thread, at least two observed differences, literary context, an alternate interpretation and a limitation. Every witness points to a stable Gospel literary unit and, where available, one existing selected speech-bearing span. The page links to the full primary chapter in the public-domain World English Bible Protestant edition.

## Why editorial types matter

- **Proposed parallel tradition** means a candidate shared saying or narrative. It does *not* prove independent eyewitness accounts, a common historical event, or a specific literary relationship.
- **Related traditions** share a topic but differ in setting, action or rhetoric.
- **Distinct narrative presentations** are intentionally juxtaposed to investigate differences without fusing them into one invented chronology.

Individual Gospel witnesses are labeled `parallel`, `related` or `distinct-scene`. Luke 7's anointing is marked as a distinct-scene candidate rather than quietly equated with the Passion-week Bethany anointings; John 13's footwashing is related to leadership and the meal, not a word-for-word equivalent of the Synoptic words of institution.

A blank Gospel column means **no witness selected for this dossier**. It is not a claim that the evangelist never discusses the theme.

## Scope of source review

Scholarly overview sources provide context, not proofs of every individual witness relationship. John S. Kloppenborg's Oxford chapter is referenced only at the level of its **publisher abstract**; the full chapter was not accessed. Felix Just's comparative overview and the USCCB introduction to John were accessible in full and explicitly label theological/historical interpretations as provisional. Bibliographic `accessScope` is mandatory for every cited source.

The original Gospel summaries are paraphrases, not transcribed verses. A source-checked dossier would need word-level comparison against critical editions, manuscript cautions, alternate scholarly positions, and detailed evidence references.

## Validation rules

The repository validator and `tests/gospel-parallels.test.mjs` enforce unique IDs; registered sources; valid topic index; two to four witnesses per dossier; one witness per Gospel; matching book/source layer; optional selected sayings tied to their exact parent; and substantial distinction/context/caution fields. They cannot independently validate a scholarly interpretation.

## Next planned steps

1. Compare every paired pericope against a Greek synopsis and at least two academic sources.
2. Add phrase-level agreements, omissions, changes, and manuscript witnesses without copying unlicensed translations.
3. Distinguish narrator words from Jesus' recorded speech inside broad dialogue spans, especially Luke 10 and John 3.
4. Add reciprocal links from individual teaching pages to relevant curated dossiers.
5. Add a separate, evidence-ledger comparison layer for teachings attributed to Jesus and the seven undisputed Pauline letters.
6. Keep all dossiers as **draft** until source review and independent editorial signoff.

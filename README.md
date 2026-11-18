# Jesus and Paul: A Textual and Historical Study

A research-first reference project examining the teachings attributed to Jesus in the four canonical Gospels, the writings of Paul, other New Testament voices, and their relationship to contemporary Christianity.

## Research principles

- **Jesus-centered research question, not a predetermined conclusion.** Compare both agreements and possible tensions fairly.
- Distinguish Gospel portrayals of Jesus, Paul's **seven generally undisputed letters**, the **six letters with disputed authorship**, Acts, and other early Christian texts.
- Separate **what a text says**, **historical interpretation**, **theological interpretation**, and **modern application**.
- Assess original context, textual variants, alternative readings, and source quality before assigning a conclusion.
- Record research state openly: `draft`, `source-checked`, or `reviewed`.

## Run the website

Requires Node.js 22.23.4+ (or a supported newer LTS).

```sh
npm install
npm run dev
npm run check
npm run build
```

Website pages are built from Markdown research files. Edit a topic in `research/topics/` and its public topic page changes on the next build.

## Current Gospel research

**All four canonical Gospels now have preliminary literary catalogs**: Matthew (28 chapters), Mark (16), Luke (24), and John (21). Use `/books/mt/`, `/books/mk/`, `/books/lk/`, `/books/jn/` for chapter maps, or `/teachings/` to filter selected speech-bearing spans by Gospel. John adds **88 literary units** (including two preexisting anchors), **93 selected speech-bearing spans**, and a small conservative set of **15 candidate** Synoptic links.

The project deliberately distinguishes Jesus' reported sayings from narrative and dialogue spoken by others. John 3's speaker boundary, John 5:3b–4, the disputed John 7:53–8:11 story, and John 21's epilogue remain clearly qualified. **All four inventories remain draft; their parallels are not verified independent historical witnesses or verbal equivalents.** See `research/books/john.md`.

## Evidence-linked pilot

The Law and Faith comparison now has a six-claim evidence ledger, bibliography with transparent source-access labels, contextual passages (including Acts 15), and competing interpretations. Browse `/comparisons/law-and-faith/`; the global bibliography is at `/sources/`. This is **draft research**, not an independently reviewed theological finding.

## Wealth and poverty pilot

The new `/comparisons/wealth-and-generosity/` study compares Gospel wealth warnings with Paul's organized giving, includes counterreadings on the identity of "the least" in Matthew 25 and the widow in Mark 12, and protects the distinction between undisputed Paul, Acts and disputed Pauline letters. It is **draft research** supported by a claim-level evidence ledger and bibliography with access-scope labels.

## Women and authority pilot

`/comparisons/women-and-assembly/` compares Gospel accounts of women, Paul's coworkers and women's worship activity, with disputed 1 Corinthians 14:34–35 and the Pastorals explicitly identified. The evidence-ledger claims have source and counterreading links. This is **draft**, not a settled church leadership determination.

## Search and parallel reference reader

Use `/search/` to filter the indexed passages by book, topic, corpus attribution, review status, and textual cautions. Each reference has a stable `/passages/<id>/` citation page with the primary WEBP chapter link, sources, and related evidence. Use `/compare/` to read two **editorial passage summaries** side by side and share the selection using URL parameters. It is **not** a verbatim, complete Bible text reader. See [implementation and deployment notes](docs/search-and-reader.md).

## Explore

- [Project charter](docs/project-charter.md)
- [Research methodology](docs/methodology.md)
- [Data model](docs/data-model.md)
- [Search and reference reader](docs/search-and-reader.md)
- [Editorial and citation standards](docs/editorial-standards.md)
- [Research roadmap](docs/roadmap.md)
- [Text and licensing policy](docs/text-and-licensing.md)
- [Book inventory](research/index/books.json)
- [Passage index](research/index/passages.json)

**Status:** initial scaffold and *illustrative, unreviewed* pilot studies. No claim should be treated as a final finding until evidence has been assessed and cited.

No copyright license has yet been granted for the project's original research or code. Biblical translations have separate licensing terms.

## Curated four-Gospel comparisons

Browse `/gospel-parallels/` for **16 draft comparison dossiers** with **51 linked Gospel witness entries**, preserving each Gospel's original literary context and differences. Each study includes competing readings, cautions, existing passage and saying links, and bibliographic access-scope notes. Seven dossiers span all four Gospels. These are editorial research leads, **not verified independent historical witness claims**. See `docs/gospel-parallels-method.md`.

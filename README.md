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

Mark has a preliminary chapter-by-chapter index of sayings, dialogue, parables, narrated actions and context. Browse `/books/mk/`, or use the selected recorded-speech explorer at `/teachings/`. The new data includes candidate Gospel parallels which are **not yet verified for wording or historical relationship**. The index is **draft** and not exhaustive at the utterance or verse level.

## Evidence-linked pilot

The Law and Faith comparison now has a six-claim evidence ledger, bibliography with transparent source-access labels, contextual passages (including Acts 15), and competing interpretations. Browse `/comparisons/law-and-faith/`; the global bibliography is at `/sources/`. This is **draft research**, not an independently reviewed theological finding.

## Wealth and poverty pilot

The new `/comparisons/wealth-and-generosity/` study compares Gospel wealth warnings with Paul's organized giving, includes counterreadings on the identity of "the least" in Matthew 25 and the widow in Mark 12, and protects the distinction between undisputed Paul, Acts and disputed Pauline letters. It is **draft research** supported by a claim-level evidence ledger and bibliography with access-scope labels.

## Explore

- [Project charter](docs/project-charter.md)
- [Research methodology](docs/methodology.md)
- [Data model](docs/data-model.md)
- [Editorial and citation standards](docs/editorial-standards.md)
- [Research roadmap](docs/roadmap.md)
- [Text and licensing policy](docs/text-and-licensing.md)
- [Book inventory](research/index/books.json)
- [Passage index](research/index/passages.json)

**Status:** initial scaffold and *illustrative, unreviewed* pilot studies. No claim should be treated as a final finding until evidence has been assessed and cited.

No copyright license has yet been granted for the project's original research or code. Biblical translations have separate licensing terms.

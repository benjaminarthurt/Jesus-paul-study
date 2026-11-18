# Data model

## Book registry

`research/index/books.json`: 27 canonical New Testament books, stable lowercase IDs, group, and attribution caveat. These are canonical-book labels, not historical-authorship certifications.

## Passage registry

`research/index/passages.json` contains objects:

- `id`: unique stable key such as `mt-05-17-20`
- `bookId`: key in the book registry
- `reference`: display reference
- `sourceLayer`: `jesus-synoptic`, `jesus-john`, `paul-undisputed`, `paul-disputed`, `acts`, or `other-nt`
- `summary`: original paraphrase, **not** a Bible quotation
- `topics`: slugs of relevant topic pages
- `status`: research review state
- Optional `title`: pericope title
- Optional `unitType`: `speech`, `dialogue`, `parable`, `action`, `context`, `disputed`, or legacy `composite`
- Optional `sourceUrl`: chapter link used to check the primary text
- Optional `textualStatus` / `textualNote`: text-critical cautions

`sourceLayer` identifies a literary corpus, **not the speaker** of every verse. For example a Markan narrative can have `sourceLayer: jesus-synoptic` and `unitType: context` even when Jesus does not speak. The older composite Mark 7:1–23 anchor remains for stable references but is hidden on the chapter browser to prevent duplicate display.

These are preliminary literary units, not precise verse-by-verse extraction of words attributed to Jesus.

## Markdown collections

`research/topics/*.md`: `title`, `summary`, `status`, `passages` (passage IDs).

`research/comparisons/*.md`: `title`, `summary`, `status`, `jesus` (IDs), `paul` (IDs), `classification` (provisional category).

`research/modern-issues/*.md`: `title`, `summary`, `status`, `topicRefs` (topic slugs).

Each Markdown file is a URL-addressable research record and may be used in multiple navigation views. Its filename is its stable slug; renaming requires redirect planning.

## Future extension

`research/sources/` will gain source records with edition, DOI/ISBN, URL, relevant page references, bibliography status, and citation keys. Claims will receive their own traceable evidence IDs. Do not present the current pilot content as source-checked.

## Speech-bearing passage spans

`research/index/sayings.json` is the early fine-grained layer for a **selected** set of passages with speech attributed to Jesus. Records include:

- `id`: stable scoped ID (for example, `mk-s-12-29-31`)
- `passageId`: required reference to a parent literary unit in `passages.json`
- `chapter`, `startVerse`, `endVerse`, `reference`
- `title`, `summary`: editorial paraphrase, not a quotation
- `speechType`: an editorial category (instruction, response, parable, prayer, etc.)
- `audience`: the immediate narrated audience, not an assertion about universal application
- `topics`: links to existing topic slugs; also must belong to parent topic set
- `parallels`: candidate `bookId`, `reference`, `relationship` (`parallel` or `related`), `status: candidate`
- `sourceEdition` / `sourceUrl`: version and primary text chapter; optional `caution`
- `status`: always `draft` until textual checks, manuscript review and source citation audit are complete

**Important:** An indexed range may include an interlocutor or narrator. It should be called a **speech-bearing span**, not a verified quotation of Jesus in its entirety. A later pass must identify clause-level speech boundaries and sources for ancient language, translation, and variants. A parallel candidate is only a navigation/research lead, not proof of identity or independence.

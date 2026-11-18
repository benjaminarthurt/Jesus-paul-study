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

## Source catalog and evidence ledger

`research/index/sources.json` records the exact published source (including author, title, publisher, year, URL, and cited location) and declares the **access scope**. A publisher-abstract-only reading cannot be used to assert claims about pages not seen.

`research/index/evidence.json` contains per-claim evidence objects keyed by `comparisonId`, with IDs, observation, alternate reading, limitation, classification, linked `passageIds`, and linked `sourceIds`.

Optional comparison Markdown frontmatter fields:

- `context`: additional passage IDs from any corpus (including Acts) used as contextual evidence, not misattributed to Jesus or Paul.
- `sourceIds`: source catalog records used for this comparison.

Validator checks that a claim's passage and source IDs exist **and are declared within its comparison**. Source access level and scholarly status must not be inferred from the presence of a URL. Evidence is displayed in the website with observation, counterreading and limitation in equally visible fields.

## Wealth and poverty pilot

The `wealth-and-generosity` comparison uses the same evidence source IDs and status model as the Mosaic Law study. It includes Luke, Mark, Matthew, undisputed Pauline collection letters, and separate context witnesses from Acts (`acts`) and 1 Timothy (`paul-disputed`). The UI labels those contextual groups explicitly.

Scholarly citation types also support `pastoral-commentary` for accessible ministerial commentary that must not be misrepresented as a peer-reviewed paper. Source access is tracked independently of publication category; a peer-reviewed article listed as `publisher-abstract-only` must not be treated as having been read in full.

## Women and authority pilot: authorship and variants

The `women-and-assembly` comparison keeps **1 Timothy/Titus in `context`**, with `paul-disputed` source layers. It uses the undisputed correspondence in `paul` and the Gospel texts in `jesus`, while keeping Acts separately contextual. The `sourceLayer` field is a corpus attribution, **not** authentication of individual disputed phrases within a letter. For 1 Corinthians 14:34–35, `textualStatus: transposed-in-some-manuscripts` and `textualNote` record a location variant, not a surviving omission witness.

The source catalog also distinguishes a **`denominational-report`** from peer-reviewed or historical overviews. A full-text denominational argument is useful as a documented interpretive position but is not an academic consensus.

## Multi-Gospel speech-bearing index (Matthew and Mark)

The `sayings.json` registry accepts `mt-s-CC-VV-VV` and `mk-s-CC-VV-VV` stable IDs, each matched to a parent literary range from the **same book**. New Matthew units follow `mt-CC-VV-VV` and have title, `unitType`, a WEBP chapter URL and editorial summary. The structural validator checks that the 28-chapter Matthew map covers each verse **once**. This is not linguistic extraction or manuscript certification.

The `parallels` array supports Matthew, Mark, Luke and John as **other-Gospel** candidates and rejects within-book self-parallels. `relationship: parallel` means a candidate shared episode or expression; `related` means only a related tradition or teaching. Neither status proves literary dependence, independent attestation, textual identity or a historical reconstruction. Mark's 16:9–20 longer ending remains excluded from core sayings. Read `research/books/matthew.md` for editorial boundaries and limitations.

## Luke literary and speech-bearing extension

Luke units use stable `lk-CC-VV-VV` IDs, and selected sayings use `lk-s-CC-VV-VV` with a required same-Gospel parent, indexed topics, audience and speech type. Luke chapter bounds are maintained in `scripts/luke-verses.mjs`; validators ensure **exactly one** first-pass literary-unit assignment per verse in the chosen reference numbering. All Luke observations are provisional `draft` paraphrases. Literature and manuscript variants are flagged rather than resolved by a single edition.

The teachings browser now supports Matthew, Mark and Luke, preserving cross-Gospel `parallel` vs. `related` **candidate** status and prohibiting same-book self-parallels. Bibliography records distinguish accessible scholarly overviews from journal peer review. See `research/books/luke.md` for editorial limitations.

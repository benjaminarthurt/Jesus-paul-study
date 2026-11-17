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

## Markdown collections

`research/topics/*.md`: `title`, `summary`, `status`, `passages` (passage IDs).

`research/comparisons/*.md`: `title`, `summary`, `status`, `jesus` (IDs), `paul` (IDs), `classification` (provisional category).

`research/modern-issues/*.md`: `title`, `summary`, `status`, `topicRefs` (topic slugs).

Each Markdown file is a URL-addressable research record and may be used in multiple navigation views. Its filename is its stable slug; renaming requires redirect planning.

## Future extension

`research/sources/` will gain source records with edition, DOI/ISBN, URL, relevant page references, bibliography status, and citation keys. Claims will receive their own traceable evidence IDs. Do not present the current pilot content as source-checked.

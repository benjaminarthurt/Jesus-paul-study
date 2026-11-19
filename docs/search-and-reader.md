# Search, individual passage pages, and two-reference reader

## Implementation (phase two pilot)

Routes introduced for issue #6:

- `/search/`: browses all current passage records with a query plus book, corpus, topic, review-status, and flagged-textual-variant filters. The URL query parameters (`q`, `book`, `corpus`, `topic`, `status`, and `variant=1`) are shareable. Filter changes do **not** require a server; the static HTML has all records available without JavaScript.
- `/passages/<id>/`: stable, permalinkable research detail page for each passage ID. Displays the book/reference, corpus attribution, status, original summary, primary chapter link, textual warning, topic links, study relationships, evidence claims and scholarly source metadata. Never treats every verse in a narrative unit as speech by Jesus.
- `/compare/?left=<id>&right=<id>`: client-side side-by-side **reference** reader, with separate controls, an optional swap action, a permalink, and a fallback for unknown IDs. It displays original summaries, authorship labels, primary chapter links, flagged textual issues and related evidence. It does not retrieve or republish entire Bible chapters.
- Book, topic, study and homepage routes link into these pages. The Mark 7 composite anchor remains in the underlying registry for compatibility, but its chapter-page duplicate is still intentionally hidden.

The independent `/teachings/` pilot continues to index a selected set of Mark speech-bearing spans. Do not conflate it with full-Bible lexical search or historical speech extraction.

## Source and licensing safeguards

The external primary references use the World English Bible **Protestant 66-book edition (WEBP, `engwebp`)**, whose [publisher notice](https://ebible.org/details.php?id=engwebp) declares the translation public domain and the **World English Bible** name trademarked. Public-domain status permits copying text, but the project **does not yet** embed verbatim verse text. Its passage summaries are independently authored paraphrases. Do not relabel modified translation text as unmodified WEB.

External links open the **verified chapter HTML pages**, not unverified verse anchors. The project displays an exact book/chapter/verse citation alongside the link; it does not claim the external URL scrolls to a precise verse. Any future verse-level reader must inspect source anchor stability, edition changes, textual variants, and attribution before adding such links.

Scholarly articles and critical Greek/Hebrew editions have separate rights. Do not import their text merely because the Bible translation is public domain. Every research claim remains `draft` until an independent audit verifies its historical, linguistic and bibliographic assertions.

## Canonical links and deployment

The static site does not have an authorized production hostname. No domain is assumed. When deploying, set `PUBLIC_SITE_URL` to the public site's actual HTTPS base URL before `npm run build`. This supplies Astro's `site` setting and emits absolute canonical URLs in the shared layout. Without this variable, canonical tags are intentionally omitted rather than pointing to a guessed host.

Links within the project use stable origin-relative paths ending with a slash. Query parameters for search and reader selection are treated as UI state, not separately canonical content. The canonical tag therefore points to the clean pathname.

A static host must support routes like `/passages/ro-16-01-16/` and serve `index.html` within the route directory. If hosted under a non-root path, route generation and base path assumptions must be revised and tested **before publication**.

## Accessibility, security and degradation

The page uses labeled HTML controls, visible focus states, live result counts, keyboard-accessible links, and a responsive stacked layout for narrow screens. Search has an HTML-only full-index fallback; comparison leaves a visible sample pair if JavaScript is unavailable and clearly explains why selectors cannot change it.

The reader builds dynamic content with DOM `textContent` and nodes, **not untrusted HTML strings**. Unknown query-parameter IDs are discarded before lookup. Linked primary text URLs are restricted to HTTPS links to the approved eBible `/engwebp/` chapter directory.

All data is bundled in the static build: there is no external search service, telemetry feed, embedded third-party script or remote content execution. Keep this posture while expanding search functionality.

## Acceptance and future work

- [x] All indexed passages exposed at stable canonical-path routes.
- [x] Multi-facet search, URL state, citation links, authorship and review-state labels.
- [x] Two-column reference reader, source links, caution cards, evidence deep links.
- [x] Automated tests for filtering, URL selection, chapter link safety and UI structure.
- [x] Automated root-path canonical generation checked against a synthetic HTTPS origin in CI (not a real deployment).
- [x] Built-site internal navigation and fragment URLs audited by `npm run test:site`.
- [ ] Verify deployment origin and absolute canonical tags on the actual hosting target.
- [ ] Independently review all cited texts and text-critical apparatus.
- [ ] If full verse text is ever embedded, establish edition provenance and avoid misrepresenting modifications as an original translation.
- [ ] Conduct keyboard/screen-reader QA and real-device contrast/performance checks.
- [ ] Build candidate Synoptic parallel relationships, verifying wording and scope rather than auto-equating passages.

This is a **first working reference reader**, not a complete scholarly text apparatus.

## Automated publication smoke checks (November 2026)

Run `npm run build && npm run test:site` to check all internal anchor destinations and fragments in the generated HTML. CI builds with `PUBLIC_SITE_URL=https://site.example.test` only to exercise canonical generation without inventing a production domain. This synthetic origin is **not** the production URL. When a real domain has been selected, rebuild with its true HTTPS origin and repeat tests against deployment.

This audit does not inspect remote links, render CSS, run client-side scripts, verify color contrast, or simulate assistive technology. Those require a real host and manual browser/screen-reader accessibility work. Never report a passed internal-link audit as an end-to-end WCAG audit.

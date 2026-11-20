# Verification batch 01 — claim-level evidence review

Status: **planned; not independently verified**. This queue is intentionally separate from automated site checks and does not change any research-status flags.

## Review protocol

For every claim: record (1) stable passage/evidence IDs, (2) exact wording of the claim, (3) primary-text edition and verse boundaries, (4) manuscript/translation uncertainty, (5) at least one substantive alternative interpretation, (6) secondary-source bibliographic details and whether full text was consulted, (7) reviewer and date, and (8) disposition: supported, qualified, disputed, or not yet checked.

Do not treat a generated page, passing link audit, or abstract-only bibliography entry as independent scholarly verification. Preserve uncertainty and never silently replace a contested reading with a definitive claim.

## Priority queue

| Issue | Primary texts / problem | Verification task | Required evidence before promotion |
| --- | --- | --- | --- |
| #2 | John 3:10–21 | Distinguish explicitly attributed speech from debated narrator/speech boundary | Edition notes, at least two translation conventions, recorded alternative |
| #2 | Luke 10:1–24 | Audit saying boundaries and cross-reference parallels | Verse-level speech mapping and documented omissions |
| #3 | Matthew 5:17–20 / Galatians 3:19–29 | Compare what “fulfill,” “law,” and covenant identity mean in context | Primary-language observations plus opposing scholarly readings |
| #3 | Mark 7:18–23 / Romans 14 | Distinguish narrative editorial gloss from Jesus' quoted speech and Paul's argument | Critical-text and translation notes |
| #4 | Mark 12:41–44 / Luke 21:1–4 | Test praise-of-generosity versus critique-of-exploitation interpretations | Context of preceding widow-house warning and full-source reading |
| #4 | 2 Corinthians 8–9 | Distinguish voluntary generosity from coercive obligation | Literary-context notes and ancient patronage context |
| #5 | 1 Corinthians 14:34–35 | Document Western transposition and interpolation debate without asserting universal omission | Critical apparatus, manuscript witnesses and competing explanations |
| #5 | Romans 16 / 1 Timothy 2 | Separate undisputed Pauline letter from disputed Pastoral authorship | Authorship evidence, lexical alternatives and opposing readings |
| #6 | Published site | Check canonical URLs against actual origin, keyboard traversal, screen reader, and narrow viewport | Test environment, date, device/browser, reproducible results |

## Review output template

- **Claim / evidence ID:**
- **Exact claim and location:**
- **Primary passage and edition:**
- **Textual / translation uncertainty:**
- **Strongest tension reading:**
- **Strongest reconciliation reading:**
- **Secondary sources consulted (full text / excerpt / abstract):**
- **Reviewer / date:**
- **Disposition and required edit:**

## Completion criteria

This batch is complete only when every row has a linked review record, unresolved uncertainties remain visibly flagged, and changes are backed by primary-text citations. Site QA requires a real deployment and human accessibility testing; it cannot be marked complete from CI alone.

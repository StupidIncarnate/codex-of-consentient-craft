# Z06: Pointers in the older scrolls

| | |
|---|---|
| Phase | Phase 6 — docs and finish |
| Source | `scrolls/gateway/followup-sustainability.md`, rows 432-435 (gateway-build README sections 3 and 7, `adapters-to-one-place.md` "Structure", brands doc) |
| Needs | every A, B, G, T item |
| Unblocks | Z07 |
| Packages touched | none (docs only, no package code) |
| Checks to run | none — these are `scrolls/*.md` files, not code; a scoped ward run on them will report a skip, which is not a regression |
| Split | one agent |
| Runs alone | no (runs with Z01-Z05) |

## Why

Three older documents (`scrolls/gateway-build/README.md`, `scrolls/adapters-to-one-place.md`,
`scrolls/brands-types-tests-rules.md`) each describe a gateway layout or a rule set that this epic's work
has since moved past. Rather than rewrite their history, the fix is a pointer at the top of each,
directing a reader to whichever document now holds the current standard — so the two lists (or the two
layouts) cannot silently drift apart. This epic adds one more layer: once the epic itself finishes, the
two SOURCE docs this epic reads (`followup-sustainability.md` and `brands-types-tests-rules.md`) also
need a pointer at their own top, saying their open work was executed here, in
`scrolls/brands-gateways-epic/EPIC.md`.

## Current state

Checked 2026-09-26, reading the actual files rather than trusting the GW doc's own "Says today" column,
since some of this work turned out to already be done:

- **`scrolls/gateway-build/README.md` section 2** (line 24, "The four gateway packages") already opens
  with a pointer (lines 27-30): "The gateway has since moved to the layout
  `scrolls/gateway/followup-sustainability.md` sets out under 'Gateway standards decided'... That file's
  'Restructure `packages/@gateway` to the standards' section records the before and after." This is the
  pattern the GW doc's row 432 asks section 3 to copy.
- **`scrolls/gateway-build/README.md` section 3** (line 50, "Decisions made during the build...") **already
  has this pointer too** (lines 52-54): "A few rows below record the exact layout mechanics the build
  shipped with, not the layout it is moving to. `scrolls/gateway/followup-sustainability.md`, 'Gateway
  standards decided,' has the target layout, and its 'Restructure `packages/@gateway` to the standards'
  section has the steps." **This means GW row 432 is already satisfied — no edit needed here.** This is a
  source claim that does not match the code: the GW doc's own "Changes to" column asks for something
  section 3 already has.
- **`scrolls/gateway-build/README.md` section 7** (line 215, "Not done, and why") **already has the exact
  pointer GW row 433 asks for**: "This section is replaced by `scrolls/gateway/followup-sustainability.md`,
  so the two lists cannot drift apart," followed by specific item cross-references. **GW row 433 is also
  already satisfied — no edit needed here.**
- **`scrolls/adapters-to-one-place.md` "Structure"** (line 95) has an update note (lines 97-108) dated
  2026-09-26, but it points at **`scrolls/gateway-build/README.md`** ("Full rationale and file paths:
  `scrolls/gateway-build/README.md`"), not at `scrolls/gateway/followup-sustainability.md` directly. GW
  row 434 asks for "one more line pointing here" — "here" being `followup-sustainability.md`, the
  document that row lives in. **This one is real, outstanding work**: the existing note is one hop removed
  from where GW row 434 wants it to point.
- **GW row 435** ("Brands doc, 'Today's rules and docs that change' (main checkout)") is a cross-reference
  instruction inside `followup-sustainability.md`'s own "Existing text that changes" table, not a pointer
  to add to another file. Its "Changes to" cell reads "apply alongside this table; that doc lists them
  line by line" — this tells whoever executes the GW doc's own docs table (Z02, Z03 in this epic) to use
  the brands doc's T1-T8 rows together with the GW doc's own rows, not to duplicate them. **No file edit
  is needed for this row**; it is guidance for Z02/Z03, already satisfied by this epic's structure (Z02
  and Z03 each cite both source docs).

## Work

1. **Do NOT edit `scrolls/gateway-build/README.md` sections 2, 3 or 7** — confirmed already correct.
   Re-verify quickly before finishing (a later session's edits could have changed this since the check
   above), but do not make a change unless the re-check finds the pointer actually missing.

2. **Add one line to `scrolls/adapters-to-one-place.md`'s "Structure" section** (inside or right after the
   existing 2026-09-26 update note at line 97-108), pointing directly at
   `scrolls/gateway/followup-sustainability.md` as the doc that carries the standards which replace this
   section's own layout description — not just at `scrolls/gateway-build/README.md`, which is itself one
   hop from the real standard. Example wording (adapt to fit the existing note's voice): "The standards
   that replace this section's own layout live in `scrolls/gateway/followup-sustainability.md`, under
   'Gateway standards as built' and 'Gateway standards not built yet.'"

3. **Add a pointer at the top of both epic source docs**, once the epic itself is finished (coordinate
   with Z07, which marks the epic FINISHED in EPIC.md — do this pointer addition as part of Z06, but only
   after confirming with the operator that the epic is genuinely closing, since a pointer added while
   items are still `todo` would be premature):
   - At the top of `scrolls/gateway/followup-sustainability.md`: a line saying the open work this
     document lists was executed in `scrolls/brands-gateways-epic/EPIC.md`, and that document (not this
     one) is the current run sheet.
   - At the top of `scrolls/brands-types-tests-rules.md`: the same, pointing at the same EPIC.md.

   Both docs stay as the historical record of *why* — EPIC.md's own header says "Neither is edited by
   this epic; they stay as the record of why" — so this pointer is a single line at the top, not a rewrite
   of either document's body.

## Lint rules this item adds or changes

None.

## Teaching text this item changes

- `scrolls/adapters-to-one-place.md` — one added line in "Structure".
- `scrolls/gateway/followup-sustainability.md` — one added line at the top.
- `scrolls/brands-types-tests-rules.md` — one added line at the top.

## Done when

- `scrolls/adapters-to-one-place.md`'s "Structure" section points directly at
  `scrolls/gateway/followup-sustainability.md`, not only at `scrolls/gateway-build/README.md`.
- Both `followup-sustainability.md` and `brands-types-tests-rules.md` carry a one-line pointer at the top
  to `scrolls/brands-gateways-epic/EPIC.md`.
- `scrolls/gateway-build/README.md` sections 2, 3 and 7 are re-confirmed to already carry their own
  correct pointers (no edit expected, but re-check before closing this item).

## Traps

- Do not rewrite `scrolls/gateway-build/README.md` sections 3 or 7 — they already say what the GW doc's
  own row asks for. Editing them again risks introducing a second, slightly different pointer sentence
  that contradicts the first.
- Do not add the EPIC.md pointer to the two source docs until the epic is actually finishing — check with
  Z07's own status before writing it, since a pointer claiming "this work was executed there" is false
  while items are still `todo`.
- EPIC.md itself already states "Neither is edited by this epic; they stay as the record of why" for the
  two source docs — the one-line pointer this item adds does not contradict that: it is a single
  navigational line, not an edit to the historical content itself. If in doubt, keep the added line as
  short as possible and put it in an unmistakably separate line (e.g. a blockquote or a one-line note)
  rather than blending it into the existing prose.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>

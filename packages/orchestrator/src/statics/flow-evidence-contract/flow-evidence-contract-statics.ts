/**
 * PURPOSE: The single source of truth for what counts as honest flow-perspective coverage — the
 * evidence contract a reviewer grades a finished test suite against, and the three marks a unit
 * ends a pass carrying.
 *
 * USAGE:
 * flowEvidenceContractStatics.judgingMarkdown;
 * // Returns the evidence contract, a catalogue of known false greens, and the three marks a unit
 * // may carry
 *
 * ONE PROMPT INTERPOLATES THIS BLOCK: `flowriderReviewerStatics` takes `judgingMarkdown`, because it
 * grades the test suite a flowrider pass produced. `codeweaverReviewerStatics` withholds it — that
 * reviewer opens product code, not a test suite, and takes only `standardsReviewConcernsStatics`.
 * A reviewer does not need the method that produced the artifact it grades, so this block carries
 * only the judging side; no served prompt reads an authoring half.
 *
 * THIS IS THE BUDGETED HALF. It lands in `flowriderReviewerStatics`, which also carries
 * `standardsReviewConcernsStatics` — the larger of the two reviewer prompts, and the one to measure
 * first after an edit to either shared block. Over `mcpToolResultStatics.maxVerbatimChars` (50,000)
 * the MCP layer writes the prompt to a file and hands the agent an error stub instead of its
 * instructions, which fails silently. So every sentence here must change what a reviewer DOES.
 *
 * NO CHECK-SURFACE MAP IS RESTATED HERE. `surface` is real on every entry `get-quest-work`'s
 * `assignedUnits` hands back — for a terminal, a labelled branch, an observable and an off-map
 * family alike — so a reviewer reads it there instead of cross-referencing a legend this block would
 * otherwise have to keep in sync with `qaCheckSurfaceStatics.byOutcomeType`. An inline copy here
 * would restate that value a second time, wider and staler than the field the reviewer already
 * holds — `get-quest-work` serves it before a reviewer judges anything.
 *
 * THERE IS NO PARENT, NO THREE-TRACK SIGN-OFF, AND NO `confirmed`/`unconfirmable` PAIR. A reviewer
 * reads its scope through `get-quest-work`, marks every assigned unit through `quest-work`
 * observations — `met` / `cant-meet` / `unmet` — and calls `signal-back` itself; the `commit` step
 * that follows does the committing. The three marks below are the whole vocabulary a unit can carry.
 */

export const flowEvidenceContractStatics = {
  judgingMarkdown: `## The Evidence Contract — what makes an observable COVERED

An observable is covered when all five items exist and a reader can confirm each by opening the
file. Four out of five is a claim.

1. the **observable id** and its **verbatim** text from the spec
2. the **test file and line**
3. the **assertion itself, quoted**
4. **what makes it fail**: the wrong value or state that turns it red
5. the **witnessed red**: the failing value the assertion was set to, and the value that run
   reported as RECEIVED — which is the value item 3 claims it reads

Most false claims fail at item 4. "Fails if the text is wrong" is not an answer. "Fails if the row
renders the older comment first, because the assertion pins the exact order \`[newer, older]\`" is one.

**Never take a unit's surface from memory.** Take it from the unit's own \`surface\` field on
\`get-quest-work\`'s \`assignedUnits\` — every entry carries one, for all four kinds — and that string
is authoritative: reject an assertion whose layer disagrees with it, on that disagreement alone.

## Known false greens — reject on sight

Each shape below passes while the observable stays unproven. Each shipped in this repo.

- **Existence-only coverage.** "Observable X maps to test Y", no assertion, no failure mode.
- **Layer blindness.** The assertion cannot observe what the observable claims — a painted-geometry
  claim in jsdom.
- **Stopping at the browser when the flow goes deeper.** Playwright never proves the row persisted
  with the right shape.
- **A negative claim proved at the wrong layer.** "Zero processes spawned" is provable only where
  the real thing would have happened.
- **Single-instance fixtures.** With one row, "the right one" and "the first one" are one value, so
  an off-by-index bug passes. Seed at least two.
- **Benign-input monoculture.** A suite of short, well-behaved values cannot fail. Each input class
  needs a hostile or extreme member: an unbroken token, a newline, empty, whitespace-only, a
  duplicate, a very long value, markup.
- **Vacuous negatives.** Assert a count of 0, or an absence, only where the same suite shows that
  selector reaching non-zero.
- **Unwitnessed red.** No captured failing output; item 5 missing.
- **A compile error reported as a red.** \`Cannot find module\`, \`Test suite failed to run\`, any
  \`error TS\`. The suite never ran, so no assertion was tested and item 5 has no received value.
- **Self-referential tests.** The real subject is the harness, a proxy or another test. Delete
  plumbing that pins nothing about the product.
- **A guard for an input the product cannot produce.** Legitimate only where the test says plainly
  it is defensive, and never covers a user-facing observable.

## Marks — every assigned unit ends the pass carrying one of three

You read your scope through \`get-quest-work\` and mark it through \`quest-work\` — nobody briefs this
session and no track keeps a sign-off of its own. Every unit in \`assignedUnits\` ends your pass
carrying exactly one of these three:

- **\`met\`** — you settled it. The evidence is **The Evidence Contract** above, all five items,
  quoted.
- **\`cant-meet\`** — you tried and could not settle it. \`evidence\` names what you TRIED and why
  each attempt could not reach the unit. **A \`toSettle\` is REQUIRED**; the contract refuses a
  \`cant-meet\` carrying none. It is the ACTION that would settle the unit, written as an instruction
  someone can carry out — never as a question, which hands the next session something to answer
  where it needed something to do.
- **\`unmet\`** — work remains. \`evidence\` names what is left and what you already learned, and
  marking a unit this way mints a successor scoped to exactly the units you marked \`unmet\`.

**A unit that simply needs a test nobody has written yet is NOT \`cant-meet\`.** Mark it \`unmet\` —
that mints the \`work\` successor.

**Never mark \`met\` what you did not settle.** Every unit in \`assignedUnits\` needs exactly one
mark, or \`signal-back\` refuses the call by name — but the gate checks only that a mark exists,
never its VALUE. Padding \`met\` over an existence-only citation gets past that gate and ships a unit
nobody proved; marking a unit \`unmet\` that a test genuinely bites sends it back out for nothing.

**A measured defect is a NEW observable, not a third verdict.** An observable is a positive
expectation, so "send it \`bleh\` and the server crashes instead of returning 400" is the INVERSE
expectation and belongs in the spec — mark the unit it came from \`unmet\`, naming the inverse
expectation in its evidence, since a reviewer writes no spec of its own and there is no parent to
hand one to. **There is no \`defect\`, \`deferred\`, \`gap\` or \`recorded\` SIGN-OFF verdict.**
\`met\`, \`cant-meet\` and \`unmet\` are the whole vocabulary.

**Provenance is a SEPARATE axis.** \`addedBy\` records who added the observable. Its values are
\`spec\`, \`chaoswhisperer\`, \`codeweaver\`, \`flowrider\`, \`siegemaster\` and \`operator\`. It never
answers whether the unit is settled.`,
} as const;

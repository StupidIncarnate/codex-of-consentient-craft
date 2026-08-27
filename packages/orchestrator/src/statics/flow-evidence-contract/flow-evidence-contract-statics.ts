/**
 * PURPOSE: The single source of truth for what counts as honest flow-perspective coverage. The two
 * exports split it by who needs it. A reviewer accepts or rejects a finished artifact against
 * `judgingMarkdown`. An author reads `authoringMarkdown` to decide where to assert.
 *
 * USAGE:
 * flowEvidenceContractStatics.judgingMarkdown;
 * // Returns the evidence contract, a catalogue of known false greens, and the two verdicts a
 * // sign-off may carry
 *
 * THREE PROMPTS INTERPOLATE THESE HALVES, and each gets the half its session needs:
 *
 * 1. `flowrider-worker-minion-statics` takes `authoringMarkdown`, because that worker writes the
 *    suite.
 * 2. `flowrider-reviewer-minion-statics` takes `judgingMarkdown`, because that reviewer grades the
 *    suite.
 * 3. `groundstomper-reviewer-minion-statics` takes `judgingMarkdown` alone. `groundstomper`'s WORKER
 *    takes neither half. THIS file's colocated test is what pins all of that — its
 *    `describe('the three prompts that interpolate these halves')` counts byte-exact interpolations
 *    of each half into each of the three templates and asserts `judgingPerPrompt: [1, 1, 0]` and
 *    `authoringPerPrompt: [0, 0, 1]`. None of the three prompts has a colocated test of its own.
 *
 * ONE RULE DECIDES THAT SPLIT: a reviewer does not need the method that produced the artifact it
 * grades. The whole planner/worker/reviewer shape rests on that rule. Under the discipline packs
 * this arrangement replaced, each pack carried both halves and the same 8,281 characters went into
 * two prompts at once.
 *
 * TWO RULES HERE EXIST BECAUSE AN EARLIER TAXONOMY DROPPED WHOLE CLASSES OF OBSERVABLE.
 * `cache-state` (browser storage) appeared in no modality's signal list at all. That taxonomy
 * keyed the operational modality on a flow's `flowType`. An operational flow routinely carries
 * `ui-state` observables. A browser is the only place to check those. Both rules now key on the
 * OBSERVABLE rather than the flow, because a session picks a modality one observable at a time.
 *
 * NEITHER BLOCK RESTATES A CHECK-SURFACE MAP OF ITS OWN, AND NEITHER PROMISES A PER-UNIT FIELD.
 * `checkSurface` is real on `qaChecklistItemContract`, but `qaChecklistToTextTransformer` never
 * RENDERS it per unit: a unit's own line carries `[<observableType>]` and nothing else, and the
 * surfaces arrive once each — a `## CHECK SURFACES` legend over exactly the observable types present
 * on that flow (from `qaCheckSurfaceStatics.byOutcomeType`), plus fixed `## TERMINAL SURFACE`,
 * `## BRANCH SURFACE` and `## OFF-MAP SURFACE` headings. So both blocks state the JOIN instead of
 * sending a session to read a field it will not find. An inline copy here would restate that legend
 * a second time, wider and staler than the one both roles already fetch. Both roles fetch that
 * checklist before they author or judge anything. Siegemaster
 * has always read the surface off that tool. Its prompts carry no table. These two blocks now match
 * that precedent.
 *
 * `judgingMarkdown` IS BUDGETED, `authoringMarkdown` IS NOT. The judging half goes to the two
 * reviewer prompts carrying the most shared text in the set — a round-protocol primer, the standards
 * concerns and FIVE operating rules under their heading, which with this half is roughly 32,000
 * characters before either prompt writes a word — and they clear
 * `mcpToolResultStatics.maxVerbatimChars` by only three to four thousand characters. Over
 * that ceiling the MCP layer writes the prompt to a file and hands the agent an error stub instead
 * of its instructions, which is a silent dispatch
 * failure. So every sentence in the judging half must change what a reviewer DOES, and one that only
 * explains why a rule is right lives down here instead, where it costs both readers nothing. What
 * the trim from 5,836 to 4,498 moved down — each an EXTRA instance of a shape the served text still
 * states once, or a sentence that reader already holds from another block:
 *
 * - AN EXISTENCE-ONLY AUDIT reads as thorough because it is exhaustive: matching every observable
 *   id against a `describe` block name covers the whole list while opening no assertion at all.
 * - LAYER BLINDNESS has two instances beyond the jsdom one the served text keeps — a
 *   storage-lifecycle claim proved by calling the read/write helper directly, and a spawn claim
 *   asserted against a mocked spawner. `authoringMarkdown` carries both in full for the author.
 * - STOPPING AT THE BROWSER costs more than the persisted row the served text names: a route that
 *   rejected a bad payload with the right status, and a downstream side effect that fired, are
 *   equally invisible from a page.
 * - A VACUOUS NEGATIVE matters because a typo'd selector otherwise passes forever.
 * - AN ASSERTION NOBODY CAN NAME A FAILING VALUE FOR is not a test yet. That is item 4 restated,
 *   and item 4 already carries it.
 * - A `confirmed` ON THE FLOWRIDER TRACK means naming the production line you broke and the
 *   assertion that went red. That is what "what makes that test fail" asks for.
 * - `Both tracks: never cite a test nobody has watched fail, never cite an adjective.` reached its
 *   reader three times over. Item 5 and the Unwitnessed-red shape carry the first half, and
 *   `standardsReviewConcernsStatics` — which every prompt taking this half also takes — spells the
 *   second one into the evidence field it hands the same session.
 */

export const flowEvidenceContractStatics = {
  judgingMarkdown: `## The Evidence Contract — what makes an observable COVERED

An observable is covered when all five items exist and a reader can confirm each by opening the
file. Four out of five is a claim.

1. the **observable id** and its **verbatim** text from the spec
2. the **test file and line**
3. the **assertion itself, quoted**
4. **what makes it fail**: the wrong value or state that turns it red
5. the **witnessed red**: the failure output you saw before the code made it pass, or the mutation
   you made and reverted

Most false claims fail at item 4. "Fails if the text is wrong" is not an answer. "Fails if the row
renders the older comment first, because the assertion pins the exact order \`[newer, older]\`" is one.

**Never take a unit's surface from memory.** \`get-qa-checklist\` prints a \`## CHECK SURFACES\`
legend — join the \`[type]\` tag on an observable's own line to its row there, and take a terminal,
branch or off-map unit's surface from its \`## TERMINAL/BRANCH/OFF-MAP SURFACE\` heading — and that
string is authoritative: reject an assertion whose layer disagrees with it, on that disagreement
alone.

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
- **Self-referential tests.** The real subject is the harness, a proxy or another test. Delete
  plumbing that pins nothing about the product.
- **A guard for an input the product cannot produce.** Legitimate only where the test says plainly
  it is defensive, and never covers a user-facing observable.

## Verdicts — every unit carries TWO independent sign-offs

A unit is settled PER TRACK, never once for everybody. \`flowriderSignoff\` means *proven by a test*;
\`siegemasterSignoff\`, *holds when a human drives the real system*. Each holds
\`{ verdict, evidence, question?, workItemId, at }\`. A unit is done only when BOTH tracks have signed
it. **Both verdicts CLEAR the completion gate — it refuses an ABSENT sign-off and nothing else.**

- **\`confirmed\`** — the evidence differs by track. Flowrider: a test \`file:line\` PLUS what makes
  that test fail. Siegemaster: the value you measured off the running system.
- **\`unconfirmable\`** — you could not settle it after real effort. \`evidence\` names what you TRIED
  and why each attempt could not reach the unit. **A \`question\` naming what someone else would need
  is REQUIRED**; the contract refuses an \`unconfirmable\` carrying none.

**A blank sign-off is the one thing that never clears.** Nothing server-side reopens an unsigned
unit, the completion gate refuses your parent's \`done\` while a unit carries no sign-off, and the
pt chain spends itself against it. An honest \`unconfirmable\` clears that gate.

**A unit that simply needs a test nobody has written yet is NOT \`unconfirmable\`.** It is work
remaining: put it in your \`NEXT: rework\` line. A verdict CLOSES a unit permanently.

**A measured defect is a NEW observable, not a third verdict.** An observable is a positive
expectation, so "send it \`bleh\` and the server crashes instead of returning 400" is the INVERSE
expectation and belongs in the spec. ADD it with \`modify-quest\`; it arrives unsigned and then
carries its own two sign-offs like every other unit. **There is no \`defect\`, \`deferred\`, \`gap\` or
\`recorded\` SIGN-OFF verdict** — the standing concerns' \`blightLedger\` dispositions are a separate
record with a vocabulary of their own.

**Provenance is a SEPARATE axis.** \`addedBy\` records who added the observable. Its values are
\`spec\`, \`chaoswhisperer\`, \`codeweaver\`, \`flowrider\`, \`siegemaster\` and \`operator\`. It never
answers whether the unit is settled.`,

  authoringMarkdown: `## Modality — chosen per OBSERVABLE, never per flow

**A flow is not one technology. Neither is a node.** One flow routinely crosses a browser, an HTTP
route, a persistence layer and a spawned process. You can prove each of its observables at exactly
one of those layers. Join the \`[type]\` tag on an observable's own checklist line to its row in the
\`## CHECK SURFACES\` legend — a terminal, branch or off-map unit takes its own
\`## TERMINAL/BRANCH/OFF-MAP SURFACE\` heading instead — and assert at that surface. A
flow's \`flowType\` is a hint about where its centre of gravity sits. It never overrides the modality
you chose for a single observable.

An \`operational\` flow carrying \`ui-state\` observables still needs a browser for those.

**Two rules compose here. They never compete.**

1. Journey-vs-matrix chooses the test SHAPE.
2. \`checkSurface\` chooses the LAYER.

The shape decides how many tests there are. It also decides what each test walks. A branchy flow is
a JOURNEY: one test per path, driven end to end. A set of independent input combinations is a
MATRIX, one parameterized test over the combinations. The surface decides where each assertion
inside that shape reads its value from. The two rules cross into three cases:

- A branchy flow on a web surface is a journey rendered as e2e.
- A branchy flow on a non-web surface is a journey rendered as integration.
- A combination matrix is integration.

Never let the shape you picked move an assertion off its \`checkSurface\`. Never let the layer you
picked collapse a journey into one parameterized test.

**The wrong proof each type attracts.** The \`checkSurface\` says where to look. Each entry below
names the shortcut that never reaches that surface:

- \`ui-state\` — you reach for jsdom on a painted claim. jsdom has no layout engine. Every measured
  width reads 0. The assertion then passes whatever the real browser would paint. \`textContent\`
  proves a string is in the DOM, never that a user can read it. Geometry, wrapping, clipping and
  visibility need a real browser.
- \`cache-state\` — you call the read/write helper directly. That call proves the helper's shape
  ONLY. It never proves the app reaches that helper on the lifecycle event the observable names
  (mount, reload, navigation, a second tab, a sweep that runs on mount).
- \`api-call\` — you assert that a mocked fetch was called. That proves your mock, not the route.
  Prove it from the side that makes the claim: intercept the request for "the browser sent this
  body", or test the server layer for "the route answered 400 with this message".
- \`db-query\` — you spy on the write function. The spy proves the call happened, never that what
  landed is correct. Read the persisted artifact back.
- \`process-state\` — you mock the spawner. A mocked spawner cannot prove the "zero processes
  spawned" half of the claim at all.
- \`custom\` — you paraphrase the predicate into something easier to satisfy. A \`custom\` observable
  is not automatically operational. Run what it actually asks for. When it names a content search,
  that search's real output IS the measured value. Run that search with
  \`discover({ grep, strict: true })\`. A bare shell \`grep\` is blocked in this repo.`,
} as const;

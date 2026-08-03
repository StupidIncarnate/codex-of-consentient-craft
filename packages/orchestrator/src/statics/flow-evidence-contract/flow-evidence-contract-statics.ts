/**
 * PURPOSE: The single source of truth for what counts as honest flow-perspective coverage, split by
 * who needs it — `judgingMarkdown` is the criteria an artifact is accepted or rejected against, and
 * `authoringMarkdown` is the method for choosing where to assert
 *
 * USAGE:
 * flowEvidenceContractStatics.judgingMarkdown;
 * // Returns the evidence contract, false-green catalogue and disposition vocabulary
 *
 * The Flowrider operator embeds ONLY `judgingMarkdown`; the Flowrider-Minion embeds both. That split
 * matches every other operator family — `codeweaver-minion` owns the TDD method its parent never
 * restates, and `siegemaster-minion` owns the browser-driving knowledge its parent never carries.
 * The operator judges a finished artifact; it does not need the method that produced it, and
 * carrying both put the same 8,281 characters into two prompts at once.
 *
 * Two rules in here exist because the taxonomy silently dropped whole classes of observable:
 * `cache-state` (browser storage) appeared in no modality's signal list at all, and the operational
 * modality was keyed on a flow's `flowType` even though an operational flow routinely carries
 * `ui-state` observables that still need a browser. Both are now keyed on the OBSERVABLE, not the
 * flow, because that is the level a modality is actually chosen at.
 *
 * **The check-surface map is NOT restated here.** `get-qa-checklist` stamps a `checkSurface` on every
 * unit it returns, generated from `qaCheckSurfaceStatics.byOutcomeType`, and renders a legend
 * covering exactly the observable types present on that flow. Both roles fetch that checklist before
 * they author or judge anything, so an inline copy is a second, wider, staler rendering of a value
 * they already hold per unit. Siegemaster has always relied on the tool this way and carries no
 * table; this block now matches it.
 */

export const flowEvidenceContractStatics = {
  judgingMarkdown: `## The Evidence Contract — what makes an observable COVERED

An observable is covered when all five of these exist and a reader can confirm each by opening the
file. Fewer than five is a claim, not coverage.

1. the **observable id** and its **verbatim** text from the spec
2. the **test file and line**
3. the **assertion itself, quoted**
4. **what makes it fail** — the specific wrong value or state that turns it red
5. the **witnessed red** — the actual failure output seen before the code made it pass, or the
   mutation made and reverted to prove the test bites

Item 4 catches nearly everything. "Fails if the text is wrong" is not an answer; "fails if the row
renders the older comment first, because the assertion pins the exact order \`[newer, older]\`" is.
An agent that cannot say what would make its assertion fail has not written a test — it has written
a sentence that happens to be true.

**The surface each unit must be checked at comes from the checklist, never from memory.**
\`get-qa-checklist({ questId, flowId })\` stamps a \`checkSurface\` on every unit it returns. That
string is the authoritative surface for that unit. An assertion whose layer disagrees with its unit's
\`checkSurface\` is rejected on that basis alone — no judgement call required.

## Known false greens — reject on sight

Every pattern below is a real false green that shipped in this repo.

- **Existence-only coverage.** "Observable X maps to test Y" with no assertion and no failure mode.
  Matching observable ids against \`describe\` block names is name-matching, not auditing. If the
  audit could have been done without reading the assertions, it was not an audit.
- **Layer blindness.** The assertion cannot observe what the observable claims — a painted-geometry
  claim asserted in jsdom, a storage-lifecycle claim asserted by calling the helper directly, a
  spawn claim asserted against a mock. Check it against the unit's \`checkSurface\`.
- **Stopping at the browser when the flow goes deeper.** Playwright proves only what the browser can
  observe — never that the row persisted with the right shape, that the route rejected a bad payload
  with the right status, or that a downstream side effect fired.
- **A negative claim proved at the wrong layer.** "Zero processes spawned" and "no request issued"
  are only provable where the real thing would have happened.
- **Single-instance fixtures.** If the fixture holds exactly one of whatever the assertion
  discriminates — one card, one key, one comment, one row — then "the right one" and "the first one"
  are the same value and the test cannot tell them apart. An off-by-index bug passes. Seed at least
  two.
- **Benign-input monoculture.** If every seeded value is a short, well-behaved, space-separated
  happy-path string, the suite cannot fail. Every input class needs at least one hostile or extreme
  member: an unbroken token with no break opportunity, a newline, empty, whitespace-only, a
  duplicate, a very long value, something resembling markup.
- **Vacuous negatives.** Asserting a count of 0, or an absence, proves nothing unless the same suite
  shows that selector reaching non-zero. Otherwise a typo'd selector passes forever.
- **Unwitnessed red.** No captured failing output means the test was never proven to bite.
- **Self-referential tests.** A test whose real subject is the harness, a proxy, or another test is
  not coverage. Fixture plumbing that pins nothing about the product gets deleted, not counted.
- **A guard for an input the product cannot produce.** Legitimate only when it says plainly that it
  is defensive. It must never be counted as covering a user-facing observable.

## Dispositions — every observable gets exactly one

\`COVERED\`, \`DEFECT:\` and \`GAP:\` are three different evidentiary states and must never be
collapsed into one label. The next role reads them as different instructions.

- **\`COVERED\`** — a passing test with all five evidence items.
- **\`DEFECT:\`** — the behaviour is wrong and a test **proves it, left red**. Carries: which
  observable, what is wrong, the test that reds, and why it was handed on rather than fixed
  (architectural, out of bounds, or needs a product decision). The reader's instruction is *fix
  this*.
- **\`GAP:\`** — the observable **cannot be proven at any layer available here**, so no test exists.
  Carries precisely why the layer cannot reach it and what must be checked by hand instead. The
  reader's instruction is *go verify this yourself*. A \`GAP:\` is never a place to put something
  that was simply not reached — that is remaining scope, and it is reported as remaining scope.
- **\`ADJUSTED:\` / \`ADDED:\`** — the spec itself was moved via \`modify-quest\`.`,

  authoringMarkdown: `## Modality — chosen per OBSERVABLE, never per flow

**A flow is not one technology, and neither is a node.** One flow routinely crosses a browser, an
HTTP route, a persistence layer and a spawned process, and each of its observables is provable at
exactly one of those layers. Read each unit's \`checkSurface\` off the checklist and assert there. A
flow's \`flowType\` is a hint about where its centre of gravity sits — it never overrides the
per-observable choice, and an \`operational\` flow carrying \`ui-state\` observables still needs a
browser for those.

**The wrong proof each type attracts.** The \`checkSurface\` says where to look; these are the
shortcuts that look like looking:

- \`ui-state\` — jsdom for any painted claim. It has no layout engine, every measured width reads 0,
  and the assertion passes no matter what paints. \`textContent\` proves a string is in the DOM,
  never that a user can read it. Geometry, wrapping, clipping and visibility need a real browser.
- \`cache-state\` — a test that calls the read/write helper directly. That proves the helper's shape
  ONLY, never that the app reaches it on the lifecycle event the observable names (mount, reload,
  navigation, a second tab, a sweep that runs on mount).
- \`api-call\` — asserting a mocked fetch was called. That proves your mock, not the route. Prove it
  from the side that makes the claim: request interception for "the browser sent this body", a
  server-layer test for "the route answered 400 with this message".
- \`db-query\` — a spy on the write function. It proves the call happened, never that what landed is
  correct. Read the persisted artifact back.
- \`process-state\` — a mocked spawner, which cannot prove the "zero processes spawned" half of the
  claim at all.
- \`custom\` — paraphrasing the predicate into something easier to satisfy. A \`custom\` observable is
  not automatically operational; run what it actually asks for, and when it names a grep, the grep's
  real output IS the measured value.`,
} as const;

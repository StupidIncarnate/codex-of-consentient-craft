/**
 * PURPOSE: The single source of truth for what counts as honest flow-perspective coverage — the
 * five-part evidence contract, the modality-per-observable-type table, and the catalogue of known
 * false greens. Embedded verbatim in BOTH the Flowrider operator prompt and the Flowrider-Minion
 * prompt so the operator's reject list and the minion's authoring checklist can never drift apart
 *
 * USAGE:
 * flowEvidenceContractStatics.markdown;
 * // Returns the shared evidence-contract markdown block, interpolated into both prompts
 *
 * Two rules in here exist because the taxonomy silently dropped whole classes of observable:
 * `cache-state` (browser storage) appeared in no modality's signal list at all, and the operational
 * modality was keyed on a flow's `flowType` even though an operational flow routinely carries
 * `ui-state` observables that still need a browser. Both are now keyed on the OBSERVABLE, not the
 * flow, because that is the level a modality is actually chosen at.
 */

export const flowEvidenceContractStatics = {
  markdown: `## The Evidence Contract — what makes an observable COVERED

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

## Modality — chosen per OBSERVABLE, never per flow

**A flow is not one technology, and neither is a node.** One flow routinely crosses a browser, an
HTTP route, a persistence layer and a spawned process, and each of its observables is provable at
exactly one of those layers. Read each observable's \`type\` and pick from this table. A flow's
\`flowType\` is a hint about where its centre of gravity sits — it never overrides the per-observable
choice, and an \`operational\` flow carrying \`ui-state\` observables still needs a browser for those.

| \`type\` | what it claims | what proves it | what does NOT |
|---|---|---|---|
| \`ui-state\` | what a user sees or can drive | Playwright, for anything about paint, geometry, visibility, ordering or real interaction | jsdom for any painted claim — no layout engine, every measured width reads 0. \`textContent\` proves a string is in the DOM, never that a user can read it |
| \`cache-state\` | browser storage — localStorage, sessionStorage, IndexedDB | Playwright whenever the claim involves a page lifecycle: mount, reload, navigation, a second tab, or a sweep that runs on mount. Read the real storage through the page | a jsdom test that calls the read/write helper directly proves the helper's shape ONLY, and never that the app reaches it on the lifecycle event the observable names |
| \`api-call\` | a request went out, or a response came back a particular way | prove it from the side that makes the claim: browser-side request interception for "the browser sent this body"; a server-layer integration test for "the route answered 400 with this message" | asserting a mocked fetch was called proves your mock, not the route |
| \`db-query\` | persisted state after an operation | read the real persisted artifact back after the operation and assert its shape | a spy on the write function; it proves the call happened, never that what landed is correct |
| \`process-state\` | a process was or was not spawned | integration against the real spawn boundary, asserting the child's actual argv | a mocked spawner, which cannot prove the "zero processes spawned" half of the claim at all |
| \`custom\` | a predicate stated in prose — often a grep, a count, or a real-state check | run the predicate exactly as written and assert its stated result, including the exact match count | paraphrasing the predicate into something easier to satisfy. A \`custom\` observable is not automatically operational — read what it actually asks for |

Two consequences worth stating outright:

- **A flow that reaches past the browser needs an assertion past the browser.** Playwright can only
  prove what the browser can observe. It cannot prove the row persisted with the right shape, that
  the route rejected a bad payload with the right status, that the cleanup ran, or that a downstream
  side effect fired. This is the layer that gets skipped most.
- **A negative claim needs the same layer as its positive twin.** "Zero processes spawned" and
  "no request issued" are only provable where the real thing would have happened.

## Known false greens — reject on sight

Every pattern below is a real false green that shipped in this repo.

- **Existence-only coverage.** "Observable X maps to test Y" with no assertion and no failure mode.
  Matching observable ids against \`describe\` block names is name-matching, not auditing. If the
  audit could have been done without reading the assertions, it was not an audit.
- **Layer blindness.** The assertion cannot observe what the observable claims — a painted-geometry
  claim asserted in jsdom, a storage-lifecycle claim asserted by calling the helper directly, a
  spawn claim asserted against a mock. See the table above.
- **Stopping at the browser when the flow goes deeper.** A green browser test over a broken server
  seam is the exact false confidence this whole contract exists to prevent.
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
} as const;

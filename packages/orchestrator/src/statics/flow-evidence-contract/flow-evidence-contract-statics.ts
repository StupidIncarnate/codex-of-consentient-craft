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
 * TWO DISCIPLINE PACKS INTERPOLATE THESE HALVES. Each pack hands a half to the session that needs
 * it:
 *
 * 1. `discipline-below-browser` puts `authoringMarkdown` in its `workerMarkdown`, because that
 *    worker writes the suite.
 * 2. `discipline-below-browser` puts `judgingMarkdown` in its `reviewerMarkdown`, because that
 *    reviewer grades the suite.
 * 3. `discipline-browser-e2e` interpolates `judgingMarkdown` alone. Its colocated test pins the
 *    absence of the authoring half.
 *
 * ONE RULE DECIDES THAT SPLIT: a reviewer does not need the method that produced the artifact it
 * grades. The whole planner/worker/reviewer shape rests on that rule. When each pack carried both
 * halves, the same 8,281 characters went into two prompts at once.
 *
 * TWO RULES HERE EXIST BECAUSE AN EARLIER TAXONOMY DROPPED WHOLE CLASSES OF OBSERVABLE.
 * `cache-state` (browser storage) appeared in no modality's signal list at all. The operational
 * modality was keyed on a flow's `flowType`. An operational flow routinely carries `ui-state`
 * observables. A browser is the only place to check those. Both rules now key on the OBSERVABLE
 * rather than the flow, because a session picks a modality one observable at a time.
 *
 * NEITHER BLOCK RESTATES A CHECK-SURFACE MAP OF ITS OWN. `get-qa-checklist` stamps a `checkSurface`
 * on every unit it returns. `qaCheckSurfaceStatics.byOutcomeType` generates that string. The same
 * tool renders a legend covering exactly the observable types present on that flow. An inline copy
 * here would restate that value a second time, wider and staler than the per-unit one both roles
 * already hold. Both roles fetch that checklist before they author or judge anything. Siegemaster
 * has always read the surface off that tool. Its pack carries no table. These two blocks now match
 * that precedent.
 */

export const flowEvidenceContractStatics = {
  judgingMarkdown: `## The Evidence Contract — what makes an observable COVERED

An observable is covered when all five items below exist. Four items out of five is a claim rather
than coverage. A reader must be able to confirm every one of the five by opening the file.

1. the **observable id** and its **verbatim** text from the spec
2. the **test file and line**
3. the **assertion itself, quoted**
4. **what makes it fail**: the specific wrong value or state that turns it red
5. the **witnessed red**: the failure output you saw before the code made it pass, or the mutation
   you made and reverted to prove the test bites

Most false claims fail at item 4. "Fails if the text is wrong" is not an answer. "Fails if the row
renders the older comment first, because the assertion pins the exact order \`[newer, older]\`" is one.
An assertion you cannot name a failing value for is not a test yet.

**The checklist names the surface each unit must be checked at. Never take it from memory.**
\`get-qa-checklist\` stamps a \`checkSurface\` on every unit it returns. That string is the
authoritative surface for that unit. Reject an assertion whose layer disagrees with its unit's
\`checkSurface\`. That disagreement is the entire reason. You weigh nothing else.

## Known false greens — reject on sight

A false green is a suite that passes while the observable it claims to cover stays unproven. Every
pattern below is a real one that shipped in this repo.

- **Existence-only coverage.** "Observable X maps to test Y", with no assertion and no failure mode.
  Matching observable ids against \`describe\` block names is not an audit, because it opens no
  assertion. Read every assertion you count.
- **Layer blindness.** The assertion cannot observe what the observable claims: a painted-geometry
  claim you assert in jsdom, a storage-lifecycle claim you prove by calling the helper directly, a
  spawn claim you assert against a mock. Check the assertion against the unit's \`checkSurface\`.
- **Stopping at the browser when the flow goes deeper.** Playwright proves only what the browser can
  observe. It never proves that the row persisted with the right shape, that the route rejected a
  bad payload with the right status, or that a downstream side effect fired.
- **A negative claim proved at the wrong layer.** You can prove "zero processes spawned" and "no
  request issued" only where the real thing would have happened.
- **Single-instance fixtures.** A fixture holds exactly one of whatever the assertion discriminates:
  one card, one key, one comment, one row. "The right one" and "the first one" are then the same
  value. An off-by-index bug passes, because the test cannot tell those two apart. Seed at least
  two.
- **Benign-input monoculture.** A suite whose every seeded value is a short, well-behaved,
  space-separated happy-path string cannot fail. Every input class needs at least one hostile or
  extreme member: an unbroken token with no break opportunity, a newline, empty, whitespace-only, a
  duplicate, a very long value, something resembling markup.
- **Vacuous negatives.** Assert a count of 0, or an absence, only where the same suite also shows
  that selector reaching non-zero. Otherwise a typo'd selector passes forever.
- **Unwitnessed red.** No captured failing output means you never proved the test bites.
- **Self-referential tests.** A test whose real subject is the harness, a proxy, or another test is
  not coverage. Delete fixture plumbing that pins nothing about the product. Never count it.
- **A guard for an input the product cannot produce.** A guard like that is legitimate only when the
  test says plainly that it is defensive. Never count it as covering a user-facing observable.

## Verdicts — every unit carries TWO independent sign-offs

A unit is settled PER TRACK, never once for everybody. Each track answers its own question:

- \`flowriderSignoff\` answers *is this proven by a test?*
- \`siegemasterSignoff\` answers *does it hold when a human drives the real system?*

Each field holds \`{ verdict, evidence, question?, workItemId, at }\`. Each carries one of exactly
TWO verdicts. A unit is done only when BOTH tracks have signed it. Both verdicts CLEAR the
completion gate. The gate refuses an ABSENT sign-off. It refuses nothing else.

- **\`confirmed\`** — the evidence differs by track:
  - Flowrider: a test \`file:line\` PLUS what makes that test fail. Name the production line you
    broke and the assertion that went red.
  - Siegemaster: the value you measured off the running system.
  - Both tracks: never cite a test nobody has watched fail, never cite an adjective.
- **\`unconfirmable\`** — you genuinely could not settle this unit after real effort. \`evidence\`
  names what you TRIED. It also says why each attempt could not reach the unit. A \`question\` naming
  what someone else would need is REQUIRED. The contract refuses an \`unconfirmable\` that carries
  none.

**A measured defect is a NEW observable, not a third verdict.** An observable is a positive
expectation. "Send it \`bleh\` and the server crashes instead of returning 400" is the INVERSE
expectation. That belongs in the spec. Write down what you measured. ADD it to the flow through the
additive spec authority both roles hold (\`modify-quest\`). It arrives unsigned. It then carries its
own two sign-offs, like every other unit. Sign a defect you cannot close this session as
\`unconfirmable\`. Your evidence is why you could not close it. There is no \`defect\`, \`deferred\`,
\`gap\` or \`recorded\` SIGN-OFF verdict. (The standing concerns' \`blightLedger\` dispositions are a
separate record with a vocabulary of their own. Nothing here governs them.)

**Provenance is a SEPARATE axis.** \`addedBy\` on the observable answers "was this in the spec at
approval, or added mid-quest, and by whom". Its values are \`spec\`, \`chaoswhisperer\`,
\`codeweaver\`, \`flowrider\`, \`siegemaster\` and \`operator\`. It never answers whether the unit is
settled.

**A unit nobody can settle after real effort is \`unconfirmable\`.** Sign it with \`evidence\` and a
\`question\`. Never leave it blank.

A blank sign-off routes nothing back to anybody, because nothing server-side reopens an unsigned
unit. A blank also blocks the quest, because the completion gate refuses your parent's \`done\` while
any unit carries no sign-off. A blank spends the pt chain as well. An honest \`unconfirmable\` clears
the gate. A blank never does.

**A unit that simply needs a test nobody has written yet is NOT \`unconfirmable\`.** That unit is
work remaining, not a wall. Put it in your \`NEXT: rework\` line, where the next round picks it up.
A verdict CLOSES a unit permanently. Never spend one on a test somebody could still write,
because that closes the unit with nothing proving it.`,

  authoringMarkdown: `## Modality — chosen per OBSERVABLE, never per flow

**A flow is not one technology. Neither is a node.** One flow routinely crosses a browser, an HTTP
route, a persistence layer and a spawned process. You can prove each of its observables at exactly
one of those layers. Read each unit's \`checkSurface\` off the checklist. Assert at that surface. A
flow's \`flowType\` is a hint about where its centre of gravity sits. It never overrides the modality
you chose for a single observable.

An \`operational\` flow carrying \`ui-state\` observables still needs a browser for those.

**Two rules compose here. They never compete.**

1. Journey-vs-matrix chooses the test SHAPE.
2. \`checkSurface\` chooses the LAYER.

The shape decides how many tests there are. It also decides what each one walks. A branchy flow is a
JOURNEY: one test per path, driven end to end. A set of independent input combinations is a MATRIX,
one parameterized test over the combinations. The surface decides where each assertion inside that
shape reads its value from. The two rules cross into three cases:

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

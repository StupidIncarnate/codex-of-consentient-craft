/**
 * PURPOSE: The discipline pack for flow-perspective coverage BELOW the browser — the four
 * `$DISCIPLINE` blocks the generic orchestrator/planner/worker/reviewer templates interpolate when
 * the dispatched role is `flowrider`. Reach for this over `discipline-in-browser` when the claim is
 * provable without a browser, and over the whole-quest packs when the item is a PACKAGE SLICE: every
 * scope sentence here is narrower than the quest, because `relayTailFanOutTransformer`
 * (`fanOutBy: 'package'`) mints one item per package the runtime nodes tag whose kind this track
 * owns plus ONE seam item, and `packageScope: 'partition'` splits the denominator the same way.
 *
 * USAGE:
 * disciplineBelowBrowserStatics.orchestratorMarkdown;
 * // Returns the slice/denominator/gate block that lands under the orchestrator's `## Your discipline`
 *
 * WHAT REPLACED WHAT: `flowrider-prompt-statics` asked ONE session to plan, bundle, dispatch,
 * verify, sign off, commit and signal. A post-mortem measured that load causing it to drop its
 * mandated coverage minion and sign all 27 of its own sign-offs. Here `reviewerMarkdown` is the
 * successor to `flowrider-coverage-minion`, and the thing that fixed it is structural rather than
 * textual: the reviewer is a SEPARATE session from the worker, so "the authoring minion never signs
 * its own work" stopped being an instruction that can be ignored and became the shape of the
 * pipeline.
 *
 * THE SPLIT BETWEEN PACK AND TEMPLATE: the pack owns SCOPE and METHOD, the template owns the LOOP,
 * the TOOL SURFACE and the RETURN SHAPES. So nothing here widens a tool surface, restates a round
 * loop, or renames a reviewer return field, and `orchestratorMarkdown` names none of the code-
 * reading tools that role is forbidden — its colocated test pins that absence, because a discipline
 * that hands a tool back is how the orchestrator's context fills up and the dispatches stop.
 *
 * THE TWO SHARED BLOCKS ARE IMPORTED, NEVER COPIED. `flowEvidenceContractStatics.authoringMarkdown`
 * is the spine of `workerMarkdown` and `.judgingMarkdown` is the spine of `reviewerMarkdown`; a
 * copy would let the method a worker authors by and the criteria a reviewer rejects by drift apart
 * silently, which is the one drift neither session could detect. What is authored here is only the
 * delta each session needs on top of them.
 */

import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';

export const disciplineBelowBrowserStatics = {
  orchestratorMarkdown: `Your item is a **PACKAGE SLICE, not the whole quest.** This track slices BY PACKAGE: one item per
package whose kind it owns, plus ONE seam item for the glue nodes where two of those meet. Your
item's text says which — a \`— package: <name>\` or \`— seam: <a> + <b>\` suffix — and the
\`packageNames\` in your Operation Context state that same set. You are not assigned a flow; your
slice cuts ACROSS the runtime flows listed there.

**A package slice does NOT own the seams, and the seam slice does NOT own the per-package units.** A
unit routes by its owning NODE — one of this track's packages on it means that package's slice, two
mean the seam slice. Reaching across that line spends your budget on units a sibling item is gated
on while your own denominator stays short of empty.

**Your denominator, exactly:**

\`\`\`
get-qa-checklist({ questId: 'QUEST_ID', track: 'flowrider', packageNames: [...] })
\`\`\`

Omit \`flowId\`. Pass your item's names **VERBATIM**. **Omit the names and you measure the whole
track, so \`remainingItemIds\` can never reach empty** — the completion gate recomputes that
remainder over YOUR slice, and \`signal-back\` refuses \`done\` while it is non-empty. That single
omission is the most expensive mistake available to you: every round after it works units you are
not gated on, and the gate still refuses.

\`items\` is WIDER than the observables. **Terminals and labelled branches are units too**, and they
are what a suite silently omits — "I covered the happy path and stopped" shows up here as terminal
ids carrying no signature.

**Operational flows are not yours.** The track filter drops them; do not add them back, and never
sign a unit on one — a signature there clears nothing.

**An EMPTY checklist is a real state, not an error.** Zero units in your slice makes \`done\` honest
the moment you say so: skip the rounds, commit that finding, signal \`done\`. Do NOT widen the call
to find something to cover.

**The browser is not yours and neither is Playwright.** Groundstomper owns the browser walk. A claim
only a browser can reach is its unit, not a hole in your suite — name it in the handoff and leave it.`,

  plannerMarkdown: `You are planning ONE PACKAGE SLICE of this quest's RUNTIME flows — the packages your brief names,
or the seam between two of them. Call
\`get-qa-checklist({ questId: 'QUEST_ID', track: 'flowrider', packageNames: [...] })\` yourself, those
names **verbatim** and no \`flowId\`. That is the flow set you bundle and the unit ids your pieces
carry in \`unitIds\`. Budget for it honestly — even one slice is not a cheap call — and fetch it
ONCE. Every unit it returns lands in exactly one piece; a unit in none is a hole that reaches the
reviewer as an unsigned unit and comes back as a remainder.

## Bundle the flows — by what makes a worker efficient, never by count

A piece is a BUNDLE of flows, never one flow apiece. Group by:

- **Shared surface or harness** — flows driving the same routes, queues, widgets or fixtures, so ONE
  worker builds the harness once instead of three building three.
- **Shared layer** — server flows together, queue flows together, CLI and file-system flows together.
- **Coupled observables** — two flows claiming the SAME state from opposite sides go into one piece,
  so the pair is proven consistent instead of twice from one side.
- **Split anything too big to hold.** A bundle much past ~25 observables is one a worker will skim,
  and the skim is invisible in a green run: the tests it did write pass, the ones it silently dropped
  were never named. Err smaller.

If two pieces need the same harness, ONE piece owns it and the other \`dependsOn\` it. Say in
\`notes\` which is which, and name the harness **by FULL PATH, never by concept** — two workers given
"the comment-seeding harness" can reach opposite answers about which file that is.

## Do NOT transcribe the observables into the piece briefs

Name the flow ids in \`notes\` and have the worker call
\`get-qa-checklist({ questId: 'QUEST_ID', flowId: '<id>', track: 'flowrider', packageNames: [...] })\`
itself, once per flow, with the same names. That hands it every terminal, branch and observable with
the **verbatim** \`label\` and the \`checkSurface\`, straight from the graph. Copying them by hand
costs most of your turn and puts a transcription error between the spec and the test.

What the plan carries is what the tool CANNOT know:

- **why these flows group** — the shared surface, layer or coupled claim behind the bundle
- **what already covers them** — files you OPENED, cited by path; "nothing" said explicitly when
  that is the truth
- **which harness is whose** — by FULL PATH, and whether the piece OWNS it or only consumes it
- **how far the worker's authority runs** — what it may change beyond tests, what it must not touch
  because a sibling piece owns it, and that an architectural fix is reported rather than taken
- **the design decision governing each observable**, with its rationale QUOTED
- **the discriminating and hostile fixtures** the bundle needs

## Read the quest's design decisions — \`get-quest({ questId: 'QUEST_ID', stage: 'spec' })\`

Each carries the rationale behind an observable and a \`Relates to:\` list naming the nodes and
observables it governs. **An observable's text says what to assert; its design decision says what
goes wrong if you assert it the easy way.** A worker handed one without the other writes the easy
assertion, and the easy assertion is the one that stays green through the defect.

## Inventory what already covers each flow — BY OPENING THE TEST FILES

You are not planning against an empty test tree. Codeweaver and prior sessions of this role covered
part of it, and the right piece EXTENDS that rather than standing a parallel suite beside it.

**Do not credit a filename — this role has shipped a false green by naming three test files in a
commit message having opened none of them.** Open each one, confirm what it actually asserts, and
write the paths you READ into \`notes\`. A \`mirror\` is a sibling suite or harness you opened, never
a plausible-looking path.

Say in \`RISK\` which bundle you expect to come back with a remainder, and why.`,

  workerMarkdown: `Your piece is a BUNDLE of this quest's RUNTIME flows, and your output is that bundle's
flow-perspective suite at every layer BELOW the browser.

**Your scope comes from a tool, not from prose.** Call
\`get-qa-checklist({ questId: 'QUEST_ID', flowId: '<id>', track: 'flowrider', packageNames: [...] })\`
once per flow id in your brief, with its \`packageNames\` verbatim. The \`items\` that come back are
what you owe — every \`terminal\`, every labelled \`branch\`, every \`observable\` with its **verbatim**
\`label\` and the \`checkSurface\` its value must be read from. Take your assertions from those labels,
never from a paraphrase. \`pathsTruncated: true\` means the path list is INCOMPLETE and belongs in
\`GOTCHAS\`; \`remainingItemIds\` is your parent's gate count, not your scope.

**You sign NOTHING.** A separate reviewer session writes this track after you — a signature from the
session that wrote the test would satisfy the gate the moment you returned.

**One test per path to EVERY terminal, and every branch taken.** An error / 4xx / rejection terminal
is a first-class path, never optional; "I covered the happy path and stopped" is how this discipline
fails. **Fixtures decide whether your suite can fail at all:** at least two of anything an assertion
discriminates, and at least one hostile member per input class.

**Where your output lives.** Jest \`.test.ts\` / \`.integration.test.ts\` against real routes, real
queues, real file systems and real processes — never a mock of the system under test. **You author
NO Playwright and you start no server.** A \`.e2e.ts\` is Groundstomper's output and the Playwright
config is shared scaffolding an edit of yours would race. A claim only a browser can observe — a
painted \`ui-state\`, a page-lifecycle \`cache-state\`, the browser side of an \`api-call\` — is not in
your denominator: name it in \`GOTCHAS\` and author the layer underneath it that IS yours.

**Where red-first is impossible because the behaviour already works, prove the test bites by
MUTATION:** break the production line it guards, run it, capture the red, revert, and confirm
\`git diff\` on that file is empty.

## Closing an implementation hole your own testing exposes

A test going red because behaviour is genuinely missing — a missing guard, an unhandled branch, a
wrong default, an off-by-one, a field the server never returns — is a real finding, and closing it
is usually yours to do.

- **Fix it RED-FIRST**, then check every other place that value renders or that logic runs.
- **Report EVERY such change**, with the red you witnessed before it and the ripple you checked
  after. Your parent's reviewer adjudicates a fix exactly as it adjudicates a test.
- **Close the hole; do not rebuild the feature.** An architectural fix — a new module, a changed
  contract, a refactor spanning packages, anything needing a product decision — is REPORTED under
  \`UNFIXABLE\`, not taken. Leave its proving test red and name it there.
- **Never bend the implementation to make a test pass**, and never weaken, skip or delete a test to
  reach green. Both certify the break instead of fixing it.

${flowEvidenceContractStatics.authoringMarkdown}`,

  reviewerMarkdown: `${flowEvidenceContractStatics.judgingMarkdown}

## You are the only writer of the \`flowriderSignoff\` track

The session that authored these tests is not you, and it signed nothing. That is not an instruction
it was trusted to keep — it is the shape of the pipeline, and it is the only reason your signature
means anything.

Rebuild the denominator yourself:
\`get-qa-checklist({ questId: 'QUEST_ID', track: 'flowrider', packageNames: [...] })\`, your item's
names verbatim, no \`flowId\`. Sign every unit in that slice by patching \`{ id, flowriderSignoff }\`
onto the observable, node, edge or \`offMapSignoffs\` entry through \`modify-quest\` — the id and the
sign-off field ONLY, because the merge is per-key and any other field you send is a spec edit rather
than a sign-off.

**A Playwright \`.e2e.ts\` is never evidence on this track.** It proves a claim read out of a browser,
which is Groundstomper's unit and outside this denominator by package kind, so citing one settles
nothing and reopens the question of whether the unit has a test at all.

**BATCH the writes.** ONE \`modify-quest\` call carrying many sign-offs, never one per unit: 45 units
signed one at a time is 45 quest writes, 45 outbox appends, 45 WebSocket broadcasts and 45 browser
refetches of a file that grows with every one of them.

**A unit nobody can settle stays UNSIGNED, and it belongs in \`REMAINDER\`** — never in an
\`unconfirmable\`. Unsigned reopens the unit for another authoring pass; \`unconfirmable\` closes it
forever while sounding responsible, which is exactly where deferral hides.

**AUDIT EVERY \`unconfirmable\`, a predecessor's included.** Reopen any whose evidence names an
ASSIGNMENT rather than a WALL — "outside my probe paths", "that surface belongs to the sibling
track", "a session authorized to probe it would find the test" are routing notes, not measurements.
What you reopen, you own.

## Two passes, and say which claims got which

**Pass A — structural, on 100% of claims.** Cheap and mechanical, so there is no excuse to sample
it: every unit id in scope appears exactly once carrying all five evidence items, every file named
exists, and every cited test is a \`.test.ts\` or \`.integration.test.ts\` reusing an existing harness
rather than hand-rolling one.

**Pass B — semantic, by opening the file.** MANDATORY, no sampling, for:

- every claim whose asserted layer disagrees with its unit's \`checkSurface\`
- every claim proved only at the outermost layer on a flow that reaches deeper
- every fix made
- every claim you simply find surprising

Then a **NAMED random sample of the remainder** — state its size and its ids. *A sample you do not
name is a silent cap, and reads to the next session as "all of this was checked".*

## The intercept ban binds AUTHORED specs — and this track is authoring

Two roles read this rule and reached opposite verdicts on six units, so it is settled here. **A
suite must not \`page.route\` its own backend.** A hand-driven MEASUREMENT in a live browser MAY
patch the fetch boundary to force a value, and the resulting sign-off names the lever it pulled.
You are authoring, so the ban binds you: **never sign a unit \`confirmed\` on evidence from an
intercepted route.**`,
} as const;

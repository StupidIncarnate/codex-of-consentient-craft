/**
 * PURPOSE: The discipline pack for flow-perspective coverage BELOW the browser. It holds the four
 * `$DISCIPLINE` blocks the generic operator, planner, worker and reviewer templates interpolate when
 * the dispatched role is `flowrider`. Pick this pack over `discipline-browser-e2e` when a test can
 * prove the claim without a browser. Pick it over the whole-quest packs when the item is a PACKAGE
 * SLICE.
 *
 * USAGE:
 * disciplineBelowBrowserStatics.operatorMarkdown;
 * // Returns the two-field block that lands under the operator's `## Your discipline`
 *
 * EVERY SCOPE SENTENCE HERE IS NARROWER THAN THE QUEST. `relayTailFanOutTransformer`
 * (`fanOutBy: 'package'`) mints one item per package the runtime nodes tag whose kind this track
 * owns. One more item covers the seam where two such packages meet. A role's denominator is the set
 * of units it must settle, and `packageScope: 'partition'` splits that set the same way.
 *
 * `operatorMarkdown` IS TWO FIELDS: `RESOURCE` and `RESET`. Both read "none" here. The operator
 * starts no server. It pulls no lever. So it carries almost nothing. Three rules the block used to
 * hold moved into the planner, worker and reviewer blocks:
 *
 * - how a unit routes between a package slice and the seam slice
 * - that terminals and labelled branches are units too
 * - that the track filter drops operational flows
 *
 * The operator could only forward that material. The block also names none of the code-reading tools
 * that role is forbidden. Its colocated test pins that absence. A tool named there reads to the
 * operator as a permission. It then opens files. Its context fills. The dispatches stop.
 *
 * `workerMarkdown` MUST CARRY THE HEADINGS `### The work` AND `### The proof`. The worker template's
 * method points at both by name. The colocated test pins both.
 *
 * TWO SCOPES ARE NARROWER THAN THEY LOOK. Each block says so first-hand. `get-qa-checklist` with an
 * `operationItemId` narrows to the PACKAGE SLICE, which is the whole operation item rather than one
 * chunk of it. So `workerMarkdown` takes its own scope from the INTERSECTION of that list with its
 * chunk's `UNITS` and the bundle its `NOTES` names. TWO roles also write `flowriderSignoff`.
 * `signoffTrackEligibilityStatics.byTrack` gives `flowrider` and `groundstomper` the same
 * `signoffField` over disjoint `packageTypes`, so `reviewerMarkdown` says it signs this slice rather
 * than the field. Both corrections replace a sentence that read wider than the data. Either one left
 * alone would have signed a unit nobody covered.
 *
 * OFF-MAP FAMILIES ARE NOT ON THIS TRACK. `unitKinds` for `flowrider` is `terminal`, `branch` and
 * `observable`. Only `siegemaster` carries `off-map`. So `offMapSignoffs` is not a patch target here.
 * `reviewerMarkdown` names that absence rather than leaving it to be inferred.
 *
 * THE TWO SHARED BLOCKS ARE IMPORTED, NEVER COPIED. `flowEvidenceContractStatics.authoringMarkdown`
 * is the spine of `workerMarkdown`. `.judgingMarkdown` is the spine of `reviewerMarkdown`. What is
 * authored below is only the difference each session needs on top of those two. A copy would let the
 * method a worker authors by drift away from the criteria a reviewer rejects by. Neither session
 * could ever notice.
 *
 * WHAT REPLACED WHAT: the monolithic Flowrider prompt asked ONE session to plan, bundle, dispatch,
 * verify, sign off, commit and signal. A post-mortem measured what that load did. The session dropped
 * its mandated coverage minion. It signed all 27 of its own sign-offs. `reviewerMarkdown` is where
 * that grading job lives now. The repair is structural rather than textual. A SEPARATE reviewer
 * session grades what the worker wrote. The worker reaches no sign-off field.
 */

import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';

export const disciplineBelowBrowserStatics = {
  operatorMarkdown: `**RESOURCE:** none. Your workers start no dev server, because a suite below the browser needs none.
The browser belongs to another role.

**RESET:** none. You pull no lever between workers, because nothing here goes stale mid-round.`,

  plannerMarkdown: `You are planning ONE PACKAGE SLICE of this quest's RUNTIME flows. Your brief names that slice: either
a set of packages, or the seam where two of them meet.

Your denominator is every unit in that slice. One call returns it:
\`get-qa-checklist({ questId: 'QUEST_ID', operationItemId: 'OPERATION_ITEM_ID' })\`. It already
narrows to exactly your slice. It returns the track, the package slice and the flow set. The server
derives all three through the same transformer your parent's completion gate reads. Fetch it ONCE. A
second fetch returns the same list. It costs you most of a turn.

**\`items\` is WIDER than the observables.** Terminals and labelled branches are units too. Those are
the ones a suite silently omits. "I covered the happy path and stopped" shows up here as terminal ids
carrying no signature.

**Every unit that call returns lands in exactly one chunk.** A unit you leave in no chunk is a hole.
It reaches the reviewer unsigned. It comes back to you as rework.

**A package slice does NOT own the seams. The seam slice does NOT own the per-package units.** A unit
routes by its owning NODE:

- ONE of this track's packages tags that node — the unit routes to that package's slice.
- TWO of them tag it — the unit routes to the seam slice.

Reaching across that line spends your parent's budget on units a sibling item is already gated on.
Your own slice then reaches the reviewer with units no chunk covers.

**Operational flows are not yours.** The track filter drops them. Do not add them back.

**The browser is not yours. Playwright is not yours either.** A claim only a browser can reach is
another role's unit. It is not a hole in your suite.

**An EMPTY checklist is a real state, not an error.** Zero units in your slice means a plan with zero
chunks. Say so in \`SUMMARY\`. Your parent then dispatches no workers. Its reviewer records the
finding. **Do NOT widen the call to find something to cover.**

## Bundle the flows by what makes a worker efficient, never by count

A chunk is a BUNDLE of flows, never one flow apiece. Group by:

- **Shared surface or harness** — flows driving the same routes, queues, widgets or fixtures. ONE
  worker then builds the harness once, instead of three workers building three.
- **Shared layer** — server flows together, queue flows together, CLI and file-system flows together.
- **Coupled observables** — two flows claiming the SAME state from opposite sides go into one chunk.
  That worker then proves the two sides agree, instead of proving one side twice.
- **Split anything too big for one worker.** A worker skims any bundle much past ~25 observables.
  The skim is invisible in a green run. The tests it did write pass. It never names the ones it
  silently dropped. Cut the bundle smaller.

If two chunks need the same harness, the EARLIER-NUMBERED one owns it. Chunk order is dependency
order. Say in \`NOTES\` which chunk owns the harness. Say which chunks only consume it. Name the
harness **by FULL PATH, never by concept**. Two workers handed "the comment-seeding harness" can pick
different files.

**\`WARD\` per chunk:** \`--only lint,typecheck,unit,integration\`, over the chunk's explicit
\`FILES\`. Never \`e2e\`. No chunk on this discipline authors Playwright.

## Spikes are KEPT on this discipline

A harness recipe you got working is the pattern its worker extends, never a probe you throw away.
Spike when reading cannot tell you whether a route, a queue, a spawned process or a real file system
can be driven from a Jest test at all. Leave the working driver under \`spike-tmp/\`, which is
gitignored. Its worker then extends a driver that already ran, instead of re-deriving one. Name that
path in the owning chunk's \`NOTES\`.

Write the spike nowhere else. A spike outside \`spike-tmp/\` is an untracked file no chunk owns. The
server then refuses your parent's \`signal-back\`, because an untracked file leaves the worktree
dirty.

## Do NOT transcribe the observables into the chunk briefs

Have the worker call \`get-qa-checklist({ questId: 'QUEST_ID', operationItemId: 'OPERATION_ITEM_ID' })\`
itself, with the ids from its brief header. It gets the SAME narrowed list you did. Every terminal,
branch and observable arrives with the **verbatim** \`label\` and the \`checkSurface\`, straight from
the graph. \`NOTES\` names which of those flows are its bundle. Copying the units by hand costs most
of your turn. It also puts a transcription error between the spec and the test.

What \`NOTES\` carries is what the tool CANNOT know:

- **why these flows group** — the shared surface, layer or coupled claim behind the bundle
- **what already covers them** — files you OPENED, cited by path. Say "nothing" explicitly when that
  is the truth
- **which harness is whose** — by FULL PATH. Say whether the chunk OWNS it or only consumes it
- **how far the worker's authority runs** — what it may change beyond tests. What it must not touch,
  because a sibling chunk owns it. That it REPORTS an architectural fix rather than making it
- **the design decision governing each observable**, with its rationale QUOTED
- **the discriminating and hostile fixtures** the bundle needs

## Read the quest's design decisions with \`get-quest({ questId: 'QUEST_ID', stage: 'spec' })\`

Each decision carries the rationale behind an observable. Each also carries a \`Relates to:\` list
naming the nodes and observables it governs. **An observable's text says what to assert. Its design
decision says what goes wrong if you assert it the easy way.** A worker handed one without the other
writes the easy assertion. The easy assertion is the one that stays green through the defect.

## Inventory what already covers each flow, by OPENING THE TEST FILES

You are not planning against an empty test tree. Earlier roles and prior sessions of this one already
covered part of it. Your chunks EXTEND that coverage. A parallel suite standing beside the existing
one is the wrong chunk.

**Do not credit a filename.** A predecessor on this role named three test files in a commit message.
It had opened none of them. That shipped a false green. A \`MIRROR\` is a sibling suite or harness you
opened, never a plausible-looking path. Open each file. Confirm what it actually asserts. Write into
\`NOTES\` every path you READ.

Name in \`SUMMARY\` which bundle you expect to come back as rework. Say why.`,

  workerMarkdown: `Your chunk is a BUNDLE of this quest's RUNTIME flows. You write that bundle's flow-perspective suite
at every layer BELOW the browser.

**The checklist gives you the unit TEXT. Your chunk gives you the SCOPE.** Call
\`get-qa-checklist({ questId: 'QUEST_ID', operationItemId: 'OPERATION_ITEM_ID' })\` once, with the ids
from your brief header. It returns the whole PACKAGE SLICE. Every entry is a \`terminal\`, a labelled
\`branch\` or an \`observable\`. Each entry carries two fields you author against:

- \`label\` — the unit's text, **verbatim**. Take your assertions from it, never from a paraphrase.
- \`checkSurface\` — the surface that unit's value must be read from.

**That list is WIDER than your chunk. The surplus belongs to a sibling worker.** You owe the
INTERSECTION: the entries whose ids your chunk's \`UNITS\` names, over the bundle of flows its
\`NOTES\` names. Look each of your ids up in the list. Author against the entry you find.

Taking the whole slice instead goes wrong two ways:

1. You write outside your \`FILES\` to cover a sibling's unit. The later write wins, so one of you
   loses the work.
2. You report a sibling's unit as uncovered in \`NEXT: rework\`. That spends a round on a chunk the
   plan already scheduled.

Read two more fields off that response:

- \`pathsTruncated: true\` — the path list is INCOMPLETE. Say so in \`GOTCHAS\`.
- \`remainingItemIds\` — your parent's gate count. It is never your scope.

**You sign NOTHING.** A separate reviewer session signs this track after you. If you signed a unit,
your parent's completion gate would clear the moment you returned. Nobody would have re-read your
work.

### The work

1. **Choose the modality per OBSERVABLE**, by the rules below. Write Jest \`.test.ts\` /
   \`.integration.test.ts\` against real routes, real queues, real file systems and real processes —
   never a mock of the system under test.

2. **Write one test per path to EVERY terminal. Write one per branch taken.** An error / 4xx /
   rejection terminal is a first-class path, never optional. "I covered the happy path and stopped"
   is how this discipline fails.

3. **Seed fixtures that can fail.** Seed at least two of anything an assertion discriminates. Seed at
   least one hostile member per input class. **A suite seeded with one benign value of each thing
   cannot fail at all.**

4. **Close an implementation hole your own testing exposes.** A test going red because the behaviour
   is genuinely missing is a real finding — a missing guard, an unhandled branch, a wrong default, an
   off-by-one, a field the server never returns. You usually close that hole yourself. **Fix it
   RED-FIRST.** Then check every other place that value renders or that logic runs. Report the
   change, the red you witnessed, and the other places you checked. **Close the hole. Do not rebuild
   the feature.** Hand these four up in \`NEXT: rework\`, leaving the proving test red:

   - an architectural fix
   - a changed contract
   - a refactor spanning packages
   - anything needing a product decision

   **Never bend the implementation to make a test pass.** Never weaken, skip or delete a test to
   reach green. Both leave the defect in the code while the suite reports success.

**You author NO Playwright. You start no server.** A \`.e2e.ts\` file is another role's output. An
edit of yours to the Playwright config would race a sibling session's, because every session on this
quest shares one such file. A claim only a browser can observe is not one of your units — a painted
\`ui-state\`, a page-lifecycle \`cache-state\`, the browser side of an \`api-call\`. Author the layer
underneath that claim, which IS yours. Name the claim itself in \`GOTCHAS\`.

${flowEvidenceContractStatics.authoringMarkdown}

### The proof

Every test you write owes a **witnessed red**. \`EVIDENCE\` carries that red per unit, alongside the
other four items of the evidence contract:

1. the unit id, with its verbatim text
2. the test \`file:line\`
3. the assertion, quoted
4. **what makes it fail** — the specific wrong value that turns it red

**Where red-first is impossible because the behaviour already works, prove the test bites by
MUTATION.** Do these five, in order:

1. Break the production line the test guards.
2. Run the test.
3. Capture the red output.
4. Revert BY EDITING the line back. Never \`git checkout --\`.
5. Confirm \`git diff\` on that file is empty.

For each unit, say which of the two you did — the witnessed red, or the mutation.

"Fails if the text is wrong" is not an answer. "Fails if the row renders the older comment first,
because the assertion pins the exact order \`[newer, older]\`" is one. **Name the specific wrong value
for every assertion you write.** An assertion with no named failing value is not a finished test.`,

  reviewerMarkdown: `${flowEvidenceContractStatics.judgingMarkdown}

## You sign this track's units

The worker authored these tests. It signed nothing, because its own prompt forbids signing. That is
structural rather than a promise it was trusted to keep. The worker's session ends before yours
starts, so it never reaches this field. You are the only session on this round that opens these files
a second time.

**Your units are the PACKAGE SLICE your brief names, never the whole \`flowriderSignoff\` field.** A
sibling role writes that SAME field over the browser-reachable package kinds. Those kinds are the
DISJOINT complement of your slice. So signing one of your units never settles one of the sibling's.
Signing one of ITS units is a false green: you opened no browser, so you cannot confirm a
browser-reachable claim.

Your denominator is every unit in your slice. Rebuild it yourself with
\`get-qa-checklist({ questId: 'QUEST_ID', operationItemId: 'OPERATION_ITEM_ID' })\`, passing the ids
from your brief header. Sign every unit it returns by patching \`{ id, flowriderSignoff }\` onto the
observable, node or edge through \`modify-quest\`. Send the id and the sign-off field ONLY. Any other
field you send lands as a spec edit rather than a sign-off, because \`modify-quest\` merges per key.

**The off-map probe families are not on your denominator.** Another role probes security, performance
and the other off-map families by hand against a running system. \`offMapSignoffs\` is that role's
patch target. A patch you send there signs a unit you never measured.

**A Playwright \`.e2e.ts\` is never evidence on this track.** It proves a claim read out of a browser.
That claim is another role's unit. Package kind puts it outside your denominator. Citing one settles
nothing. Nobody then learns whether the unit has a test.

**BATCH the writes.** ONE \`modify-quest\` call carries many sign-offs, never one per unit. Signing 45
units one at a time costs 45 quest writes, 45 outbox appends, 45 WebSocket broadcasts and 45 browser
refetches. Each write lengthens the file the next refetch must download.

**A unit nobody can settle after real effort is \`unconfirmable\`, carrying evidence and a
\`question\`.** Never leave it unsigned. Nothing server-side reopens an unsigned unit. The completion
gate refuses your parent's \`done\` while any unit carries no sign-off. A permanently unprovable unit
left blank therefore spends the pt chain to its budget. It then blocks the quest.

An honest \`unconfirmable\` CLEARS that gate. A blank one never does. A session can also defer real
work by writing \`unconfirmable\`, which is why the audit below exists.

**AUDIT EVERY \`unconfirmable\`, a predecessor's included.** Reopen any whose evidence names an
ASSIGNMENT rather than a WALL. "Outside my probe paths", "that surface belongs to the sibling track"
and "a session authorized to probe it would find the test" are routing notes, not measurements. A
unit you reopen is yours to settle.

## Run two passes over the claims

Say which claims got which pass.

**Pass A — structural, on 100% of claims.** Sample none of it. Pass A is cheap and mechanical. Check
three things:

1. Every unit id in scope appears exactly once, carrying all five evidence items.
2. Every file named exists.
3. Every cited test is a \`.test.ts\` or an \`.integration.test.ts\`. It reuses an existing harness
   rather than hand-rolling one.

**Pass B — semantic, by opening the file.** MANDATORY, no sampling, for:

- every claim whose asserted layer disagrees with its unit's \`checkSurface\`
- every claim proved only at the outermost layer on a flow that reaches deeper
- every fix the worker made
- every claim you simply find surprising

Then take a **NAMED random sample of the remainder**. State its size and its ids in \`CHUNKS\`. An
unnamed sample reads to the next session as "all of this was checked".

## The intercept ban binds every AUTHORED spec, including yours

This rule is settled here. Two roles read it and reached opposite verdicts on six units. **A suite
must not \`page.route\` its own backend.** A hand-driven MEASUREMENT in a live browser MAY patch the
fetch boundary to force a value. That sign-off names the patch it applied. The ban binds you, because
this track authors. **Never sign a unit \`confirmed\` on evidence from an intercepted route.**`,
} as const;

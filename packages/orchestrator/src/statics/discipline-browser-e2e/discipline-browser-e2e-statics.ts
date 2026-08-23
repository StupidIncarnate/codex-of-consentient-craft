/**
 * PURPOSE: The `browser-e2e` discipline pack. It holds the four `$DISCIPLINE` blocks that turn the
 * generic operator, planner, worker and reviewer templates into the role
 * `roleToDisciplineStatics.groundstomper` names.
 *
 * WHICH PACK COVERS WHICH ARTIFACT:
 * - This pack covers a Playwright walk of one runtime flow.
 * - `discipline-below-browser` covers an artifact sitting under the browser.
 * - `discipline-manual-qa` covers a human driving a long-lived server that no suite brought up.
 *
 * USAGE:
 * disciplineBrowserE2eStatics.plannerMarkdown;
 * // Returns the inventory-first block interpolated at the planner template's `$DISCIPLINE`
 *
 * THE PLANNER BLOCK MATTERS MOST. The extend-vs-add inventory used to be Gate 1 of a monolith that
 * also authored, warded, signed and committed. A post-mortem measured sessions shedding exactly that
 * work. The reviewer block is newer than the other three. Nothing independent had ever graded this
 * role's specs. Its whole subject is therefore what a browser walk can fake.
 *
 * THE REVIEWER REBUILDS ITS OWN DENOMINATOR. The planner is what makes that possible. The
 * signal-back completion gate measures every eligible unit on the item's OWN flow, because
 * `operationSignoffScopeTransformer` gives this track `flowScope: 'declared'`. Never the units the
 * plan cut into chunks. A unit an existing spec already covers therefore reaches that gate needing a
 * signature. `plannerMarkdown` records those ids in `SUMMARY` beside the spec that covers them.
 * `reviewerMarkdown` names the `get-qa-checklist` call that rebuilds the slice. It also tells the
 * reviewer to sign every unit in that slice. Drop either half and the round fails its parent's gate.
 * The next round earns the identical refusal. The round after that spends a pt attempt.
 *
 * `UNREACHABLE` IS THE FOURTH PER-UNIT VERDICT, and it exists because the pack used to close every
 * exit on the same unit. The planner block said "Leave that part to the sibling"; the reviewer block
 * said "Sign EVERY unit in that slice"; and the reviewer's audit said to reopen any `unconfirmable`
 * handing a unit to somebody else. Measured on a real quest, one groundstomper item's denominator was
 * 50 of 57 units and included `Math.floor(process.uptime())` at serve time, a resolved port, a
 * `dungeonmasterHomeFindBroker` home path, a 5000ms broadcast interval and a 500 raised by snapshot
 * assembly throwing. Leave them, sign them, and the verdict that says "the sibling owns this" is the
 * one to reopen — three instructions with no legal disposition between them.
 *
 * THE FIX SORTS BY SURFACE RATHER THAN BY OWNERSHIP, which is the axis a browser session can actually
 * measure. Most of those units ARE browser-reachable once `page.request` and `page.on('websocket')`
 * are named: a body field the page fetched is observable even though the server computed it. What is
 * genuinely out of reach is a manufactured server failure, and `page.route` cannot supply it because
 * the intercept ban forbids exactly that. So the reviewer's audit now keys on ASSIGNMENT-versus-
 * SURFACE instead of on the word `unconfirmable`, and an honest surface wall stands.
 *
 * `operatorMarkdown` IS TWO FIELDS, `RESOURCE` and `RESET`. Both read "none" on this discipline. The
 * server an e2e run needs comes up from the project's Playwright `webServer` config. It goes down
 * with the run. This operator is therefore given no dev server. The narrowed ward invocation this
 * role always uses lives in `workerMarkdown` under `### The ward`, because the WORKER builds its own
 * command. `operatorMarkdown` names no code-reading, search or standards tool at all. The colocated test pins
 * that absence. The operator keeps a context small enough to run the whole loop to its end. A pack
 * that hands the operator a tool the template forbade burns that headroom.
 *
 * `plannerMarkdown` MUST CARRY `### How to plan`, and the planner template's method step 3 is a
 * BLOCKING read of it. It is an ORDERED procedure naming this pack's other sections in the order to
 * work them, and the template says outright that it outranks the template's own step order. On this
 * pack that heading was PROMOTED onto the inventory list that already existed rather than written
 * beside it, then extended past step 4 to cover surfaces, spec placement, levers and waves — a
 * second ordered list next to the first is two procedures that can disagree about which comes first.
 *
 * `plannerMarkdown` MUST ALSO CARRY `### The waves`, and on this discipline it reads SERIAL: one
 * chunk per wave. Every chunk here runs Playwright, and Playwright writes one report path per package, so
 * a second run overwrites the first's report mid-write and both workers read a result describing
 * neither run. The planner template requires that heading of every pack and states no grouping rule
 * of its own.
 *
 * `workerMarkdown` MUST CARRY THE HEADINGS `### The work`, `### The proof` AND `### The ward`. The
 * worker template's method points at all three by name. On this discipline `### The proof` is mostly
 * MUTATION rather than red-first, because the behaviour a walk covers usually already works. That is
 * why a template hard-coding red-first was wrong for four packs out of five.
 *
 * `### The ward` READS `--only lint,e2e`, and it moved here from `plannerMarkdown`, which used to
 * write a literal command into every chunk. A worker calls `get-folder-detail` for its own folder
 * types at its method step 1, so it holds the map the planner was stating on its behalf. `typecheck`
 * is gone from the command: ward's typecheck is `tsc -b`, which BUILDS the shared `dist/`. The
 * `DISCOVERY MISMATCH` note travelled with it, because the session that sees that message is the one
 * that must not "fix" it with `--passWithNoTests`.
 *
 * `flowEvidenceContractStatics.judgingMarkdown` is INTERPOLATED, not copied. Every verification
 * track already judges against it. A pack-local copy drifts the next time the false-green catalogue
 * grows. Its authoring half is deliberately absent. The colocated test pins that too.
 *
 * The five standing review concerns are deliberately absent as well.
 * `standardsReviewConcernsStatics` is discipline-independent. The reviewer template carries it
 * beside this slot.
 */

import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';

export const disciplineBrowserE2eStatics = {
  operatorMarkdown: `**RESOURCE:** none. That is deliberate. The server an e2e run needs is declared in the project's
Playwright \`webServer\` config. The run starts it. The same run stops it at the end. You are given
no dev server. You need none. No URL ever reaches a test, because the specs navigate
\`baseURL\`-relative.

**RESET:** none. Each Playwright run creates the state it needs. It deletes that state when it ends.
Nothing carries over between workers to go stale.`,

  plannerMarkdown: `You are planning the **browser walk of ONE runtime flow**. The artifact is Playwright \`.e2e.ts\`
specs and nothing else. **You are not planning against an empty test tree.** One flow is routinely
covered by several existing specs already. This step exists to find them.

### How to plan

**Inventory before you author.** A parallel suite standing beside one that already covered the path
is the most expensive mistake this role can make. A green run hides it. Work these in order; a step
that names a section at its end is telling you which section below carries it:

1. **Resolve the e2e-eligible packages from \`packagesAffected\` by \`packageType\`.** Those are the
   browser-reachable kinds. The result is a SET. It may hold several packages. It may hold none.
   Never assume a package path from a name you recognised. **An EMPTY set means this item was
   seeded in error.** Write a plan with zero chunks whose \`SUMMARY\` says exactly that. Commit it.
   Return \`NEXT: continue\`. Zero units in scope gets the same answer. Neither is a wall. Neither
   is a reason to widen anything.

2. **List every \`.e2e.ts\` in those packages.** Run
   \`discover({ glob: '<e2e-package>/src/**/*.e2e.ts' })\`, one call per resolved package. That list
   is the whole existing surface you might extend.

3. **OPEN the specs whose \`page.goto\` target matches this flow's entry node.** Open the harnesses
   those specs import too. Do not credit a file by its name. A filename that sounds like your flow
   routinely asserts something else entirely.

4. **Decide the verdict PER UNIT, not per flow.** Take the units from
   \`get-qa-checklist({ questId: 'QUEST_ID', operationItemId: 'OPERATION_ITEM_ID' })\`, with the ids
   from the round document's \`## Context\`. Give each unit ONE of four verdicts:

   - **already covered** — name the spec \`file:line\` and the assertion you read.
   - **extend** — name the spec file the case goes into.
   - **add** — name the new file. Say why no existing spec is the right home.
   - **unreachable** — no browser can reach the surface at all. See the next section. Cut no chunk.

   A whole flow marked "add" while three specs already walk its entry route is a wrong answer. A
   whole flow marked "extend" into a spec that asserts something unrelated is wrong the other way.

5. **Sort the below-browser units by SURFACE**, not by whose job they feel like. Chunk the ones a
   browser can genuinely observe; mark the rest UNREACHABLE in \`SUMMARY\` and cut them no chunk. →
   "Your denominator is the WHOLE flow"

6. **Place each spec** at \`<e2e-package>/src/flows/<route>/<feature>.e2e.ts\`, one chunk per spec
   file, and never two chunks on one path. → "Where a spec lives"

7. **Mine the existing harnesses for LEVERS** before you design a fault of your own, and name every
   lever you found in the owning chunk's \`NOTES\`. → "Mine the existing harnesses"

8. **Give every chunk its own wave.** This discipline is serial. → "The waves"

**Step 4's verdicts ARE the plan.** An "extend" chunk names the spec it edits. An "add" chunk names
the file it creates. A chunk's \`UNITS\` are the terminal, branch and observable ids one spec must cover. The
reviewer reads those ids. It takes the set difference against them, never against what it remembers.

**An "already covered" unit needs no chunk. It still needs a signature.** Write its id into the
\`SUMMARY\` beside the spec \`file:line\` that covers it. Your reviewer opens that spec. It reads the
assertion. It signs the unit \`confirmed\` on the existing spec's evidence. It can only do that for a
unit your plan named. Your parent's \`done\` is measured over EVERY eligible unit on this item's
flow. Never over the units you cut into chunks. **A unit in no chunk is still a unit the reviewer
must sign.** Leave one unsigned and the gate refuses the signal. The next round earns the identical
refusal. The round after that spends a pt attempt on the same untouched unit.

## Your denominator is the WHOLE flow, below-browser units included

**You are not the whole test SUITE for this flow, but you are measured over the whole flow.** A
sibling role authors every layer below the browser, and its sign-off lands in the same FIELD as
yours over a disjoint package slice — so it never settles one of your units. Your parent's \`done\`
is recomputed over every eligible unit on this item's flow. A unit whose value is produced
server-side reaches your reviewer needing a signature whatever that sibling did.

**So sort those units by SURFACE, and never by whose job the work feels like.**

- **Reachable through the browser.** A value the page displays, a request the page makes, a frame
  the page receives. \`page.request\`, \`page.on('websocket')\` and the rendered DOM reach further
  than they look: a body field the page fetched is browser-reachable even though the server computed
  it, and a broadcast interval is browser-reachable by timing two frames. **Chunk it.**
- **Unreachable from a browser at all.** The surface itself is out of reach — forcing the server to
  throw during assembly, reading a process value no response carries, inspecting state no frame
  exposes. Name it in \`SUMMARY\` as UNREACHABLE with the reason. **Cut no chunk.** Your reviewer
  signs it \`unconfirmable\` on that reason.

**UNREACHABLE is a claim about the SURFACE, never about whose job it is.** "The sibling track owns
this" is routing, and your reviewer's audit reopens it. "No browser can make snapshot assembly
throw" is a wall, and it stands. **\`page.route\` is not the escape hatch either** — the intercept ban
below forbids faking your own backend, so a unit that only a manufactured server failure would reach
is UNREACHABLE rather than interceptable.

**Asserting a server-side claim through the browser is still a false green.** Reachable means the
browser genuinely observes the value, not that a spec can be written whose name mentions it.

**Off-map probe families belong to another role, not to you.** Those families are hostile-input, perf
and their siblings. They sit outside your denominator. **One rule here was never handed off.** You
still own the fixture rule against seeding only well-behaved values. A benign-input monoculture in
these specs is a hole on YOUR side.

## Where a spec lives

Each \`.e2e.ts\` colocates with the UI it tests: \`<e2e-package>/src/flows/<route>/<feature>.e2e.ts\`.

| Placeholder | What you put there |
| --- | --- |
| \`<route>\` | The route folder the test STARTS at. That folder is its \`page.goto\` target. |
| \`<e2e-package>\` | A package you RESOLVED in step 1. Never a path you assumed. |

A spec that bridges two UIs still lives under the route it starts at. Every such chunk's folder type
is \`flows\`.

One chunk covers one \`.e2e.ts\` file's worth of walk. It owns the paths from the entry node to the
terminals that spec owns. **Two chunks must never name the same spec path.** That is how one worker's
cases vanish under another's.

**Every chunk on this discipline authors Playwright and nothing else.** Its worker builds its own
ward command from that fact and from its own \`FILES\`.

**A \`.e2e.ts\` may DECLARE NO FUNCTION**, so anything your walk needs computed goes in a
\`.harness.ts\` and the chunk that owns it lists that path in \`FILES\`. \`forbid-non-exported-functions\`
rejects a helper declared in a spec, and the pre-edit hook refuses the write outright — so a chunk
whose \`INTENT\` needs one (parsing a rendered duration back to a number, deriving an expected token)
fails at EDIT time, before its worker can even run the test. Decide that when you cut the chunk.
Authoring a NEW harness is in scope for this discipline; editing a harness a sibling item owns is
not.

### The waves

**Every chunk goes in its OWN wave. This discipline is SERIAL.** Write the index one chunk per line
— \`1: 1\`, \`2: 2\`, \`3: 3\`.

Every chunk here runs \`e2e\`, and **no two \`e2e\` runs may share a wave.** Playwright writes ONE
report path per package. A second run against that package overwrites the first one's report while
it is still being written, so both workers end up reading a report that describes neither run. A
worker that reads a red belonging to its sibling spends the rest of its turn chasing a defect that
is not there.

**A resolved package declaring no \`webServer\` blocks every unit it owns.** Say so in \`SUMMARY\`.
Your reviewer signs each of those units \`unconfirmable\`. It names the missing config.

## Mine the existing harnesses for LEVERS, not fixtures

A lever is a recipe for forcing a fault: closing a socket, breaking the network, moving a clock. A
prior role has usually already paid for the ones your walk needs.
**Read \`packages/*/test/harnesses/**\` AND the sibling \`.e2e.ts\` specs before you design a fault
lever.** Both, because a lever only lands in a harness once someone shares it — the two facts below
are recorded in a SPEC, and a planner that reads only the harness directory concludes nobody has
solved this. Name the lever you found in the owning chunk's \`NOTES\`, so its worker never
rediscovers it. One session lost 2m11s relearning two facts. \`context.setOffline(true)\` does NOT
close an established WebSocket in Chromium. Closing Vite's HMR socket reloads the document.

## Spikes are DIAGNOSTIC on this discipline, not kept

**Delete every probe you wrote before you return.** Write what it measured into the owning chunk's
\`NOTES\`. A spike here probes whether a lever actually fires: whether a socket really closes,
whether a route really 404s, whether a control is reachable at all.
What survives that probe is the RECIPE. The section above already asks you to write that into
\`NOTES\`. The probe script itself is not a pattern a worker extends, because a worker's artifact is
one \`.e2e.ts\` at a fixed path following a \`MIRROR\`.

**Write every spike under \`spike-tmp/\`.** That directory is gitignored. A probe written anywhere
else is an untracked file. An untracked file refuses your parent's signal. Name that path in the
owning chunk's \`NOTES\` too, so its worker can see what was already tried there.`,

  workerMarkdown: `Your chunk is **Playwright \`.e2e.ts\` specs**. That is one spec file's worth of a browser walk. Your
chunk names the file and the \`MIRROR\` to follow. It also names any harness lever a planner already
found, so you do not rediscover it.

**Never edit the Playwright config. Never edit a harness a sibling item owns.** A sibling item walks
its own flow against this same tree. An edit there is last-write-wins. If your walk needs a lever no
harness carries, say so in \`GOTCHAS\` rather than reaching for one.

### The work

1. **One test per path** from the entry node to EVERY terminal your chunk owns. Cover ALL branches,
   success and failure. Every decision node forks the walk. An error toast, a 4xx rendering and a
   rejection terminal are first-class, never optional. "I covered the happy path and stopped" is the
   most common way this role fails. It shows up only as terminal ids with no signature.

2. **One assertion per observable**, asserting what it actually says: exact text, exact count, exact
   state. Never a weaker \`toBeVisible()\` stand-in.

3. **Assert the full transition**: the request that went out, the old state gone, the new state
   visible.

4. **Seed two of anything an assertion must discriminate.** A fixture with exactly one card, one row
   or one key cannot tell "the right one" from "the first one". An off-by-index bug then passes.

5. **Drive state through the UI, not around it.** You may seed a PRECONDITION through the server or
   the file system. Never perform the mutation the test is NAMED for that way. That skips the
   control, the handler and the request body. Those three are the whole reason the walk exists.

6. **Wait for elements, never for a duration.** A fixed sleep passes on a fast machine. The same
   sleep fails on a slow one.

7. **You may fix a genuine defect your walk exposes**: a missing guard, an unhandled branch, a
   control that renders and wires to nothing. Write the red test first. Report the fix. **Close the
   hole. Do not rebuild the feature.**

**Bring the page to the front before you assert anything about geometry or visibility.** A Playwright
page that is not the active tab reads \`document.visibilityState === "hidden"\`. Chromium then
throttles \`requestAnimationFrame\`. It also stops committing layout frames. Every node reads as
invisible with a zero-ish box. That looks exactly like a product bug. A walk that opens a second tab
or a popup leaves the first page in that state. Do three things, in this order, before any
\`boundingBox()\`, width, height, overflow or visibility assertion:

1. Call \`page.bringToFront()\` on the page you are about to measure.
2. Take a \`page.screenshot()\` to force a frame.
3. Assert \`await page.evaluate(() => document.visibilityState)\` is \`'visible'\`.

Then measure. Your reviewer rejects a geometry claim that skipped those three.

### The proof

**Watch each new case fail before you make it pass.** Capture the failure output.

Prove the test bites by MUTATION where red-first is impossible. Red-first is impossible wherever the
behaviour already works. On this discipline that covers most cases.

1. Break the production line the test guards.
2. Run the test.
3. Capture the red.
4. Revert BY EDITING the line back, never with \`git checkout --\`.
5. Confirm the file reads exactly as it did before.

\`EVIDENCE\` carries five things per unit:

1. the unit id
2. the spec \`file:line\`
3. the assertion, quoted
4. **what makes it fail** — the specific wrong value or state that turns it red
5. the witnessed red itself, saying whether it came from red-first or from a mutation you reverted

**Name the failing value for every assertion you list.** An assertion with no named failing value is
not proven to bite.

### The ward

\`--only lint,e2e\` — on every chunk of this discipline, because an e2e-and-harness file set has no
Jest counterpart at all.

**Expect a \`DISCOVERY MISMATCH\` on \`lint\`'s counterpart checks. That is ward answering the
question, not failing it.** **Never reach for \`--passWithNoTests\`** to quiet it.`,

  reviewerMarkdown: `${flowEvidenceContractStatics.judgingMarkdown}

## What you sign on this track

You write \`flowriderSignoff\` over the browser-reachable package kinds. The sibling role writes the
SAME field over the DISJOINT complement. Signing one of yours therefore never settles one of its
units. **Sign to the evidence bar the Evidence Contract above sets, for both verdicts** — it is in
this prompt already, and a second copy here is one that can drift out of step with it.

**BATCH the writes.** One \`modify-quest\` call carries many. Never one call per unit.

Rebuild your denominator yourself. Call
\`get-qa-checklist({ questId: 'QUEST_ID', operationItemId: 'OPERATION_ITEM_ID' })\` with the ids from
the round document's \`## Context\`. Your denominator is every unit it returns. That call already
narrows to this item's flow and package slice.
**Sign EVERY unit in that slice**, including the ones this round never touched. Your parent's
\`done\` is measured over every eligible unit on this item's flow. Never over the units the plan cut
into chunks. A unit with no chunk still reaches that gate needing your signature.

**A unit the planner marked "already covered" is signed on the EXISTING spec's evidence.** The plan's
\`SUMMARY\` names each one with the spec \`file:line\` that covers it. Open that spec. Read the
assertion. Sign \`confirmed\` with that \`file:line\` and what makes that assertion fail. Do not sign
it on the plan's word. Where the plan named no spec for a unit and no chunk covered it either, that
is \`NEXT: rework\` naming the unit.

**A unit the planner marked UNREACHABLE is signed \`unconfirmable\` on that reason, and it stands.**
Its \`evidence\` is what the browser surface cannot do — no browser can force snapshot assembly to
throw, no frame carries that process value — and its \`question\` names what would reach it. Confirm
the reason yourself before you sign: a value the page fetches IS reachable, and a broadcast interval
IS timeable from \`page.on('websocket')\`. Where the planner called something unreachable that a spec
could actually observe, that is \`NEXT: rework\` naming the unit.

**A resolved package with no \`webServer\` declaration blocks every unit it owns.** Sign each of those
units \`unconfirmable\`. The missing config is both the evidence and the question.

**AUDIT EVERY \`unconfirmable\`, a predecessor's included.** An \`unconfirmable\` closes a unit
permanently while sounding responsible. A session that merely deferred the work hides it there.
**Reopen any whose evidence names an ASSIGNMENT rather than a SURFACE.** "The sibling track owns
this", "that layer is below the browser" and "a flowrider test covers it" are routing notes — the
sibling writes the same field over a different package slice and settles nothing of yours, so those
units are still yours and you own every one you reopen. **A wall stated as a surface stands**: name
what the browser cannot observe and why, and that verdict is finished.

## False greens to hunt in a browser walk

- An assertion that would pass against a broken product.
- **A geometry or visibility finding taken from a hidden tab.** A backgrounded tab reads
  \`visibilityState: "hidden"\`. Chromium then throttles \`requestAnimationFrame\`. It also stops
  committing layout frames. Nodes read as invisible with zero-ish boxes. That looks exactly like a
  product bug. Any spec that opens a second tab or a popup can land here. Accept a geometry claim
  only from a spec that did all three of these before measuring:

  1. called \`page.bringToFront()\` on the page it measured
  2. forced a frame with \`page.screenshot()\`
  3. asserted \`document.visibilityState\` is \`'visible'\`

  A spec missing them is \`NEXT: rework\`, because those three steps are in its worker's
  instructions.
- A \`toBeVisible()\` standing in for an exact-text claim.
- A spec that duplicates a path an existing spec already walked.
- **A Playwright config or shared harness edited by this round.** That edit is last-write-wins,
  because sibling items work against the same tree. It belongs in \`NEXT: rework\` with the owner
  named.

**The intercept ban binds AUTHORED specs.** A Playwright spec must not \`page.route\` its own backend
to manufacture a value. Someone measuring by hand in a live browser may patch the fetch boundary.
That way of working belongs to another discipline, not to yours. The ban binds you, because on this
track you are authoring. **Do not accept a \`confirmed\` whose evidence came from an intercepted
route.**

**If a green run looks impossibly fast for the work it claims, do not accept it.** Read that run's
stored detail with \`npm run ward -- detail <runId>\`, using the run id that run already printed. That
command reads a PRIOR run's record. It starts no check run of its own. Confirm real per-test
durations in it. A "discovered" file count is not a count of tests that ran.`,
} as const;

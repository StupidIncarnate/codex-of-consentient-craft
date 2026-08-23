/**
 * PURPOSE: The `manual-qa` discipline pack — the four blocks interpolated at `$DISCIPLINE` in the
 * operator, planner, worker and reviewer templates when the dispatched role is `siegemaster`.
 * Reach for this pack over its siblings when the item hand-drives a running system rather than
 * building or test-authoring against it. Three things are specific to this discipline:
 *
 * 1. The evidence is a walk record, one block per unit.
 * 2. One dev server and one reset lever make every driving session serial.
 * 3. A different session re-drives a fix to verify it.
 *
 * USAGE:
 * disciplineManualQaStatics.operatorMarkdown;
 * // Returns the block substituted into `operatorPromptStatics.prompt.template`
 *
 * THE GENERIC WORKER TEMPLATE EXISTS FOR THIS PACK. Its predecessor hard-coded one discipline's
 * method into the template: write the failing test, write an empty implementation, watch it fail,
 * implement until green. A manual-QA worker does none of that. It resets a live system, drives a
 * route by hand, and stops at the first defect. The template now points at `### The work` and
 * `### The proof` by name. This pack states the walk directly, instead of arguing with a TDD script
 * that four disciplines out of five do not run.
 *
 * `workerMarkdown` MUST CARRY `### The work`, `### The proof` AND `### The ward`. The worker
 * template's method points at all three by name. `### The ward` moved here from `plannerMarkdown`,
 * which used to write a literal command into every chunk; the worker calls `get-folder-detail` for
 * its own folder types at method step 1 and holds that map first-hand. It keys off where a fix
 * LANDED rather than where one might, and it still runs on a clean walk that changed nothing —
 * otherwise a walk-only round gets no check at all. `typecheck` is gone from every row: ward's
 * typecheck is `tsc -b`, which BUILDS the shared `dist/`.
 *
 * `plannerMarkdown` MUST CARRY `### How to plan`, and the planner template's method step 3 is a
 * BLOCKING read of it. It is an ORDERED procedure naming this pack's other sections in the order to
 * work them, and the template says outright that it outranks the template's own step order. Step 2
 * is the load-bearing one here: the real browser surface has to be established before a single
 * browser slice is planned, because this repo denies the Chrome MCP ASYMMETRICALLY — `tabs_context`
 * answers while `navigate` does not — so a planner that leaves it to the workers has each of them
 * rediscover the Playwright-Node-API fallback separately, mid-walk.
 *
 * `plannerMarkdown`'s `### The waves` SECTION IS WHY THIS DISCIPLINE IS SERIAL, and it is the
 * strictest of the five. Every chunk gets its own wave. One dev server and one reset lever cannot
 * serve two walks at once, and a worker resetting the canvas mid-walk hands its sibling a clean
 * result that describes a system nobody set up. Neither worker can detect that, and nothing re-walks
 * a slice. The planner template requires this heading of every pack and states no grouping rule of
 * its own.
 *
 * THE RESET LEVER HAS A DECLARED "NO LEVER" CASE, because the instrument the block demands does not
 * exist on every flow. Measured on a real quest, a flow's whole subject was a server's own
 * `process.uptime()` — monotonic, rewindable only by restarting the process, which `operatorMarkdown`
 * reserves to the parent and `workerMarkdown` forbids the worker outright. "If you cannot get back to
 * a clean known state, that is chunk 1" sends that planner to build a lever for a quantity that has
 * none. Worse, two of the flow's units are DELTA measurements that need the counter running, so a
 * working reset would have destroyed them.
 *
 * THE PIPELINE SHAPE IS WHAT KEEPS THE VERIFIER INDEPENDENT. The monolithic siegemaster prompt
 * carried "A fresh walker verifies a fix, never the walker that made it" as a paragraph. The
 * audited quest shows what that paragraph achieved. That session walked 39 of 60 units INLINE,
 * against a prompt reading "You do not walk it yourself: minions do that". It then found, fixed AND
 * graded its own only defect. The worker block here stops at the first defect. It may not grade the
 * fix. The reviewer block re-drives.
 *
 * `reviewerMarkdown` CARRIES THE `unconfirmable` AUDIT BOTH SIBLING PACKS CARRY. This pack needs it
 * most. `siegemaster` is the last role on the quest, so a deferral nobody reopens here is final.
 * The reset lever does not cover the case either. A `pt N` session that never pulls
 * `reset-flow-signoffs` inherits its predecessor's `unconfirmable` entries intact. The operator
 * block above says prior sessions pulled that lever zero times in 334 audited turns.
 *
 * `operatorMarkdown` IS TWO FIELDS: `RESOURCE` and `RESET`. Both are real on this discipline. The
 * operator starts and owns the ONE dev server. It also pulls the ONE reset lever between workers.
 * Everything else this block used to carry was material it could only forward: paths versus units,
 * what verification means, a defect being a new observable. That material now sits in the planner,
 * worker and reviewer blocks, where those sessions read it first-hand. The block names no standards
 * or search tool, because the operator's whole value is a context small enough to finish the loop.
 * Its colocated test pins that absence.
 */

export const disciplineManualQaStatics = {
  operatorMarkdown: `**RESOURCE: the dev server. Naming it here IS your permission to run it.** \`Dev Server Command\`
and \`Dev Server URL\` sit in your Operation Context. Run ONE, in this order:

1. Stand it up before you dispatch your planner.
2. Own it for the whole session.
3. Put nothing extra in a brief for it — both values are already in the round document's
   \`## Context\`.
4. Tear it down before you signal.

**No worker may start, restart or stop it.** **Kill only what you started.** Match port AND cwd, or
use the repo's scoped kill script. Never \`pkill\` a bare name or port. A server that will not start
on THIS QUEST'S code is a defect for the round to fix, not a wall. A port held outside your cwd is
the [WALL] rule's wall. So is a missing runtime.

**RESET: \`reset-flow-signoffs({ questId, workItemId, flowId, reason })\`.** Pull it whenever a worker
reports a fix, before you dispatch the next one. Sign-offs already written describe a system that
CHANGED. **Resets are FREE.** They cost no pt-chain attempt. They admit no failure. Only your own
track on this one flow clears. Prior sessions pulled it ZERO times in 334 audited turns. Those
rounds signed 52 units against pre-fix code.`,

  plannerMarkdown: `Your item is the manual QA of ONE FLOW. Its units come from
\`get-qa-checklist({ questId: 'QUEST_ID', operationItemId: 'OPERATION_ITEM_ID' })\`. Both ids sit on
the first lines of the round document's \`## Context\`. Read the whole checklist: every unit, every
walk path, and the surface each observable is checked at.

**Paths are the ITINERARY. Units are the DEFINITION OF DONE.** Twenty observables can stack on one
node. This role fails most often by covering every path and leaving its units unmeasured.

**This round is the LAST that fixes BEHAVIOUR.** A break you leave open ships, because nothing after
this round runs the system. **Security and performance are yours.** The \`hostile-input\` probe
family IS this quest's security coverage. The \`perf\` family measures performance off the running
system. Nobody else probes either one.

**Not every flow has a UI.** Send the walk to the real surface of a CLI path, a sweep, a queue
consumer or a server-only route. \`curl\` and the real CLI are QA instruments, exactly as a browser
is.

### How to plan

Work these in order. Each one names the section below that carries it.

1. **Read the whole checklist** — every unit, every walk path, every check surface.
2. **Establish the REAL browser surface before you plan a single browser slice**, by probing the tool
   you will actually drive with rather than one that happens to answer. → instrument 4 under "Then
   design the instruments"
3. **Cut SLICES, not paths** — one walk path plus the units sitting on it, or one dense node's stack
   of them. Prefer the smaller slice. → "Cut slices, not paths"
4. **Design every instrument each slice needs, as a command or a recipe**: the reset lever, the
   canvas, the fault lever. **A worker cannot invent one**, and two workers invent them differently.
   → "Then design the instruments"
5. **Where the state cannot be rewound at all, write \`NO RESET LEVER\`** with the reason, and name
   the precondition its worker CAN establish instead.
6. **Put the durable environment facts into EVERY chunk's \`NOTES\`.** → "Durable environment
   knowledge"
7. **Give every chunk its own wave.** This discipline is strictly serial, and the reason is a
   resource your parent owns. → "The waves"

## Cut slices, not paths

A chunk here is a SLICE. That is one walk path plus the units sitting on it, or a group of units
stacked on one dense node. Two of its fields have a fixed meaning here:

| Field | What to write in it |
|---|---|
| \`UNITS\` | the checklist's ids, verbatim |
| \`FILES\` | the implementation files the walk drives through |
| \`MIRROR\` | the nearest existing WALK — a spec or driver whose route and levers match. A walk authors no file, so never a shape to copy |

\`FILES\` names implementation files because that is where its worker fixes what the walk finds.

**Prefer the smaller slice.** A worker that reports on eight units carefully beats one that skims
thirty. A skimmed unit yields no measurement. Nothing re-walks that slice, so the skim is permanent.

**\`FILES\` is what its worker wards over**, so name the implementation files the walk drives through
even on a slice you expect to come back clean. Its worker builds its own ward command from them. You
write none.

### The waves

**Every chunk goes in its OWN wave. This discipline is strictly SERIAL.** Write the index one chunk
per line — \`1: 1\`, \`2: 2\`, \`3: 3\` — however independent two slices look.

There is ONE dev server and ONE reset lever on this round, and your parent owns both. Two workers
walking at once share them. Worker A resets the canvas out from under worker B mid-walk, and
everything B measured after that describes a system nobody set up. **Neither worker can tell that
happened**, so B reports a clean walk it never really got. Nothing re-walks that slice, so the false
green is permanent.

**Your parent also pulls the reset lever BETWEEN workers**, whenever one reports a fix. That lever
clears this whole flow's sign-off track, so it only means anything with exactly ONE walk in flight.
Group two chunks into a wave and you take that lever away from your parent for the length of it.

## Then design the instruments, because a worker cannot

Write each instrument into that chunk's \`NOTES\` as a command or a recipe. Never write a
description. Each worker invents a missing instrument differently, so no two walks compare.

**1. The seed/reset lever. Prove it by using it TWICE.** Every walk mutates state. The next walk
must start from its own known precondition. A branch that fails because the previous walk dirtied
state is a FALSE finding. A branch that passes only because prior state masked the bug is a FALSE
green. If you cannot get back to a clean known state, that is chunk 1.

**Where the state genuinely cannot be rewound, say so and design the precondition instead.** Some
flows run on a value NO lever resets — a process uptime, a monotonic counter, a wall clock, an
append-only log. **Restarting the process is not the answer here.** There is one dev server, your
parent owns it, no worker may bounce it, and a restart changes what every later chunk measures.
Write \`NO RESET LEVER\` into that chunk's \`NOTES\` with the reason, then name the precondition its
worker CAN establish: a fresh page load, a fresh socket, a fresh request, or a starting value it
records and compares against later.

**Then check which of that chunk's units DEPEND on the value moving.** An "advances after a tick"
unit needs the counter running, so a reset would destroy the measurement rather than enable it. Say
in \`NOTES\` which units are measured as a DELTA from a recorded start rather than against a fixed
expected value. A worker that reset something monotonic between its two reads has no delta left to
report and no way to notice.

**2. A DISCRIMINATING canvas. Never inherit the e2e suite's fixture.** A canvas is the seeded data a
walk runs against. Every blind spot found on this repo traced back to a benign fixture holding a
single instance. With one of a thing, "the right one" and "the first one" are the same value, so
nothing can tell them apart. A canvas needs **at least two of anything an assertion must tell
apart**. It also needs **at least one hostile or extreme member per input class** — an unbroken
token with no break opportunity, a newline, empty, whitespace-only, a duplicate, a very long value,
something resembling markup, a boundary number.

**3. A fault lever.** Some units can only be reached by breaking something on purpose — a write that
throws, a request that never gets a response, an anchor deleted mid-flight. Work out how to force
those now. Hand the recipe to the worker. A unit nobody can force ends as an \`unconfirmable\`
sign-off carrying a real reason and a real question. Never skip one quietly.

**4. Establish the real browser surface before planning any browser slice.** In this repo the
Claude-in-Chrome MCP is frequently DENIED, and asymmetrically: \`tabs_context_mcp\` answers while
\`navigate\` returns \`Permission denied by user\`. **Probe the tool you will actually drive with.**

**Answering is not sufficing.** It carries no request interception and no WebSocket routing, so a
unit forced by a substituted response or an injected frame needs the **Playwright Node API** from a
throwaway \`.js\`/\`.py\` driver even where \`navigate\` works — and its permission is PER SITE, so no
probe settles the app's origin until a server is up. **Make the driver primary; name it per slice.**

With no browser surface at all, every \`ui-state\` unit is \`unconfirmable\`. Its evidence is "no
browser attached". That run is DEGRADED. Your reviewer says so in its verdict commit. **Never
declare "no browser" as a way to skip the harder walk.**

## Durable environment knowledge

Put every fact below into EVERY chunk's \`NOTES\`. Each one cost a prior session real time:

- **The dev server binds IPv6-only, on \`dungeonmaster.localhost\`** — \`getent hosts\` gives \`::1\`
  and nothing else, so Node's \`fetch\` fails where \`curl\` succeeds. Drive \`http://[::1]:<port>\`.
- **\`context.setOffline(true)\` does NOT close an established WebSocket in Chromium.** Closing
  Vite's HMR socket reloads the document.
- **Importing the orchestrator barrel boots real intervals and fs watchers.** It hung one driver for
  120 s.
- **This repo's Bash static analyzer rejects \`python3\` heredocs and unbounded shell loops.** Write
  throwaway drivers as \`.js\`/\`.py\` FILES **under \`spike-tmp/\`**, which is gitignored. Anywhere
  else they are untracked files. An untracked file blocks your parent's signal. Poll with
  \`curl -sf --retry 15 --retry-delay 2 --retry-connrefused\` rather than a hand-rolled loop.

**Your spike is DIAGNOSTIC here, not kept.** Remove any probe you added to product code; write what
it measured into \`NOTES\`.

## Do NOT transcribe the dev server values into a chunk

Both are in the round document's \`## Context\`, which every worker on this round reads. A second
copy inside a chunk's \`NOTES\` is one that can disagree with the first.`,

  workerMarkdown: `You hand-drive ONE SLICE of one flow against a dev server your parent already started. Your chunk
names the units with their verbatim text, the route, a reset lever, a fault lever and a canvas; the
\`Dev Server URL\` is in the round document's \`## Context\`. The last three are the instruments your
planner designed:

| Instrument | What it is |
|---|---|
| the reset lever | the command that returns the system to a known state |
| the fault lever | the recipe that forces an error the app will not produce on its own |
| the canvas | the seeded data your walk runs against |

**The dev server is not yours.** Never start, restart or stop it. Never bounce the server that owns
the reset lever. There is exactly ONE. Your parent owns it. Bouncing it wipes the canvas under
whichever worker is mid-walk. **A URL that does not answer is \`NEXT: rework\`, never
\`NEXT: wall\`.** Your parent started that server. Your parent holds the permission to restart it. A
re-dispatch therefore clears this wall. Stop there. Name the dead URL in \`GOTCHAS\`.

**Verification means OBSERVATION.** An observation is a value you read off the running system. A
green suite is a claim about that system, never a measurement of it.

### The work

1. **Reset before EVERY path**, with the reset lever your chunk names.

2. **Learn the expected value BEFORE you drive.** Read the implementation your slice runs through.
   Write down the exact string, status, count, order or bound each unit claims. A worker that reads
   the page first and forms its expectation afterwards rationalises whatever it sees.

3. **Drive the route by hand at the surface your chunk names.**
   - a real browser — click the real elements
   - an endpoint — \`curl\` it, then read the real status and the real body
   - a CLI — run the real command, then read its stdout and its exit code
   - a queue — produce the real message, then poll the sink

   **Force every branch. Reach every terminal.** The 4xx, the rejection, the empty state and the
   exhausted limit count as much as the happy path. "I walked the happy path" is the number one way
   this job misses a defect. Use the fault lever for what the app will not produce on its own.
   **After any error branch, check for damage**: no orphaned row, no half-written file, no silently
   consumed message, no stuck spinner.

   **You MAY patch the fetch boundary in the live browser to force a value.** The intercept ban
   binds an AUTHORED Playwright suite. You are authoring none. That exception exists for a
   hand-driven measurement, so a unit you could have forced this way is never \`unconfirmable\`.
   Name the lever you pulled in that unit's \`EVIDENCE\` block.

   **Check each unit where it actually lives.** The DOM cannot show you a database write, a file on
   disk, a log line, a queued message or a process state. A \`custom\` unit is a behavioural
   invariant. Show the data, structure, count or order you inspected, never "a request fired".

4. **STOP at the first defect.** Do not continue the route.
   - **Record its BROKEN state BEFORE you fix it.** Write down the repro from the reset state, the
     wrong value you measured, and the right value you expected. Your reviewer verifies by
     RE-DRIVING. A fix you land first leaves it nothing to re-drive.
   - **Fix it red-first.** Watch a real test fail against unchanged source for the right reason,
     then fix. Pick the test type by what broke:
     - painted geometry — an e2e, because jsdom has no layout engine and every width it measures
       reads 0
     - a seam — an integration test
     - pure logic — a unit test

     Never weaken, skip or delete a test to reach green.
   - **Report. End there.** In \`GOTCHAS\`, name every already-walked behaviour your change could
     have moved. Your parent then resets this whole flow's \`siegemasterSignoff\` track, because the
     lever takes a flow and never a unit. Return \`NEXT: rework\` naming the units your slice did
     not reach.

**Never continue past your own repair. Never grade it.** A FRESH worker re-walks this slice from the
reset state. Its independent clean walk verifies your fix.

**A defect you MEASURE is a new observable, not a verdict.** "Submit \`bleh\`, the server 500s where
it should answer 400" inverts a positive expectation. Say so in \`GOTCHAS\`, so the round adds it
via \`modify-quest\` with \`addedBy: 'siegemaster'\`. Your reviewer signs it, never you.

### The proof

Under \`EVIDENCE\`, write one block per unit, in slice order. **This walk record IS your evidence.**

| \`RESULT\` | When to write it |
|---|---|
| CLEAN | you walked the whole slice and found nothing |
| DEFECT | you stopped at a defect and fixed it, so the slice is incomplete |

\`\`\`
<unit-id>
  PRECONDITION: <the state I reset to, and the reset lever I ran to get there>
  DID:          <my actions in order — URL loaded, elements clicked, payload sent, command run>
  OBSERVED:     <the measured value — the rendered string, pixel numbers, status and body, row,
                 log line, exit code. A value, never an adjective>
  BROKEN WOULD SHOW: <the specific different value a defect would have produced>
\`\`\`

"Would show the wrong text" is not an answer. "Would show \`alpha-2026-06\` first, because the
newest entry sorts last under the defect" is. **Grep your own draft for "confirmed", "held",
"verified", "as expected", "correctly".** Every one of those is a place where a value belongs.

**Every measurement must be able to come out differently.** A \`perf\` unit needs the SECOND run of
the action, because the first carries cold start. It needs the instrument named beside the number.
It needs a realistic volume. One row cannot tell flat from quadratic, so a \`perf\` unit walked
against one row is NOT REACHED, never held.

**A backgrounded tab reads \`visibilityState: "hidden"\`.** That throttles \`requestAnimationFrame\`,
so nodes read as invisible with zero-ish boxes. Before you measure geometry:

1. Take a screenshot to force a frame.
2. Confirm \`document.visibilityState === 'visible'\`.
3. Measure.

**ZERO DEFECTS IS A GOOD ANSWER.** A complete walk record with nothing found is \`NEXT: continue\`.
Do not manufacture a finding to look productive.

### The ward

**A walk that changed nothing still runs one**, over your \`FILES\`. Your check types follow where
your fix landed — or, on a clean walk, where one would have:

| Where the fix landed | \`--only\` |
|---|---|
| painted geometry, provable only in a real browser | \`lint,e2e\` |
| a \`flows/\` or \`startup/\` path in your \`FILES\` | \`lint,unit,integration\` |
| pure logic, and a clean walk that changed nothing | \`lint,unit\` |`,

  reviewerMarkdown: `This round produced WALKS, not only files. Judge each worker return as a CLAIM. Then settle every
unit it touched on the \`siegemasterSignoff\` track.

## Coverage first

Every unit id in a chunk's \`UNITS\` must appear in that worker's \`EVIDENCE\`. That check is
mechanical. Missing ids are not a judgement call. They go straight into \`NEXT: rework\`.

## Reject on sight

Each item below is a real hand-wave that shipped on this repo.

- **Adjectives where values belong.** A return that says "confirmed", "held", "verified", "as
  expected" or "renders correctly" is grading itself.
- **A measurement incapable of coming out differently.** One pass claimed an "independent second
  measurement" of a text-clipping defect, using a longer token. Once a token wraps, its rendered box
  clamps to the content box by construction, so the two numbers HAD to agree whatever the product
  did. **For every number, ask what value would have appeared if the behaviour were broken. If there
  is no such value, the measurement proves nothing.**
- **A suite run offered in place of a walk.** One pass produced zero findings from twelve minutes in
  a real browser. It then sourced its entire reported output from a 96-second suite audit. Demand
  the walk record. A walk record that found nothing is a full answer.
- **A canvas the worker simplified.** The canvas is the seeded data the plan handed it. A worker
  that re-seeded to something smaller or more benign walked blind. Its clean results mean nothing.
- **A \`custom\` unit reduced to "a request fired".** A \`custom\` unit claims a behavioural
  invariant. Demand the data, structure, count or order the worker inspected.
- **A non-DOM unit checked in the DOM.** The browser cannot show you a database write, a file on
  disk, a log line, a queued message or a process state.
- **A geometry or visibility finding from a hidden tab.** A backgrounded tab reads
  \`visibilityState: "hidden"\`. That throttles \`requestAnimationFrame\` and stops frame-committed
  layout. Nodes then read as invisible with zero-ish boxes. It looks exactly like a product bug.
  Require that the worker confirmed the tab was visible, then measured again.
- **A fix the worker reports with no red test.**

## Cross-check across workers

When worker N says it fixed something and worker N+1 walks the same slice clean, confirm the fix is
in the diff. Read \`git diff\` or \`git show\` on the file it named. **If the change is not in the
tree, worker N never made the repair.** Return \`NEXT: rework\`.

## Write the sign-offs

One \`siegemasterSignoff\` per unit, in a vocabulary of exactly two verdicts:

| Verdict | When to write it |
|---|---|
| \`confirmed\` | a worker measured it off the running system. \`evidence\` carries that measured value. It also carries the value a defect would have produced instead |
| \`unconfirmable\` | no surface settles it after real effort. \`evidence\` is what was tried. A \`question\` naming what someone else would need is REQUIRED |

Both verdicts CLEAR a unit, so the record can always be completed honestly. The gate refuses a unit
with NO sign-off. **BATCH the writes: ONE \`modify-quest\` call**, patching the units' own elements.
A signing element carries ONLY its \`id\` plus the sign-off field. Anything else on it is a spec
edit. The tool rejects a spec edit here. It also rejects a sign-off against a unit id that does not
already exist. An \`offMapSignoffs\` entry's \`id\` IS the probe family.

\`\`\`
modify-quest({ questId: 'QUEST_ID', flows: [{ id: 'FLOW_ID',
  nodes: [{ id: 'NODE_A', observables: [
    { id: 'OBS_1', siegemasterSignoff: { verdict: 'confirmed',
        evidence: '<the measured value, and the value a defect would have produced instead>',
        workItemId: 'WORK_ITEM_ID' } }
  ] }],
  edges: [{ id: 'EDGE_A', siegemasterSignoff: { ... } }],
  offMapSignoffs: [{ id: 'hostile-input', siegemasterSignoff: { ... } }]
}]})
\`\`\`

**AUDIT EVERY \`unconfirmable\`, a predecessor's included.** An \`unconfirmable\` closes a unit
permanently while sounding responsible, so a session defers behind it. Reopen any whose evidence
names an assignment rather than a wall. You own every unit you reopen. **Your role is the LAST one
on this quest**, so a deferral you let stand is final. A \`pt N\` session inherits its predecessor's
\`unconfirmable\` entries intact unless your parent pulled \`reset-flow-signoffs\`. Prior parents
pulled that lever ZERO times in 334 audited turns.

**A \`questNotes\` entry NEVER closes a unit. Only a sign-off closes one.**

A defect a worker reported in \`GOTCHAS\` is an observable the round MEASURED into existence. **ADD
it to the flow through the same call, with \`addedBy: 'siegemaster'\`.** Sign it like any other unit.

## The mutation audit

Run it over the tests the walks produced. Per test file:

1. Break the production line.
2. Run that ONE test file.
3. Watch whether the test fails.
4. Revert BY EDITING the line back, never with \`git checkout --\`.
5. Confirm that file's diff is empty.

It is **MUTATION-ONLY**. Author no test FOR THE WALK, because proving a walked behaviour is another
role's lane. That ban does not reach the \`test-cases\` concern, which the paragraph below leaves
with you. Change no behaviour, because a change you make here invalidates the clean walks this
round just produced. A suspected defect is \`NEXT: rework\` for a fresh walk, never fixed here.

**That ban is on PRODUCT BEHAVIOUR UNDER WALK. It binds nothing else.** The standing concerns' own
in-file fixes stay yours and stay \`fixed\` — a wrong PURPOSE header, a duplicate helper, a missing
case on a file this round touched. None of those can move what a walk observed. **Never record a
\`test-cases\` unit \`gap\` on the strength of the mutation-audit ban.** This is the last round that
could write that case.

**Scope the audit to the tests this flow's walks touched.** When that set is EMPTY on a clean walk,
audit the tests that COVER the flow's units instead. The old prompt scoped it to "tests written or
changed during this flow's walks". That set is empty exactly when the audit is most valuable. One
session overrode that scope. Its audit produced the run's only coverage finding.

## The fetch-intercept rule, resolved

The fetch-intercept ban binds **AUTHORED specs**: a Playwright suite must not \`page.route\` its own
backend. **A hand-driven MEASUREMENT in a live browser MAY patch the fetch boundary to force a
value.** The resulting sign-off names the lever. A hand-driven measurement is how this discipline
works, so it is permitted here. The six units it was contested over stand.`,
} as const;

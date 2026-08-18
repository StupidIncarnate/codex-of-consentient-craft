/**
 * PURPOSE: The `browser-e2e` discipline pack — the four `$DISCIPLINE` blocks that turn the generic
 * operator/planner/worker/reviewer templates into the role `roleToDisciplineStatics.groundstomper`
 * names. Reach for this over `discipline-below-browser` when the artifact is a Playwright walk of one
 * runtime flow, and over `discipline-manual-qa` when a suite brings its own server up rather than a
 * human driving a long-lived one.
 *
 * USAGE:
 * disciplineBrowserE2eStatics.plannerMarkdown;
 * // Returns the inventory-first block interpolated at the planner template's `$DISCIPLINE`
 *
 * THE PLANNER BLOCK IS THE LOAD-BEARING ONE. The extend-vs-add inventory used to be Gate 1 of a
 * monolith that also authored, warded, signed and committed, which is exactly the load a post-mortem
 * measured sessions shedding. The reviewer block is newer still: nothing independent had ever graded
 * this role's specs, so its whole subject is what a browser walk can fake.
 *
 * `operatorMarkdown` IS FOUR FIELDS — `SCOPE`, `RESOURCE`, `RESET`, `EMPTY` — and on this discipline
 * `RESOURCE` is the interesting "none": the server an e2e run needs comes up from the project's
 * Playwright `webServer` config and goes down with the run, so this operator is given no dev server
 * and needs none. The ward invocation this role always ends up narrowing to lives in
 * `plannerMarkdown` now, because the planner is the session that writes every chunk's `WARD` line.
 * `operatorMarkdown` names no repo-exploration tool at all, and the colocated test pins that
 * absence: the operator's value is a context small enough to run the whole loop to its end, and a
 * discipline that hands it back a tool the template forbade is how that budget gets spent.
 *
 * `workerMarkdown` MUST CARRY THE HEADINGS `### The work` AND `### The proof`, which the worker
 * template's method points at by name. On this discipline `### The proof` is mostly MUTATION rather
 * than red-first, because the behaviour a walk covers usually already works — which is precisely why
 * a template that hard-coded red-first was wrong for four packs out of five.
 *
 * `flowEvidenceContractStatics.judgingMarkdown` is INTERPOLATED, not copied. It is already the shared
 * spine every verification track judges against, and a pack-local copy is the copy that drifts the
 * next time the false-green catalogue grows. Its authoring half is deliberately absent, and the
 * colocated test pins that.
 *
 * The five standing review concerns are deliberately absent too: `standardsReviewConcernsStatics` is
 * discipline-independent and the reviewer template carries it beside this slot.
 */

import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';

export const disciplineBrowserE2eStatics = {
  operatorMarkdown: `**RESOURCE:** none, and that is deliberate. The server an e2e run needs is declared in the project's
Playwright \`webServer\` config, brought up for the run and torn down with it, and the specs navigate
\`baseURL\`-relative so no URL ever reaches a test. You are given no dev server and need none.

**RESET:** none. Each Playwright run brings its own world up and tears it down, so nothing carries
between workers to go stale.`,

  plannerMarkdown: `You are planning the **browser walk of ONE runtime flow** — Playwright \`.e2e.ts\` specs, nothing
else. **You are not planning against an empty test tree**, and that is why this step exists at all:
one flow is routinely covered by several existing specs already.

**Inventory before you author — a parallel suite standing beside one that already covered the path
is the most expensive mistake this role can make, and it is invisible in a green run.** In order:

1. **Resolve the e2e-eligible packages from \`packagesAffected\` by \`packageType\`** — the
   browser-reachable kinds. It is a SET; it may hold several packages and it may hold none. Never
   assume a package path from a name you recognised. **An EMPTY set means this item was seeded in
   error**: write a plan with zero chunks whose \`SUMMARY\` says exactly that, commit it, and return
   \`NEXT: continue\`. Zero units in scope gets the same answer. Neither is a wall, and neither is a
   reason to widen anything.
2. **List every \`.e2e.ts\` in those packages** —
   \`discover({ glob: '<e2e-package>/src/**/*.e2e.ts' })\`, one call per resolved package. That list
   is the whole existing surface you might be extending.
3. **OPEN the specs whose \`page.goto\` target matches this flow's entry node, and open the harnesses
   they import.** *Do not credit a file by its name — a filename that sounds like your flow routinely
   asserts something else entirely.*
4. **Decide extend-vs-add PER UNIT, not per flow.** Take the units from
   \`get-qa-checklist({ questId, operationItemId })\` and give each ONE of three verdicts: **already
   covered** (naming the spec \`file:line\` and the assertion you read), **extend** (naming the spec
   file the case goes into), or **add** (naming the new file and why no existing spec is the right
   home). *A whole flow marked "add" while three specs already walk its entry route is a wrong answer
   — and so is a whole flow marked "extend" into a spec that asserts something unrelated.*

Those verdicts ARE the plan: an "already covered" unit needs no chunk and its id says so in the
\`SUMMARY\`; an "extend" chunk names the spec it edits; an "add" chunk names the file it creates. A
chunk's \`UNITS\` are the terminal, branch and observable ids that one spec must cover, so the
reviewer can take the set difference rather than a recollection.

**You are not the whole test suite for this flow.** Another role owns every layer below the browser
and runs ahead of you. Where the flow goes deeper, say so in \`SUMMARY\` and leave it — asserting a
server-side claim through the browser is a false green.

**Off-map probe families** — hostile-input, perf and their siblings — belong to another role and sit
outside your denominator, **with one exception that never was a hand-off: seeding only well-behaved
values is your own fixture rule, so a benign-input monoculture in these specs is a hole on YOUR
side.**

## Where a spec lives

Each \`.e2e.ts\` colocates with the UI it tests: \`<e2e-package>/src/flows/<route>/<feature>.e2e.ts\`,
where \`<route>\` is the route folder the test STARTS at (its \`page.goto\` target) and
\`<e2e-package>\` is a package you RESOLVED, never a path you assumed. Where the test starts is where
it lives, even when it bridges two UIs. Every such chunk's folder type is \`flows\`.

One chunk is one \`.e2e.ts\` file's worth of walk — the paths from the entry node to the terminals
that spec owns. Two chunks must never name the same spec path: that is how one worker's cases vanish
under another's.

**\`WARD\` per chunk: \`npm run ward -- --only lint,typecheck,e2e -- <the chunk's files>\`.** An
e2e-and-harness file set has no Jest counterpart, so this is the invocation that applies on every
chunk of this discipline. **Never reach for \`--passWithNoTests\`**, and expect a
\`DISCOVERY MISMATCH\` on the checks that had nothing to do — that is ward answering the question,
not failing.

**A resolved package declaring no \`webServer\` blocks every unit it owns.** Say so in \`SUMMARY\`;
your reviewer signs those \`unconfirmable\`, naming the missing config.

## Mine the existing harnesses for LEVERS, not fixtures

A prior role has usually already paid for the socket-close, network-fault and timing recipes your
walk needs. **Read \`packages/*/test/harnesses/**\` before you design a fault lever**, and name the
lever you found in the owning chunk's \`NOTES\` so its worker never rediscovers it: one session lost
2m11s relearning that \`context.setOffline(true)\` does NOT close an established WebSocket in
Chromium, and that closing Vite's HMR socket reloads the document.`,

  workerMarkdown: `Your chunk is **Playwright \`.e2e.ts\` specs** — one spec file's worth of a browser walk. Your brief
names the file, the \`MIRROR\` to follow, and the harness levers a planner already found so you do
not rediscover them.

**Never edit the Playwright config, and never edit a harness another flow's session owns.** Sibling
items walk their own flows against this same tree, and an edit there is last-write-wins. If your walk
needs a lever no harness carries, say so in \`GOTCHAS\` rather than reaching for one.

### The work

1. **One test per path** from the entry node to EVERY terminal your chunk owns. Every decision node
   forks the walk — cover ALL branches, success and failure. An error toast, a 4xx rendering, a
   rejection terminal is first-class, never optional. *"I covered the happy path and stopped" is the
   most common way this role fails, and it shows up only as terminal ids with no signature.*

2. **One assertion per observable**, asserting what it actually says — exact text, exact count, exact
   state — never a weaker \`toBeVisible()\` stand-in.

3. **Assert the full transition**: the request that went out, the old state gone, the new state
   visible.

4. **Seed two of anything an assertion must discriminate.** A fixture with exactly one card, one row
   or one key cannot tell "the right one" from "the first one", and an off-by-index bug passes.

5. **Drive state through the UI, not around it.** Seeding a PRECONDITION through the server or the
   file system is fine; performing the mutation the test is NAMED for that way is not — it skips the
   control, the handler and the request body, which is the whole reason the walk exists.

6. **Wait for elements, never for a duration.** An arbitrary sleep is a flake with a timer on it.

7. **You may fix a genuine defect your walk exposes** — a missing guard, an unhandled branch, a
   control that renders and wires to nothing. Red test first, and report it. **Close the hole; do not
   rebuild the feature.**

### The proof

**Watch each new case fail before you make it pass, and capture the failure output.**

**Where red-first is impossible because the behaviour already works — which on this discipline is
most of them — prove the test bites by MUTATION**: break the production line it guards, run it,
capture the red, then revert BY EDITING the line back (never \`git checkout --\`) and confirm the file
reads exactly as it did before.

\`EVIDENCE\` carries, per unit: the unit id, the spec \`file:line\`, the assertion quoted, **what makes
it fail** — the specific wrong value or state that turns it red — and the witnessed red itself,
saying whether it came from red-first or from a mutation you reverted. **An assertion you cannot name
a failing value for is a sentence that happens to be true, not a test.**`,

  reviewerMarkdown: `${flowEvidenceContractStatics.judgingMarkdown}

## What you sign on this track

You write \`flowriderSignoff\` over the browser-reachable package kinds; the sibling role writes the
SAME field over the DISJOINT complement, so signing one of yours never settles one of its units. Sign
to the same bar: \`confirmed\` carries a test \`file:line\` PLUS what makes that test fail;
\`unconfirmable\` carries what was tried, why each attempt could not reach it, and a \`question\`
someone else can pick up. **BATCH the writes** — one \`modify-quest\` call carrying many, never one
per unit.

**A resolved package with no \`webServer\` declaration blocks every unit it owns**: sign each
\`unconfirmable\`, with the missing config as both the evidence and the question.

**AUDIT EVERY \`unconfirmable\`, a predecessor's included.** It closes a unit permanently while
sounding responsible, so deferral hides there. Reopen any whose evidence names an assignment rather
than a wall. What you reopen, you own.

## False greens to hunt in a browser walk

- An assertion that would pass against a broken product.
- **A geometry or visibility finding taken from a hidden tab.** A backgrounded tab reads
  \`visibilityState: "hidden"\`, which throttles \`requestAnimationFrame\` and stops frame-committed
  layout, so nodes read as invisible with zero-ish boxes — it looks exactly like a product bug.
- A \`toBeVisible()\` standing in for an exact-text claim.
- A spec that duplicates a path an existing spec already walked.
- **A Playwright config or shared harness edited by this round.** Sibling items work against the same
  tree; that edit is last-write-wins and belongs in \`NEXT: rework\` with the owner named.

**One rule the post-mortem left contested, resolved: the intercept ban binds AUTHORED specs.** A
Playwright spec must not \`page.route\` its own backend to manufacture a value. A hand-driven
measurement in a live browser — another discipline's modality, not yours — may patch the fetch
boundary; on this track you are authoring, so the ban binds you. **Do not accept a \`confirmed\` whose
evidence came from an intercepted route.**

**If a green run looks impossibly fast for the work it claims, do not accept it.** Run
\`npm run ward -- detail <runId>\` and confirm real per-test durations. A "discovered" file count is
not a count of tests that ran.`,
} as const;

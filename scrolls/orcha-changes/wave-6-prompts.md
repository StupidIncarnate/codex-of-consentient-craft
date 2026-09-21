# Wave 6 — the prompts

**One session per prompt, and that is not over-splitting.** Each one is budgeted against a
50,000-character ceiling before a word of it is written, and today's operator prompts are already at
44,301 and 49,216 bytes. Two prompts in one session means one of them gets the leftover context.

**Model: opus** for the two reviewers and the three planners. **Sonnet** for everything else.

**This file carries everything a worker needs** — its step map, and for the siege prompts the rulebook
that goes inside them. It does not point anywhere else.

---

## The one rule that kills this wave if it is ignored

**Budget the prompt against `mcpToolResultStatics.maxVerbatimChars` BEFORE writing it, not after.**
Over the ceiling, the MCP layer spills the result to a file and hands the agent an error stub — **the
session then holds a path instead of its instructions, and nothing reports a failure.** The new worker
carries the operating rules plus seven constant brief blocks plus the sad-path block. The new reviewer
carries today's 344 lines plus `standardsReviewConcernsStatics` plus the seam walk. Both are close.

**Step one is the same call for all thirteen execution prompts:** `get-quest-work({ questId,
workItemId })`. That is the point of collapsing `get-qa-checklist` into it, and it is why this wave
cannot start before wave 3 is green.

---

## Vocabulary these maps use as if you know it

**family** one of six role stages · **scope** one family's slice of one quest · **step** one stage
inside a family, its own dispatched session · **work item** one dispatched agent run · **unit** an
observable, a terminal node, a labelled edge, or an off-map family (`offmap:perf`) · **piece** a line
in the planner's forecast file.

**Three marks:** `met` (proved, with evidence) · `cant-meet` (unsettleable at this layer, carries a
`toSettle` instruction) · `unmet` (not done — the router mints a fresh session on exactly these).
**Four outcome words:** `done` · `unmet` · `empty` · `wall`.

**A step declares no `done` route when it is only ever mark-minted** — its `done` returns
automatically to whichever session's `unmet` created it.

---

## The sessions

Every one of these owns its own directory under `packages/orchestrator/src/statics/`, so the whole
wave is file-disjoint and runs at once.

| # | Prompt | Status | Cut from | Bytes today |
|---|---|---|---|---|
| 6a | `codeweaver-planner` | NEW | `codeweaver-prompt/` steps 1–3 + the brief's authored blocks | 49,216 |
| 6b | `codeweaver-worker` | NEW | the brief template's seven constant blocks | — |
| 6c | `codeweaver-reviewer` | REWRITTEN | `codeweaver-reviewer/` steps 1–5, 8 + operator step 5 | 19,084 |
| 6d | `flowrider-planner` | NEW | `flowrider-prompt/` steps 1–4 | 44,301 |
| 6e | `flowrider-worker` | NEW | the constant blocks + BOTH `HOW TO WRITE THESE` sections | — |
| 6f | `flowrider-reviewer` | REWRITTEN | `flowrider-reviewer/` steps 1–5 + `flow-evidence-contract/` | 16,494 |
| 6g | `siege-planner` | NEW | `siegemaster-prompt/` steps 1–3 | 46,663 |
| 6h | `siege-happy-walker` | ADAPTED | `siegemaster-verifier/` pass 1 + operator step 5 | 28,552 |
| 6i | `siege-adversarial-walker` | ADAPTED | `siegemaster-stress/` pass 1 | 18,936 |
| 6j | `siege-happy-fixer` | NEW | today's inline fixer brief | — |
| 6k | `siege-adversarial-fixer` | NEW | 6j, with ONE inversion | — |
| 6l | `recipe-maker` | NEW | today's inline phase-zero guide-writer | — |
| 6m | `siegemaster-reader` | NEW | today's inline `OFF-SCREEN` instructions | — |
| 6n | `spiritmender` | REWRITTEN | `spiritmender-prompt/`, minus its git section and its commit | 18,548 |
| 6o | `warpgate` | REWRITTEN | `warpgate-prompt/`, minus its commit gate | 16,262 |
| 6p | the SHARED blocks | NEW | — | — |
| 6q | registration + the deletions | — | — | — |
| 6r | `chaoswhisperer` wording | 3 fixes | `dumpster-create-prompt/` | 63,538 |

**6b and 6e are the two with no source to cut from**, and both are bigger than they look: they inherit
constant text that is copied per-flow today and becomes served text. Give each its own session.

---


---

## The reviewer inherits the operator's real job

Pulling the loop out leaves one job homeless, and it is the most valuable one: **nobody is left looking
at the whole thing.** A worker sees its piece; a planner saw the scope before code existed.

That job goes to the reviewer, and it is why `codeweaver-reviewer` moves to **opus**.

| The reviewer does | Why it is the reviewer |
|---|---|
| walk every code bit the pieces added, in full — not the diff | a diff hides a false green; the file is what shows one |
| check the pieces glue together, **especially across package seams** | a seam has two halves built by two pieces, and neither worker saw the other's |
| fix what it can, itself | deferring a one-line fix downstream makes the next session re-derive it |
| mark `unmet` for what it cannot | that is the whole rework edge, and it names exactly which units |

The seam case is the specific one. Codeweaver fans out per (package, flow) cell, so a flow crossing an
HTTP boundary is built by two pieces in two packages that never see each other. Today the operator
reads both halves; under the step model the reviewer is the only session that does. "Read both sides of
every seam your pieces touched" becomes a required part of its prompt.


---

## How to read a step map

**Nineteen prompts are listed below: nine new, two adapted, four rewritten, two untouched, one
wording fix, one dead step removed.** Five more are deleted and so appear nowhere in the list — the
three operator prompts, `siegemaster-reviewer`, and `glyphsmith`. Step one is the same call for all
thirteen execution prompts, which is the point of collapsing `get-qa-checklist` into it.

**Role rules for the siege prompts are in the rulebook below, not in the maps.** A map names the job,
the calls and the endpoints; the rulebook is what the prompt must SAY — nine rules for the happy walker, nine for the
antagonist, the five-step rule for an implementation-detail unit, and the reasoning behind
`siegemaster-reader`, `recipe-maker` and both fixers. Where a map disagrees with the rulebook, the rulebook wins and
the map is what needs correcting.

**How to read an entry.** `DOES` is the one job. `CONSUMES` is everything it is handed or fetches,
and nothing else reaches it. `WRITES` names the exact payloads — anything absent from that line it may
not write. `DONE` is the condition its ending is graded against, which for a unit-holding step is what
the signal gate already enforces. `FROM` names the part of today's prompt the step inherits, so a
rewrite has something to cut from rather than inventing one.


---

## The step maps

One block per prompt: what it DOES, what it CONSUMES, what it may WRITE, what DONE means, what it is
cut FROM, then its numbered steps.

#### codeweaver

Today one 49,216-character operator prompt runs all nine steps. Splitting it three ways is mostly a
MOVE, and saying which part moves where is what stops a rule being dropped in the cut.

| Today's operator step | Goes to |
|---|---|
| 1 fetch the flow, read both `## Contracts` headings | planner |
| 2 standards, `get-project-map`, `discover`, then `Read` | planner |
| 2 `git log` for what earlier cells landed | planner, but **served** — it runs no git |
| 3 write the map — groups, FACTS, FENCES, PROVES, TRAPS | **the plan file.** `.quest-plans/<id>-map.md` stops existing |
| 3 the cross-package move table, `packagesAffected` | planner — the one `modify-quest` field it keeps |
| 4 the brief template's 5 authored blocks | the piece's `payload` |
| 4 the brief template's 7 constant blocks | the worker's served prompt |
| 4 sign each wave's `PROVED` lines | the worker marks its own units as it settles them |
| 5 read the diff, the four questions | reviewer — and it reads FILES, which is what it always did |
| 6–7 summon a reviewer, loop on its `NEXT:` line | gone. The reviewer is a step and the router runs the loop |
| 8 read-check sign-offs off the reviewer's report | the reviewer marks them itself, in the reading it already does |
| 8 `git status`, the SWEEP briefs | gone. The deterministic `commit` step takes the whole tree |
| 9 signal | every step signals |

```
codeweaver-planner · planner · opus · entry                                           [NEW]
  DOES      cuts this cell's work into pieces and batches, and claims every unit in scope
  CONSUMES  get-quest-work → scope (flowId, packageNames), the cell's in-scope units,
            piece:null, the paths earlier scopes committed · get-quest → the flow WHOLE
  WRITES    quest-work → plan · quest-work → outcome · modify-quest → packagesAffected only
  DONE      every in-scope unit is claimed by a piece or recorded in plannerMarks, and no
            batch holds two pieces touching one file
  FROM      today's operator steps 1-3 plus the brief template's authored blocks

  1 get-quest-work({ questId, workItemId }) — the scope, the in-scope units, `piece: null`
  2 get-quest({ questId, flowId, packageName }) — never `stage: 'spec'`, which renders the
    whole quest and blows the ceiling. The flow comes back WHOLE and unfiltered: a flow cut
    to one package comes apart into disconnected pieces and the branch conditions go with them
  3 read BOTH `## Contracts` headings. The second — "contracts you own that NO flow of yours
    anchors" — is shown to NO sibling session. Skip it and those contracts reach nobody
  4 a contract routes by FILE PATH, its own `source` or one property's. Build what each
    line's OWN path names, not the contract's source
  5 load standards: get-architecture, get-testing-patterns. Before reading any code
  6 ONE get-project-map naming every package the flow tags, then discover, then Read.
    discover first guesses a path, and a wrong glob reads exactly like an empty package
  7 read the paths earlier scopes committed — SERVED in step 1, never `git log`. Library
    packages run first, so the helper you are about to brief may already be on the branch
  8 cut one piece per FILE GROUP. Two changes share a batch only when BOTH hold: they touch
    DIFFERENT FILES, and NEITHER needs the other to have landed. Both, every time
  9 never write a wait into a piece. A file another piece is creating means a LATER batch —
    never one batch with a "re-check if it is not there yet" line, which has no bound and no
    `wall`, and a batch that wins that race by 40 seconds reads like one that lost it
 10 split assigned from context. A unit whose `{package}` is yours is assigned; a sibling's
    unit on a node you tag is CONTEXT — the other half of the contract you are building.
    Read it, build against it, never claim it
 11 a `(read-check)` unit goes in `payload.traps` as a constraint, NEVER in `payload.units`.
    No test settles it — a green test proves the value is right, never where it came from
 12 an edge line carries TWO ids: the `<edge:…>` at its head is the unit; the `[#…]` is the
    node it points at. Name the wrong one and the mark lands on nothing
 13 never a line number, in any field. Every batch that lands edits files, so a number
    recorded now is wrong by the batch that reads it. Anchor on a NAME
 14 a change needing a sibling package's behaviour: MOVE it to a package both can call, do
    not copy it and do not import across. `get-project-map` names the library package by
    KIND, since every repo names it differently. No library package at all → build it in
    your own package with a comment saying why, and write the spec change
 15 add any new package to `packagesAffected` BEFORE planning against it. That field is
    REPLACED WHOLE on write — send every existing entry back with yours
 16 write the plan, then read it back with get-quest-work({ questId, operationItemId }).
    **A unit no piece claims is the defect this read exists to catch**, and in JSON an
    absence is invisible by construction
 17 declare the outcome, signal

codeweaver-worker · worker · sonnet                                                   [NEW]
  DOES      writes one piece's implementation and the tests that settle its units
  CONSUMES  get-quest-work → the piece (files, facts, fences, units, traps, doNotTouch),
            its assigned AND context units, prior sessions' notes on those units, the
            uncommitted file list
  WRITES    quest-work → observations · quest-work → amendment
  DONE      every assigned unit marked, each `met` carrying a witnessed red — the test
            file:line, the FAILS IF value it was set to, and the ASSERT value that run
            reported as RECEIVED
  FROM      the brief template's seven constant blocks: RED FIRST, TRAPS, DO NOT TOUCH,
            DISCOVERY, BEST GUESS, PROVE, RETURN

  1 get-quest-work({ questId, workItemId })
  2 the uncommitted list is the LIVE `DO NOT TOUCH` set — what your batch-mates have open
    right now, which the planner could not know at plan time
  3 load standards + get-folder-detail for every folder type you will write into
  4 read your named files, AND your context units — they are the far half of a contract
    you are building and nobody assigned them to you
  5 implementation FIRST, then the spec written against it with every unit assertion set to
    its FAILS IF value
  6 run RED. Every one of those expects must FAIL, and each failure must report this unit's
    ASSERT value as what it RECEIVED. Expected the wrong value, received the right one —
    that pair is the only thing proving the assertion runs and reads what it claims to
  7 set only the assertions that SETTLE a unit. A precondition stays true, or the test dies
    before the assertions that matter run
  8 a suite that never RAN has produced no red. `Cannot find module`, `Test suite failed to
    run` and every `error TS` are compile failures with no assertion behind them
  9 you produce a red by editing YOUR OWN SPEC and nothing else. Banned by name: moving,
    copying or renaming a file; git stash; rewriting from git show; a `.bak`; breaking an
    implementation file. Never fabricate a red you did not watch
 10 correct each to ASSERT, run green
 11 MARK each unit the moment it settles — never one block at the end. A session that dies
    having marked nothing loses the whole piece
 12 create a file the piece did not list where the work needs one — a static, a transformer,
    a contract. Never one another piece owns or `doNotTouch` names
 13 the piece is a BEST GUESS. You have the code open and the planner did not, so hard
    evidence against a direction wins. **Every deviation comes back as a mark or an
    amendment, never as a note on a pass**
 14 ward YOUR OWN PATHS: `npm run ward -- -- <this piece's paths>`. Never `--uncommitted`,
    never bare, and never the `run-ward` MCP tool — that grades the whole branch and lands
    the red on your work item
 15 mark the remainder `unmet` with what is left and what you learned. That note reaches
    your successor
 16 signal. You commit nothing and you run no git

codeweaver-reviewer · reviewer · opus                                                 [REWRITTEN]
  DOES      reads every file this cell produced, in full, and settles every unit in scope
  CONSUMES  get-quest-work → the cell's WHOLE in-scope unit set as its assignment, every
            piece this cell ran with its notes and its marks, the flow, the uncommitted
            file list
  WRITES    quest-work → observations on every in-scope unit · modify-quest → a measured
            defect as a new observable · direct edits for what is small
  DONE      one written comment per file, both halves of every seam read, every in-scope
            unit marked, and every `met` a worker wrote either re-grounded or turned `unmet`
  FROM      today's reviewer steps 1-5 and 8, plus operator step 5's four questions

  1 get-quest-work({ questId, workItemId }) — **the whole in-scope set is yours**, not one
    piece's. You are the only session positioned to notice a unit no piece ever claimed
  2 load standards, before opening any code
  3 get-quest({ questId, flowId, packageName }) — the observables in their own words, never
    a worker's paraphrase and never a commit message's
  4 the pass IS the uncommitted list from step 1. It is tracked changes unioned with
    untracked additions, and the untracked half is most of what a cell produces
  5 open EVERY file IN FULL, one at a time. Not the diff — the file. A whole file is what
    finds the false green a diff hides: an assertion comparing a value to itself, a branch
    that reads plausibly alone and contradicts its caller
  6 emit that file's comment BEFORE opening the next — Acceptance / Evidence / Fit / Test /
    Missing. **The comment is the only durable evidence the file was read.** A verdict
    written after twenty reads describes twenty files at once and could have been written
    without opening any. A file carrying no comment has not been reviewed
  7 six questions, taken in ONE reading with the five standing concerns:
      a does the code do what the flow says — every branch an edge names should exist
      b do the pieces fit — one worker's function and another's call to it
      c is the unit test real — name the wrong value that turns it red, or it does not bite
      d what is MISSING — a node with no code behind it is what a green build never reports
      e does every cross-package import have a dependency behind it — the root
        `node_modules` resolves it either way, so lint and tsc stay green and it breaks the
        day that package is installed alone
      f does every `met` a worker wrote have a test you opened? Nobody has checked one
        until you do. **A `met` no test in this work proves is `unmet`**
  8 read BOTH SIDES of every package seam. Codeweaver fans out per cell, so a flow crossing
    an HTTP boundary is built by two pieces that never saw each other. You are the only
    session that reads both
  9 settle each `(read-check)` unit by OPENING THE FILE. Take its description verbatim from
    the flow render, never from a piece — a paraphrase you grade against is one you pass
 10 an operational unit is verified against the TREE, never against a test: the file really
    deleted, really gone from every import and every route
 11 fix what is small and clearly yours. A one-line hole closed here is a line the next
    session does not rediscover. Anything structural, anything needing a decision, is a mark
 12 mark as you go. An in-scope unit no piece claimed is `unmet`, and the router assigns it
    to the worker your `unmet` mints
 13 a measured defect is a NEW observable, added through modify-quest — an observable is a
    positive expectation, so its inverse is added rather than recorded as a verdict
 14 signal. **No ward and no commit** — both are deterministic steps after you
```


#### flowrider

Same split, from a 44,301-character operator prompt. Three of its moves are load-bearing and easy to
lose in the cut.

| Today's operator step | Goes to |
|---|---|
| 1 fetch the flow; the operational-retype escape | planner |
| 2 `get-qa-checklist` — units, `CHECK SURFACES`, `WALK PATHS` | planner, through `get-quest-work` — the checklist tool is deleted |
| 3 read the implementation for each unit's exact value; choose a layer PER UNIT | planner |
| 4 the map, with per-unit `layer` / `surface` / `assert` / `fails if` | the plan file's `payload.units[]` |
| 4 `HOW TO WRITE THESE` — the two rule sections copied into every map | **the worker's served prompt, as constant text.** They are the same words on every flow |
| 5 send, and sign each group's `PROVED` lines | the worker marks its own units |
| 6 read the diff, three questions, hunt dropped units | reviewer |
| 7–8 the reviewer loop, and the `flowriderSignoff: null` overwrite rule | gone. A set per work item means a rejected `met` needs no clearing |
| 9 the remainder, spec changes, the sweep | the reviewer marks; `commit` takes the tree |

**Two translations disappear, and both were defect sources.** Checklist ids are composite —
`<flow>:<kind>:<id>` — while `modify-quest` takes graph ids, so today's operator strips a segment and
routes each kind to a different array. Marks are keyed by `unitId` through `quest-work`, so that
translation is gone. And `observableTarget` — which node or edge a unit hangs on — is resolved ONCE by
the planner into the plan, where today every session re-derives it because *"the checklist does not
print which node an observable hangs on"*.

```
flowrider-planner · planner · opus · entry                                            [NEW]
  DOES      decides what each unit is proved BY, at what layer, in which spec file
  CONSUMES  get-quest-work → scope, in-scope units with their served `surface`, the walk
            paths with their force labels and `pathsTruncated`, piece:null · get-quest →
            the flow whole
  WRITES    quest-work → plan · quest-work → outcome · quest-work → request (recipe)
  DONE      one piece per spec file, `payload.units[]` 1:1 with `assignedUnitIds`, every
            in-scope unit claimed, every `observableTarget` resolved
  FROM      today's operator steps 1-4

  1 get-quest-work({ questId, workItemId })
  2 get-quest({ questId, flowId }) — never `stage` beside `flowId`; the two together return
    an empty answer that reads as "this flow is empty"
  3 a flow RETYPED `operational` after this scope was minted is `empty`, never `wall` and
    never `blocked`. Your step scope filters to `runtime` flows, so your in-scope set is
    empty and there is nothing to claim. Blocking there stalls a quest over a correction
    that did its job
  4 the walk paths are GIVEN — every route through the flow with the branch labels a run
    must force. Do not re-derive them from the graph. Carry `pathsTruncated` into the plan:
    a worker handed a silently capped path list writes a suite that looks complete
  5 **paths are the itinerary, units are the coverage.** Two paths can carry twenty units,
    so covering every path proves nothing on its own
  6 load standards, then ONE get-project-map naming every package the flow tags, then
    discover, then Read
  7 read the implementation until you know the EXACT value each unit claims — the string,
    the status, the count, the order, the bound. The unit's words say what must be true; the
    implementation is the only thing that says what value actually comes back
  8 choose `layer` per UNIT — `browser` or `below-browser`. Never per file. One spec file
    routinely carries units at different layers, and a file-level label throws away the
    choice at its first hop
  9 `shape` — `journey` or `matrix` — is per FILE and orthogonal. Several paths means one
    test per path; one path carrying many independent inputs means one parameterized test.
    Neither axis may collapse the other
 10 resolve `observableTarget` per unit — which node or edge it hangs on. Only the flow
    render prints it, and resolving it once here beats every later session re-fetching the
    flow to find out
 11 **write no `surface`.** It arrives on each unit from its own `checkSurface` and the
    orchestrator fills the field. A planner that types one is transcribing
 12 if you cannot state `failsIf` for a unit, the assertion is not specified yet — go back
    to step 7 rather than handing a worker a guess
 13 cut one piece per SPEC FILE. FACTS and FENCES are written HERE, keyed by path, and the
    worker reads its own. A fact authored inside a brief lives in one session and nowhere
    else
 14 fill `payload.units[]` 1:1 with `assignedUnitIds` — a dropped terminal is invisible
    otherwise, and the plan contract refuses the piece
 15 a piece whose test needs a seeded system → REQUEST `recipe`, attach the names it returns
 16 write the plan, read it back, declare the outcome, signal

flowrider-worker · worker · sonnet                                                    [NEW]
  DOES      writes one spec file and makes every unit on it bite
  CONSUMES  get-quest-work → the piece (spec path, mode, harnesses, per-unit layer and
            surface, walk paths and force labels, facts, fences, mirror, traps, recipes),
            prior sessions' notes, the uncommitted file list
  WRITES    quest-work → observations · quest-work → amendment · quest-work → request
  DONE      every assigned unit marked, each `met` naming the assertion's file:line and the
            wrong value that turns it red
  FROM      the brief template's constant blocks, PLUS both `HOW TO WRITE THESE` sections,
            which stop being copied per flow and become served text

  1 get-quest-work({ questId, workItemId })
  2 CHECK the piece's recipes against the job in front of you. They do not fit → request
    `recipe`. Never seed by hand, and never assume the planner's list is the right one
  3 load standards + get-folder-detail; read the MIRROR spec and the implementation
  4 write the spec with every unit assertion at its FAILS IF value
  5 run RED. Each expect must fail reporting this unit's ASSERT value as RECEIVED
  6 an expect that PASSES holding its FAILS IF value reads nothing; one that fails reporting
    some OTHER value reads the wrong thing. Both are the assertion's fault — fix the
    assertion, never the FAILS IF value you were handed
  7 correct to ASSERT, run green
  8 browser rules, when the piece says `browser`: one test per path, entry node to every end
    node, failure arms included — an error toast, a 4xx render and a rejection are
    first-class. Exact text, exact count, exact state, never a `toBeVisible()` stand-in.
    Assert the whole transition — request out, old state gone, new state visible. SEED TWO
    of anything an assertion must tell apart, or "the right one" and "the first one" are the
    same value. Drive state through the UI, never around it. Wait for elements, never a
    duration. `page.bringToFront()` + a screenshot + assert `visibilityState` BEFORE any
    geometry read, or a background tab reads every node invisible with a zero-ish box and it
    looks exactly like a product bug. A `.e2e.ts` declares no function — helpers go in a
    `.harness.ts`. Never edit the Playwright config or another flow's harness
  9 below-browser rules, when the piece says `below-browser`: assert on the side that MAKES
    the claim. Read the artifact back — a spy proving a write was called never proves what
    landed. A negative needs a positive beside it, or a typo'd selector passes forever. Give
    each input class a hostile member. Use the real thing wherever the claim is about the
    real thing
 10 MARK each unit as it settles
 11 a unit you cannot reach at its served surface is `unmet` with the reason. **You may not
    pick an easier layer**, and the surface is not yours to amend — it comes from the unit's
    own `checkSurface`, and changing that is the reviewer's authority
 12 ward your own paths only; signal, uncommitted

flowrider-reviewer · reviewer · opus                                                  [REWRITTEN]
  DOES      decides whether each assertion BITES, and settles every unit in scope
  CONSUMES  get-quest-work → the flow's WHOLE in-scope unit set as its assignment, every
            piece and its marks, the flow, the uncommitted file list
  WRITES    quest-work → observations on every in-scope unit · modify-quest → a measured
            defect as a new observable · direct edits where an assertion can be strengthened
  DONE      a named failing value behind every `met`, one comment per file, every in-scope
            unit marked
  FROM      today's reviewer steps 1-5, and the judging half of `flowEvidenceContract`

  1 get-quest-work({ questId, workItemId }) — the whole in-scope set is your assignment
  2 load standards; get-quest for the flow
  3 the pass IS the uncommitted list from step 1
  4 open every test file ONE AT A TIME and write its comment before opening the next:
    ACCEPTS / BITES / LAYER / OBSERVABLE / SIGNED / CONCERNS. A clean file still gets one —
    a missing comment is a file nobody can tell you opened
  5 **read the assertions, not the test names.** A name is a claim; an assertion is evidence
  6 BITES is the line this role exists to write: per assertion, the wrong value or state that
    turns it red. One you cannot name is not a test, and that file does not ACCEPT
  7 LAYER: reject on the surface disagreement ALONE. The unit's served surface beats what the
    assertion reads, whatever the test is named
  8 OBSERVABLE: where the test and the unit's words disagree, the unit wins. A test written
    against a paraphrase and graded against the same paraphrase passes while proving
    something else — that is the defect shape this whole family exists to prevent
  9 every `met` a worker wrote: find the test and name the wrong value that turns it red.
    **A `met` no test in this work proves is `unmet`** — a claim nothing backs is worse than
    an unmarked unit, because a later session reads it as settled and never looks again
 10 take the five standing concerns in the SAME reading, onto that same file's comment.
    Never a second pass over the tree
 11 subtract what the work covered from the in-scope set and mark what is left. **A green
    suite over half a flow reports nothing about the other half.** An unclaimed unit is
    `unmet`, and the router assigns it to the worker your `unmet` mints
 12 an `unmet` quotes the unit id AND your own words, so a worker can re-cut from it
 13 signal. No ward, no commit
```


#### siegemaster

Siege is the inverse of the other two — its reviewers run first and FIND the work, its workers repair
— and it is also where the most machinery retires. Six of today's mechanisms are replaced rather than
moved, and each one is a thing the new engine already does.

| Today | Replaced by |
|---|---|
| **the GUIDE** — one sub-agent writes `.quest-plans/<id>-guide.md` under eight headings, every round reads it | split four ways, below. The file stops existing |
| **rounds** — one path walk at a time, both minions back before the next | plan batches, bounded by measured lane capacity — and PHASED by the step chain, `happyWalk → adversarial` |
| the operator allocating two lane NAMES per round | the router, which starts and kills every instance and substitutes its id into the prompt |
| the operator holding the pass together — `cleanup` at both ends, `status` after a death, re-reading capacity | `sweepIn` and `sweepOut`, two deterministic steps, plus the router owning `start` and `kill` — the operator section of the rulebook |
| "re-read the checklist before every round, brief only the units still REMAINING" | the router re-filters the assignment at dispatch |
| step 5's fixer dispatch and step 7's re-walk | an `unmet` mints a fixer; its `done` returns to the walker that found it |
| `reset-flow-signoffs` off a fixer's `REACHES:` line | the `invalidation` payload |

**Where each of the guide's eight headings goes.** This is the part most likely to be dropped
silently, because the guide is one file and its contents are not one thing:

| Guide heading | Now |
|---|---|
| `TOOLING`, `ENTRY`, `SEEDING`, `RESET` | **the recipe.** Executable, proven by a run, reusable by the next quest |
| `CONTROLS`, `FORCING` | the piece's `payload` — the path's own nodes and force labels, which the plan already carries |
| `OFF-SCREEN` — where a value lives that the page never shows | **`siegemaster-reader`**, which returns it with `file:line` |
| `TRAPS` | the piece's `notes`, written by the planner |

**`[SIGN ONCE]` is deleted from both walker prompts, with a note saying why.** It existed because a
second sign-off overwrote the first's evidence in a shared field. A re-walk now writes its own set on
its own work item and the first stays readable, so nothing is destroyed — and *"a fix is only proved
by a round that did not make it"* becomes something the engine does rather than something a prompt
asks for. Leave the rule standing and an adapted prompt carries a ban whose reason is gone.

**The deliberate-red mechanism retires with it.** Today a walker's pass-2 sub-agents write one failing
test per defect as durable evidence, and the operator then passes a `RED TESTS:` list to its reviewer
so that reviewer does not "fix" a red that is deliberate. Under the step model the FIXER writes that
red itself, watches it fail against unchanged source, and turns it green in the same session — so no
orphaned red ever reaches a ward gate, and no list is needed to protect one. A walker dispatches
nothing.

```
siege-planner · planner · opus · entry                                                [NEW]
  DOES      turns the flow's walk paths into walk pieces, and allocates the off-map families
  CONSUMES  get-quest-work → scope, in-scope units, the walk paths with their force labels,
            the seven off-map families, piece:null · get-quest → the flow whole, and its
            `flowType`
  WRITES    quest-work → plan (with plannerMarks) · quest-work → outcome · quest-work →
            request (recipe)
  DONE      one `happyWalk` piece per path, one `adversarial` piece per allocated family,
            every family this pass gives no round recorded `cant-meet` with a `toSettle`
  FROM      today's operator steps 1-3

  1 get-quest-work({ questId, workItemId })
  2 get-quest({ questId, flowId }) and read its `flowType`. `runtime` is a user-facing path
    to drive. `operational` verifies that manual code work landed — **nothing repeatable
    exists in one**, so it is filtered out of this family's scope entirely and your in-scope
    set comes back empty. That is `empty`, not work
  3 take the walk paths AS GIVEN. A path you invent is one whose branch labels nobody checked
    against the graph, and a walk sent down it measures a route the flow does not have
  4 **paths are the itinerary, units are the coverage.** Ten paths do not reach seventy-five
    units. You are done when every unit is claimed, not when every path has a piece
  5 order them cheapest-first, shared prefixes adjacent. The cheapest path surfaces a break
    before anything is spent on branches running through the same early nodes
  6 cut one `happyWalk` piece per path
  7 allocate the seven off-map families — re-entry, concurrency, interruption, staleness,
    configuration, hostile-input, perf — ONE per piece, never repeated. A repeated family
    destroys the first piece's coverage
  8 cut one `adversarial` piece per allocated family, and **none past the seventh**. Today's
    `FAMILY: none for this walk` existed because rounds were pinned to paths; pieces are not
  8a **a batch holds pieces for ONE step.** Every `happyWalk` piece drains before the first
    `adversarial` piece is minted — that is the phase order, and it is what makes each
    attack's baseline a real reading rather than a guess. Mix them in one batch and the
    plan is refused
  9 **`hostile-input` and `perf` are this quest's only security and performance coverage
    anywhere.** Where either gets no piece, nothing else in the quest catches what it would
 10 every family this pass gives no piece goes in `plannerMarks` as `cant-meet` with a
    `toSettle` naming the round a future pass should spend on it. That is your one mark
    authority, and it is the difference between recording uncovered and dropping silently
 11 need seed data these walks cannot start without → REQUEST `recipe`, then attach the names
    it returns to each walk piece. Never write a seed yourself, and never send a walk down a
    path whose recipe carries no proving run id
 12 write no lane or instance names — the router starts each instance and serves its id
 13 write the plan, read it back, declare, signal

recipe-maker · planner · opus · ON REQUEST, by flowrider and siegemaster               [NEW]
  DOES      makes sure every seed the requesting session needs exists and has been run
  CONSUMES  get-quest-work → the request that minted it, the flow · `siegelense recipes` →
            what already exists
  WRITES    recipe files in packages/hydration-recipes · the recipe names onto the flow ·
            quest-work → outcome
  DONE      every seed the request named exists, ran as a SEQUENCE, and carries the run id
            that proved it
  FROM      today's phase-zero guide-writer, inline in siegemaster-prompt-statics.ts
            RULES: the recipe-maker rules in the rulebook below — the setup shape, the twice-and-compare step, and the open
            question about who writes an INGREDIENT

  1 get-quest-work({ questId, workItemId }) — the request, the scope, the flow
  2 get-quest for the flow whole — nodes, edges, entry and exit points
  3 ENUMERATE what exists: `dungeonmaster siegelense recipes`. Never assume
  4 work out which seed states the requested walks actually need
  5 author the gaps into the recipe book — `packages/hydration-recipes`, committed
  6 RUN every recipe you intend to use, new AND existing, as a SEQUENCE end to end against
    a throwaway instance. **An existing recipe is not trusted on age**: ingredients mimic a
    shape production owns and drift from it silently, and the first sign is a walk that
    cannot start
  7 testing the SEQUENCE is what testing each recipe alone does not give you. Three that
    each pass in isolation still fail composed — one leaves state the next does not expect,
    an id from the first is not what the second wants
  8 record the run id that proved each one. **A seed with no proving run is a path no walk
    may be sent down.** An unproven recipe does not fail loudly; it manufactures a defect
    that does not exist and sends a fixer hunting in working code
  9 write "NOT FOUND — the reader must work this out" rather than guessing. A wrong command
    costs a whole walk
 10 record the names on the flow; declare `empty` if you wrote nothing
 11 signal — declares NO forward route; returns to whoever asked

siegemaster-reader · worker · sonnet · ON REQUEST                                      [NEW]
  DOES      opens the source files a walker may not, and hands back configured values
  CONSUMES  get-quest-work → the request: which values, for which units
  WRITES    nothing to the quest. Its answers ride back on the return
  DONE      every requested value returned with `file:line` provenance
  FROM      inline prose in siegemaster-prompt-statics.ts. RULES: the reader rules in the rulebook below

  1 get-quest-work({ questId, workItemId }) — the request
  2 open the source. **You are the only session on a siege pass that opens a source file**,
    and that is the whole reason you exist: a walker that opens one holds it for the rest of
    the walk, and the trial measured six correct verdicts reached with every expected value
    known in advance and no independent look anywhere in the pass
  3 return a LOCATION or a CONFIGURED VALUE — "the cap is 50" — **never an EXPECTED VALUE
    the unit should have carried**. "The list should show 50 rows" is a verdict, and handing
    a walker that launders the contamination through one more session
  4 every value carries `file:line`, or it cannot be told from one a session remembered
  5 a unit whose expected value exists ONLY in source is a `questNotes` open question, not a
    value to hand back. That is a spec defect — the unit is under-specified
  6 you touch no instance and hold no lane slot, so you run beside a full pool
  7 signal — declares NO forward route; returns to whoever asked

siege-happy-walker · reviewer · sonnet                                [ADAPTED from verifier]
  DOES      drives one path by hand against a live lane and settles what it measures
  CONSUMES  get-quest-work → the scope's WHOLE in-scope unit set, the piece (its path, force
            labels, recipe names, notes), each unit's served surface, and the running
            instance's id and manifest — the router started it before dispatching you
  WRITES    quest-work → observations · modify-quest → a new observable per defect ·
            quest-work → amendment · quest-work → request (recipe, read)
  DONE      every in-scope unit marked, one `unmet` per defect, the lane closed, nothing
            committed
  FROM      today's `siegemaster-verifier` pass 1, plus operator step 5's judging table.
            RULES: the happy-walker rules in the rulebook below — nine rules this map does not carry, and the five-step rule for
            an implementation-detail unit. Its `docs` scope is in the rulebook below

  1 get-quest-work({ questId, workItemId })
  2 **Your instance is already running and its id is in your prompt.** You do not start it,
    you do not name it, and you never restart it — a restart destroys any unit measuring a
    difference from a value only that process's lifetime provides: an uptime, a monotonic
    counter, an append-only log. The router started it and the router kills it
  3 read the flow — it IS the map — and run the recipes the piece names. Those seeds do not
    set up the walk in front of you → REQUEST `recipe`. **Never invent a seed inline**
  4 learn each unit's expected value BEFORE driving. From the unit's own words, and from
    `siegemaster-reader` for anything only source holds. **Open no source file yourself.**
    Read the page first and you will talk yourself into whatever it shows you
  5 where the code and the unit disagree, **the UNIT wins, and the disagreement is itself a
    finding.** Taking your expectation from the code confirms whatever it happens to do,
    including the defect you were sent to find
  6 take `baseUrl` and every other address from the SERVED manifest in step 1. The instance
    asked the OS for free ports, so a port carried in from anywhere else belongs to some
    other walk
  7 reset, then drive the whole path. **Drive every force label FOR REAL** — landing on a
    branch is not forcing it. Submit the bad value, trigger the rejection, hit the empty
    state, exhaust the limit. "I walked the happy path" is the number one way this misses
  8 never re-seed to something smaller or better-behaved than the reset gives you. **Two of
    anything an assertion must tell apart**, or "the right one" and "the first one" are the
    same value and an off-by-index bug passes
  9 after any error branch, check for damage: no orphaned row, no half-written file, no
    silently consumed message, no stuck spinner
 10 record per unit AS YOU DRIVE — STARTED FROM / DID / SAW / BROKEN WOULD SHOW. `SAW` is a
    VALUE, never an adjective. **`BROKEN WOULD SHOW` is the whole proof**: a measurement
    that could not have come out differently proves nothing, even when what you saw was
    right. Search your own draft for "confirmed", "held", "verified", "as expected" and
    "correctly" — every one is a place where a value belongs
 11 LOOK AT EVERYTHING you pass, marked or not. **Yours is the only session that ever sees
    this path run**, so anything you wave past reaches nobody. One walk waved a stuck loader
    through as intentional; the next proved it never resolves
 12 judge what you find as a USER would: a breaking issue, something a person would notice,
    and something that merely READS wrong — an ugly transition, a misaligned control, a
    truncated label, a spinner that never resolves, a state with no feedback — are all
    defects. **"No observable claims it" is not a reason to leave something broken.** What
    is NOT yours is a redesign: fix what is wrong, do not improve what is merely plain
 13 mark each unit as it settles. **A defect that is not already a unit BECOMES one first** —
    add the observable through modify-quest, then mark it `unmet`. The set is one entry per
    unit, so two defects on one unit is two units, not two marks
 14 amend the plan where a driving field proved wrong
 15 signal. **You close nothing** — the router kills your instance when your work item
    records, so a session that dies mid-walk strands no server. Nothing is committed

siege-happy-fixer · worker · sonnet                                                   [NEW]
  DOES      fixes the cause of what a walk measured
  CONSUMES  get-quest-work → the MINTING OBSERVATION (the walker's whole measured block,
            word for word), the inherited payload (look-at, facts, fences, doNotTouch), the
            uncommitted file list
  WRITES    quest-work → observations · quest-work → invalidation
  DONE      the cause fixed rather than the symptom, every assigned unit marked, no lane
            touched, nothing committed
  FROM      today's fixer brief — SYMPTOM, LOOK AT, FACTS, FENCES, EVIDENCE WINS, FIX,
            RED FIRST, DO NOT TOUCH, PROVE. RULES: the fixer rules in the rulebook below — including the one rule this map
            does not carry, that a fixer writes its regression test from the SAME recipes
            the walk's setup named, and the open question about step 7

  1 get-quest-work({ questId, workItemId }) — the measured block is the brief. It lives on
    the observation that minted you, and nowhere else
  2 load standards + get-folder-detail; get-project-map before any discover
  3 watch a real test fail against UNCHANGED source, for the right reason, BEFORE fixing.
    Painted geometry → e2e, jsdom has no layout engine. A boundary between two parts →
    integration. Pure logic → unit
  4 fix the CAUSE. **Refuse all six symptom-hiding shapes by name**: do not widen a type to
    accept the bad value, swallow the error, default the missing value, raise the timeout,
    loosen an assertion, or delete the branch
  5 never weaken, skip or delete a test to reach green
  6 the brief is a BEST GUESS made from what a walk measured. Hard evidence against it wins
    — and then **say so on the record.** A deviation that shows up only in the change is a
    silent behaviour change
  7 TOUCH NO LANE — not start, not stop, not restart, not drive. The walker owns the one it
    started, and several units measure a difference only that process's lifetime provides
  8 mark each unit as it settles
  9 where the fix moved behaviour nobody can enumerate, send an `invalidation` naming the
    flow. That re-opens every unit on it onto a fresh session — nothing is edited and
    nothing is erased
 10 ward YOUR OWN PATHS only. Never `--uncommitted`, never bare, never the `run-ward` tool
 11 signal — declares NO forward route, so your `done` returns to the walk that found this

siege-adversarial-walker · reviewer · sonnet                            [ADAPTED from stress]
  DOES      attacks one path against its allocated off-map family
  CONSUMES  get-quest-work → the scope's WHOLE in-scope set, the piece (path, force labels,
            off-map family, recipe names), the running instance's manifest, and **the
            BASELINE: the happy walk's instance id and run id for this exact path**, which
            exists because happyWalk drained before this step started
  WRITES    quest-work → observations · modify-quest → a new observable per break ·
            quest-work → amendment · quest-work → request
  DONE      the numbered list written first, every point driven or recorded UNREACHED, the
            family unit marked
  FROM      today's `siegemaster-stress` pass 1. RULES: the antagonist rules in the rulebook below — nine rules this map does not
            carry, and why it never sees an operational flow. Its `docs` scope is in the rulebook below

  1 get-quest-work({ questId, workItemId })
  2 **Your instance is already running and yours to break**, which is why the router gave
    you one of your own rather than the happy walk's. You started nothing and you restart
    nothing
  3 **READ YOUR BASELINE FIRST**, with `results` on the happy run id served in step 1 —
    that walk of this exact path is finished and its readings are on disk, so reading them
    starts nothing. Your finding is an ABSENCE, and an absence is only evidence against a
    known-good reading taken before you attacked. Look for NO baseline you were not handed
  4 read the flow and run the recipes the piece names; REQUEST `recipe` if they do not fit
  5 **ENUMERATE every stress point this path exposes BEFORE driving anything.** That list is
    your denominator. A truncated pass 2 is VISIBLE against it; a truncated pass 1 is
    invisible, which is exactly why nothing may be driven during it
  6 add the family's own probe. Pad the list with nothing
  7 drive each numbered point, one at a time
  8 a probe that KILLS your instance: mark `unmet`, carrying the `status` output and the
    numbered points not yet driven. The router mints your continuation on a fresh instance.
    **You restart nothing** — nothing measured before a death is comparable with what is
    measured after, and a restart inside one session hides that break in a transcript
  9 mark the family unit; one `unmet` per break, each one its own unit
 10 an honest "N/A for this path because …" is `met`, and the justification is its evidence.
    The family was considered and ruled out, which is a measurement. It is NOT `cant-meet`,
    which needs a `toSettle` and an N/A leaves nobody anything to do
 11 a point you could not get real volume onto is recorded UNREACHED, never as held
 12 amend the plan where a driving field proved wrong; signal. You close nothing

siege-adversarial-fixer · worker · sonnet                                             [NEW]
  DOES      fixes the cause of what an attack measured
  CONSUMES  the same as siege-happy-fixer: the minting observation, the inherited payload
  WRITES    the same
  DONE      the same, with one inversion below
  FROM      siege-happy-fixer, plus `siegemaster-stress-statics`' own layer rule

  Every step of siege-happy-fixer, with ONE inversion at step 3:
    write the failing test at whichever layer OWNS the behaviour — a contract, a guard, a
    broker, a responder. **NEVER a Playwright spec.** That is the opposite of the happy
    fixer's rule, and it is why these are two prompts rather than one with a branch
```


#### The other six

Two of these hold no units at all, which is why hole 13 matters to them and to nothing else: they
declare their own outcome through the `outcome` payload, exactly as a planner does.

```
spiritmender · the `repair` step in FIVE graphs                            [NEEDS REWRITING]
  DOES      fixes the failures one gate named, and nothing wider
  CONSUMES  get-quest-work → the failing ward run id and its detail blob path, the failing
            CHECK TYPES and file list, OR the riftcarver `.log` path when the repair sits in
            that graph · the paths prior sessions committed, served · prior notes
  WRITES    quest-work → outcome. **It holds no units**, so `done` cannot derive from marks
  DONE      every failure in the blob fixed, or named on the outcome. `unmet` routes it back
            to itself; the gate that minted it re-runs and decides
  FROM      today's prompt, minus its git section and its commit

  1 get-quest-work({ questId, workItemId }) — the blob path and the failing check types
  2 Read the blob for the full error output: files, messages, jest diffs
  3 reproduce: `npm run ward -- --only <checks> -- <the failing files>`. **Never
    `--committed` or `--uncommitted`** — either sweeps a whole half of the branch instead of
    the failures you were sent to fix. Every path is a FILE; a bare directory pulls in the
    package and the run gets backgrounded
  4 `<checks>` comes from the blob, which names one check type per failure. Five valid
    names: lint, typecheck, unit, integration, e2e. There is nothing to guess
  5 read what prior sessions built — SERVED, not `git log`. A `pt`-style repeat means an
    earlier session already fixed part of this scope
  6 load standards; get-folder-detail per folder type you touch
  7 diagnose each error to ROOT CAUSE by kind — a type error is a missing import, a wrong
    brand, a stale interface or a real logic bug, and which it is changes the fix
  8 four root causes are common here and none is obvious: a stale `shared/dist` seen ONLY as
    a lint failure; a broken proxy chain after a contract changed; a branded-type mismatch;
    a missing companion file
  9 fix in dependency order: imports → types → tests → lint
 10 four things you never do: weaken a test to make it pass (`toStrictEqual` → `toMatchObject`
    counts, so does deleting it); `any` / `as any` / `@ts-ignore` / `@ts-expect-error`;
    delete code to avoid an error; add an `eslint-disable`
 11 fix wherever the fix actually LIVES. A failure left standing because its cause sat one
    file over is a failure you did not fix
 12 run no bare whole-repo ward. The gate that minted you re-runs after you, and that is its
    job rather than yours
 13 declare the outcome and signal. **No commit** — see the gap below
  NOTE: the six symptom-hiding shapes belong in this prompt too, per the siege decision. A
  repair that makes a red go away by loosening the thing that was red is reviewed by nobody

warpgate · single-step graph, appended at merge                            [NEEDS REWRITING]
  DOES      lands the quest branch on the local base branch as ONE commit
  CONSUMES  get-quest-work → `baseBranch` and `worktreePath`, typed
  WRITES    quest-work → outcome. Holds no units
  DONE      one commit on local base, worktree clean, nothing fetched and nothing pushed
  FROM      today's prompt, minus its commit gate

  **THE ONE EXCEPTION to "no session runs git".** Driving git IS the job. It is a one-step
  family with no `CLOSE_OUT`, so there is no deterministic `commit` step to collide with it.
  Anyone reading the universal rule and taking warpgate's git away stops the merge working.

  1 take `baseBranch` from the served scope. **Never probe for the default branch and never
    `git fetch`** — both are hard prohibitions, alongside `stash`, `reset` and `rebase`
  2 is the base tip already an ancestor of the quest branch? Yes → skip steps 3 AND 4
    entirely. You would prove nothing by merging base into a branch that contains it
  3 merge base INTO the quest branch, in the worktree, and resolve every conflict THERE.
    Base never receives an unproven merge. Leave no `<<<<<<<`, `=======` or `>>>>>>>` line
    in any tracked file — a leftover marker means the merge is not finished, whatever the
    exit code said
  4 run ONE whole-repo `npm run ward` in the worktree — no `--only`, no paths. You are
    checking that a BASE MERGE did not break something outside the quest's own files, which
    a scoped run cannot see. **Read the exit code and branch on it.** A session that runs
    ward, ignores what it returned and carries on puts a broken tree on base
  5 repair what the merge broke, at root cause, then run a FRESH whole-repo ward. **This
    loop is deliberately unbounded.** Base's tip stays exactly where it started while ward
    is red
  6 commit the intake merge and every repair, message beginning `warpgate:`
  7 move to the REPO ROOT checkout — base cannot be checked out in two worktrees at once.
    Uncommitted work there that checking out base would destroy is a `wall`, named by exact
    path. Never stash it, never reset it
  8 `git merge --squash` the quest branch, then commit it yourself. Base gets ONE commit per
    quest
  9 declare the outcome and signal. No push — the user decides whether to publish

chaoswhisperer (/dumpster-create) · CHAT, no graph                     [wording fixes only]
  DOES      runs the whole spec lifecycle with the user, up to `approved`
  WRITES    the full spec surface — flows, observables, contracts, packagesAffected. Never
            `operations`, at any status
  WORDING   two fixes and nothing else: the design stage no longer has an agent behind it,
            and `verifyByReading` is one of only two roles that may set it — it decides
            which units leave both verify families' denominators
  mint quest → title + explore_flows → map codebase → interview → classify runtime vs
  operational → author tagged nodes and labelled edges → review_flows → sweep observables →
  declare contracts + packagesAffected → gap-minion → re-check tags LAST → review_observables

bughunt (/dumpster-hunt) · CHAT, no graph                                      [untouched]
  mint bug-hunt quest → one flow PER BUG → fork at the divergence into ACTUAL:/EXPECTED:
  → observables on the EXPECTED side only → contracts → review_observables
  The prefixes are a LABEL convention, not a contract field. Nothing typechecks them, so the
  prompt that writes them and the prompts that read them must spell them identically

tavernkeeper · CHAT, no graph                                                  [untouched]
  read the question FIRST → load only what it needs → start the dev server only if needed
  → load standards → land the tweak with its colocated test → answer, go idle.
  Writes NOTHING to quest.json. No signal-back. It is also the one reader of
  `devServer.devCommand`, which is why a grep for readers missed it

chaoswhisperer-gap-minion · the ONLY surviving true minion                   [one dead step]
  fetch prompt → get-quest(stage:'spec') → map + standards → review flows semantically →
  review design decisions → review each observable → verify `existing` contract claims
  against the tree → hunt logic gaps → emit findings per step → report by severity.
  Read-only. No write, no signal-back, no sub-agent.
```

**A gap this inventory found, now fixed in the config above: nothing committed a `repair` in
`riftcarver` or `wardFull`.** `CLOSE_OUT` is spread into the three code-changing families only, so
those two graphs ran `gate ⇄ repair` with no `commit` step anywhere. A spiritmender that fixed a
whole-repo red left the fix uncommitted, the re-run graded it, and the quest then reached
`@complete` with work sitting in the working tree — which `warpgate`'s `git merge --squash` drops.
That is the same defect wave 4 fixes for the other three families, and it survived because
"every code-changing family ends with the same close-out" quietly meant "the three that run
`CLOSE_OUT`". Both graphs now declare their own `commit` step, routing back to the gate by name
rather than by the return edge, since each has exactly one gate to return to.

**A second gap, also now closed: nothing PUSHED any more.** Deleting the reviewer's git took its
bare `git push` with it, and `warpgate` is prohibited from pushing, so every commit after the carve
would have stayed local. The `commit` handler pushes — see "Committing becomes a deterministic step"
above, which also settles what its message says, since a handler writes no prose.

**`glyphsmith` is gone from this list because the role is deleted** — wave 8 does it. The design stage and
`design_approved` stay; a human set that flag anyway.

**`bughunt` and `tavernkeeper` really are untouched in this pass.** An earlier draft claimed all three
"untouched" prompts turn out to need work and promised the detail in the gap list below. No such row
was ever written and the finding behind it is lost. Rather than keep a claim with nothing under it:
if there is work in those two, it has to be re-derived against the inventory before step 6 writes
anything, and nothing in this plan depends on the answer.


---

# The siege role rulebook — what each siege prompt must SAY

The maps above name each step's job, its calls and its endpoints. This is what goes INSIDE the siege
prompts, and it is the half a rewrite drops when nobody wrote it down.

the step maps above names each step's job, its calls and its endpoints. This section is the rules that go INSIDE those
prompts, and it is the half a rewrite drops when nobody wrote it down. It was moved here from
`scrolls/seigelense/remaining-build-items.md`, which keeps the siegelense tool's own remaining work
and no longer holds any prompt rule.

**The headline finding: no siege prompt knows siegelense exists.** Four prompts ship today —
`siegemaster-prompt-statics.ts` (the operator), `siegemaster-verifier-statics.ts` (the happy walker),
`siegemaster-stress-statics.ts` (the antagonist), `siegemaster-reviewer-statics.ts` (grades repairs).
A search across every orchestrator prompt for the words `siegelense`, `recipe` and `instance` returns
nothing. All four are built around a **lane** — a file-command-driven trio of headless Chromium, an
API server and Vite living in `packages/web/test/siege-driver/` — and that directory is deleted by
`scrolls/seigelense/remaining-build-items.md` §18. **This wave's prompt rewrite and that delete cut over together**, or the
new prompts are written against a mechanism about to be replaced.

### 9a. Every prompt fetches its own `docs` scope rather than carrying the tool's rules inline

`siegelense-call-statics.ts:36` pins seven scopes, and `docs-statics.ts` gives each its own audience
line and its own subject. **Not one orchestrator prompt fetches any of them.** Measured: the word
`docs` appears in zero of the 55 statics files under `packages/orchestrator/src/statics/`.

Fetching buys one source for how the tool behaves, and a vocabulary bounded by the role — the
operating scope carries no browser verb at all, which is what stops a session that dispatches from
starting to drive.

| Step | Fetches | That scope's audience, in its own words |
|---|---|---|
| `recipe-maker` | `docs { for: 'planning' }` | "the session that writes the test sequence and proves that the application reaches its starting state" |
| `siege-happy-walker` | `docs { for: 'walking' }` | "the session driving a browser against one instance and recording what it reads" |
| `siege-adversarial-walker` | `docs { for: 'attacking' }` | "the session running attacks against one instance and measuring what breaks" |
| both siege fixers | `docs { for: 'fixing' }` | "the session that arrives after the walk is over and the instance is gone" |

**A prompt and its scope are one edit.** Adding a step means adding its scope, and a step fetching a
scope written for a different audience is worse than fetching none: it arrives holding verbs its own
prompt forbids, and the first thing it does with them is the thing its prompt refuses.

**Three steps in this family fetch nothing, and each absence is load-bearing:**

| Step | Why no scope |
|---|---|
| `siegemaster-reader` | it opens files. It calls no tool, starts no instance and holds no lane, so the driving vocabulary would only be a route to misuse |
| `siege-planner` | it plans. It drives nothing, and the walking scope would teach it to |
| `spiritmender` | it is not a siege step. It fixes what a ward gate named |

**Two scopes are left with no prompt reader, and each has a different answer.** `operating` addresses
"the session that opens and closes a pool of instances and assigns tasks to other agents" — which,
after the operator section below, is the ROUTER. It keeps the scope and loses the reader: its rules become the router's spec,
which is a better place for them than a prompt that could ignore them. `operational` addresses "a
session verifying a flow that has no screen", which the operational-flows section below routes to codeweaver instead; whether it is
deleted or re-pointed at a whole-quest off-map item is the one live question, and
`scrolls/seigelense/remaining-build-items.md` the reader section below holds it. `driving` keeps its reader and needs no
prompt work: it addresses a session nobody dispatched, which fetches the scope itself.

**One rule the `walking` and `attacking` scopes need trimming for:** neither may teach `start` or
`kill`. The router owns both verbs now, and a walker holding them will use them the first time
something looks wrong.

### 9b. `recipe-maker` — the rules behind the step maps above's step map

**Its deliverable is a COMPLETE seed set for the walks it was asked about, proven by running it.**
Every path the requesting session will drive gets a SETUP — the runnable batch that carries a fresh
instance to that path's entry state — every setup names only recipes that exist, and every one of
those recipes is run during this session. A path left without a proven setup is a path no walk may be
sent down, so a gap here does not degrade the pass; it removes coverage from it.

Walk by walk:

1. Read the walk paths the request names — every route through the flow.
2. For each path, work out the state that makes it reachable.
3. Match those states against existing recipes: `dungeonmaster siegelense recipes`.
4. **Make every recipe the set is missing.** Where existing ingredients compose to the state, write
   the recipe itself in a few lines. Where the state needs an entity nothing declares yet, that is an
   INGREDIENT — see the open question below. **"No recipe covers this path" is not an outcome this
   step may return.**
5. **Run every recipe the set uses — the ones it wrote and the ones it found alike — as the SEQUENCE
   the setup submits**, against a throwaway instance, and confirm it lands where it claims. Not each
   recipe alone; the sequence, end to end.
6. Record the run id that proved each one onto the flow.

**Step 5 is the one that cannot be skipped.** An unproven recipe does not fail loudly; it manufactures
false defects. A recipe that claims two rows and seeds one leaves the walker looking at a one-row
list. The walker reports a defect correctly. A fixer is briefed against a symptom that does not exist
and hunts in working code. A whole round is spent and nothing in the record says the seed was the
problem.

The quieter version is worse. A recipe seeding *one* of something an assertion must tell apart makes
"the right one" and "the first one" the same value, so an off-by-index bug passes and the clean result
means nothing.

**It runs every recipe it uses, not only the ones it wrote.** An ingredient's `write` route mimics a
shape production owns and can drift from it silently. Nothing about that drift touches the feature
under test, so nothing else catches it.

**Seeding the same thing twice and comparing is a step in this session, and it is the one check for a
randomised on-screen value that travels to a repo nobody here has seen.** Seed one recipe into two
fresh instances, read both screens, compare. Every value a recipe supplied is identical by
construction, so **whatever differs is a value the app generated and then displayed.** That is the
whole reason it works without knowing the domain. It depends on the element delta on `look` and on
`compare`'s `elements` field, both of which are `scrolls/seigelense/remaining-build-items.md` §13 and are not built.

**What a setup holds, and three properties it has to keep:**

```
PATH 3   entry → guild selected → quest open → row expanded → chain rendered
  SETUP                                      ← reaching the path's entry state
    seed  guild-mid-execution                              as: g
    seed  quest-mid-execution  guild:{g.guild.id}          as: q
    goto  /{g.guild.urlSlug}/quest/{q.quest.id}
    click [data-testid="EXECUTION_ROW_0"]                  ← no recipe covers this; it is a step
  MID-WALK                                   ← seeds that fire PARTWAY, not at the start
    at node  chain-rendered:
      seed  subagent-chain-arrives  quest:{q.questId}
  VERIFIED  run_7 · 2026-09-14 · setup reached the entry, every plan's output asserted
```

- **The setup is a runnable batch, not prose.** It is submitted to a walk, not described and
  re-derived.
- **It mixes recipes and driving steps.** A row that must be expanded before the thing under test
  exists is not seeding, and no recipe should pretend it is.
- **Mid-walk seeds are keyed to the node they fire at**, not appended to the end. A mid-walk seed
  recorded as part of the setup silently turns a live-update test into a fresh-render test.

**Where the guide's eight headings went** — the step maps above has the table, and the reason each one stops being work
is the same: all three of `SEEDING`, `CONTROLS` and `TRAPS` existed because a walk had to work
something out, and all three stop being work once something durable answers. `SEEDING` becomes the
recipes this step proves. `CONTROLS` becomes the key — the text tree of the screen the tool produces.
`TRAPS` becomes the committed app-oddities file, which is `scrolls/seigelense/remaining-build-items.md` §3 and is not
built.

**OPEN — writing an INGREDIENT needs a home, and a sub-agent is not it.** A recipe is composition and
`recipe-maker` writes one itself in a few lines. An ingredient means reading the production writer,
declaring `links`, `routes` and `copies:`, and proving it with a colocated test — enough reading to
spend the context the remaining paths need. The scroll's answer was a `guide-recipe-writer` sub-agent,
one per missing ingredient, capped at two at a time. **That is exactly the black box this plan
exists to delete**, so under the step model it becomes a step of its own, `mintableOnRequest`, in both
graphs that carry `recipe`. The rules that come with it either way:

| Rule | Why |
|---|---|
| its first question is whether existing recipes already compose to the state | a new ingredient where two compose makes the book worse while looking productive |
| **it fills `copies:`**, because it has just read the production writer | left for later it is a guess, and a wrong `copies:` pointer makes the drift test assert against the wrong thing — worse than no pointer, because it passes |
| it is briefed in the flow's words, never from an implementation detail | handed the code to start from, it writes an ingredient for whatever the code happens to do |
| the same session that wrote an ingredient diagnoses it when `recipe-maker`'s run does not land | it already holds the production writer it read, the `routes` it declared and the `copies:` it filled. A fresh session pays to re-read all of it before it can say anything |
| the diagnosis brief carries the READINGS from the run that failed | otherwise it is "this is broken, go look" rather than a diagnosis starting from a measured symptom |
| a break that turns out to be production changing shape is a finding about the app | it becomes an observable, not an ingredient patch |
| **`recipe-maker` re-runs the setup itself on every return** | a sub-session's claim that its ingredient works is not evidence, and that is as true of a repair as of a first draft |

The diagnosis is bounded by the route that failed: a `write` failure means diffing the `copies:`
target against what the ingredient writes; an `api` failure means the real code path changed — read
the handler; a `recording` failure means the recording is of a version that no longer exists —
re-capture, do not patch. **That third row is not performable today** and must not reach a prompt
until `scrolls/seigelense/remaining-build-items.md` §5c gives a recording something to check. A two-route ingredient
narrows it before anyone reads anything: run both routes and compare. Agreeing routes mean the drift
is not here; disagreeing ones name the field that moved.

**Two decisions this step needs that the step maps above does not settle:** whether `writeIngredient` is a step or
stays a sub-agent, and how a single `request` payload mints three of them at once when three
ingredients are missing. The router's request rule mints one step per request.

### 9c. `siegemaster-reader` — the one session on a siege pass that opens a source file

*Returns values. Drives nothing. Signs nothing. Dispatches nothing.* **Decided: it ships**, as the
`read` step in wave 1's step graph's siegemaster graph, requested by the planner and by a walker alike.

**The problem it solves.** A walker may not open a source file — the happy-walker section below makes that absolute, and the
trial measured why. But some units name a value only source holds: "the list caps at the configured
maximum", "the default timeout". **A walk told "read no source" facing one of those either breaks the
rule or stalls, and breaking it is what actually happens.**

> Unit: *the quest list caps at the configured maximum.*
> The walker drives the app and counts 50 rows. Is 50 the right number? It lives in
> `questListStatics.ts:12`, which the walker may not open.
> The reader returns one line — `quest list cap  50  questListStatics.ts:12` — and the walker measures
> what it counted against it, having never read the list's implementation.

**The two prompts contradict each other today, and the walker's own copy wins:**

| Prompt | Says |
|---|---|
| `siegemaster-verifier-statics.ts:222` — the walker's own | "**Read the implementation only for a value a unit names indirectly** — 'the configured cap', 'the default timeout' — where the number lives in the code and the unit does not spell it out. Use `discover` to find the symbol and `Read` to open it." |
| `siegemaster-prompt-statics.ts:226` — the operator's | an observable marked `(read-check)` "is settled by opening a source file, **which no round can do**" |

The operator believes no round opens source. The walker is told how to. The walking session reads the
walker's copy, so source gets opened.

| Rule | Why |
|---|---|
| It is the ONLY session on a siege pass that opens a source file | a walker that opens one holds it for the rest of the walk. The trial measured what that produces: six correct verdicts reached with the expected values known in advance, and no independent look anywhere in the pass |
| Every value it returns carries `file:line` | a value with no provenance cannot be told from one a session remembered, and the walker citing it cannot check it without doing the reading this step exists to prevent |
| **It returns a LOCATION or a CONFIGURATION — never an EXPECTED VALUE the unit should have carried** | handing that forward launders the contamination through one more session. The walk still measures the system against what the code intends, and now it is invisible, because it arrived as a fact in a brief |
| A unit whose expected value exists only in source is a `questNotes` open question | that is a spec defect — the unit is under-specified |
| It touches no instance and holds no lane | it reads files, so it runs beside anything, including a full pool of walks |

| When it runs | Why |
|---|---|
| requested by the planner, before the first walk | its answers go into every piece's notes, which is what lets the happy-walker section below's no-source rule be absolute |
| requested by a walker, mid-pass | a reading is one value for one unit, and a walk reaches that need at any point |

What it hands back:

```
OFF-SCREEN
  quest list cap          50      questListStatics.ts:12
  default guild slug      siege-1 guild-create-broker.ts:88
  outbox path             .dungeonmaster/event-outbox.jsonl   quest-persist-broker.ts:41
```

### 9d. The happy walker — nine rules, and the five-step rule for an implementation-detail unit

`siegemaster-verifier-statics.ts` exists. **None of these nine is in it.**

| Rule | Why |
|---|---|
| **A walker opens NO source file, for any reason.** What only source can answer arrives as a value in its brief | the contradiction in the reader section below, and the trial that measured it |
| **Selectors come from the running page, not from test files** | the trial's arm B read the e2e specs and learned the answers before driving. That removes the reason siegemaster runs at all |
| **The KEY is the default reading. `dom` is the escape hatch: last, expensive, narrow target** | the one measured cost in this design — `dom` on `body *` returned 58 nodes whose first entry carried an entire stylesheet. The prompt carries that one line; `docs { for: 'walking' }` carries the whole ladder |
| **An observable naming a className or any implementation detail is settled on what a PERSON would see** | the five steps below |
| **Every PATH walked is recorded with its instance id and run id — a CLEAN walk included** | the walked-note section below. The clean walk is the one an issue-only rule leaves unevidenced |
| A walk that sees its instance stop checks `status` BEFORE writing anything down | a dead driver leaves a blank screen, and "the page went blank" is exactly what a walker is trained to report. A fixer briefed against it hunts a rendering bug that never existed |
| A slow `start` is a QUEUE, not a hang — never a `wall` | the tool admits one boot at a time, so the third walk in a pool waits out two. `queuedMs` says so, and a session reporting a wall over it halts a quest for nothing |
| A dead instance is `unmet` with the `status` output — never self-healed, never `wall` | `wall` means no session of any role could pass. A crash is not that, and a session self-healing is one acting on a third of the picture |
| A DRIVER death is never a finding about the app; an API-SERVER death may be | a leak or an unbounded allocation that kills the server is a real defect, recorded WITH the server log as well as marked |

**The five-step rule for an implementation-detail unit.** Siegemaster handles the FLAGGED case
correctly today (`siegemaster-prompt-statics.ts:226`) and says nothing about a className observable
that reached its list unflagged. **Signing one on the class alone is the cheapest false pass in this
system** — the class is present, the stylesheet rule was deleted, the row is not red, the unit reads
`met`, and nothing in the record says the screen was never looked at.

1. **Ask what a person would SEE if it were true.** "The failed row is red", "the active tab is
   underlined". That sentence is the real observable and it is the one to settle.
2. **Measure that, RELATIONALLY.** The failed row's computed background differs from a non-failed
   row's. That needs the seed to produce **two of the thing the assertion must tell apart**, which the
   recipe book already requires for its own reasons.
3. **Read the class too, through `dom`** — `fields: ['className']`, narrow target. It corroborates; it
   does not settle.
4. **Record both.** A class present with the paint wrong is a finding, and a stronger one than either
   half alone.
5. **Where no painted consequence can be named at all**, the unit is a read-check that reached the
   wrong track. That is a `questNotes` open question — siegemaster may ADD an observable and may not
   reflag one.

### 9e. The antagonist — nine rules, and what it does with an operational flow

`siegemaster-stress-statics.ts` exists. **One principle generates almost all of these: the walker
measures against the UNIT, the antagonist measures against a BASELINE.** A walker asks whether the
screen shows the value its unit names, so its comparison is to a sentence in the spec. An antagonist
claims an ABSENCE — I attacked this and it did not fall over — and an absence is only evidence against
a known-good reading taken before the attack.

| Rule | Why |
|---|---|
| **It compares against a BASELINE, never the unit, and `health` is its fixed-shape reading** | `health` is its counterpart to the key: one shape, so two readings can be held against each other |
| **Its dispatch CARRIES the baseline** — the happy walk's instance id and run id for the path it is attacking | "inherits a verified-clean baseline" was a property with no mechanism. **It has one now**: `happyWalk` routes to `adversarial`, so every happy piece has drained and recorded before the first attack is minted, and the piece's `baselineFor` names which one. The router resolves it and serves both ids |
| It READS that baseline with `results`, which starts nothing — and looks for NO baseline it was not handed | reading a finished run needs no instance, so "touch none you did not start" does not forbid it. What it forbids is finding "some earlier walk of something similar", which is how a tainted baseline gets in |
| **On a SAD path the baseline is the ERROR rendered correctly, usually a toast** | comparing a failure branch against a happy screen reports the toast as damage. The inverse is worse: the app swallows the error, nothing paints, `pixelChange` reads `0%`, and "nothing changed" is written down as *it held* |
| A transient baseline — a toast, a flash message — is a PRESENCE question, never a pixel diff | it auto-dismisses, so a frame comparison against it reports a difference that is only timing. "Was the toast there, with that text" is a `look` at the key |
| **Three key columns are ITS columns**: `maxlength`/`pattern` in `attrs`, `live`/`alert`, and `invalid` | the declared cap is what it measures against, the live region is where a proper refusal LANDS, and `invalid` is the app stating its own verdict on the input — read, never assumed |
| Each attack declares the reset level it needs | `instance` destroys any uptime, monotonic or append-only measurement, so it cannot share a batch with a unit measuring one |
| **Every attack is recorded with the instance id and run id that ran it, held or not** | an absence with nothing behind it is the least checkable claim in this system |
| It is the role most likely to have CAUSED an instance death, which is exactly why it must not judge that itself | it corrupts and exhausts on purpose, so an OOM it triggered is a plausible finding rather than background noise |

**It never has to run on an operational flow, and the operational-flows section below is why.** Its whole vocabulary is `paste`, `key`
and `click`, and the three key columns above are all properties of a rendered control. With
siegemaster restricted to runtime flows, an operational flow is never handed to it at all.

**One rule its prompt still needs:** handed an operational flow anyway, it marks `unmet` naming the
mis-route, and never improvises. It always has `request` and `file`, so it can always do SOMETHING —
and that something is an attack nobody scoped, marked against a family the whole-quest item was going
to settle properly.

**OPEN — the whole-quest off-map item.** The scroll's argument is that an all-operational quest now
has no eligible siege flow, so siegemaster keeps ONE whole-quest item, and `hostile-input` and `perf`
get settled once against the running system rather than spread across screenless flow walks. **This
plan declares no such item** — the step maps above's siege planner returns `empty` on an all-operational quest and the
family closes. See the operator section below.

### 9f. The fixers — two rules built, two missing, one contradicted

| Rule | State today |
|---|---|
| `RED FIRST` — watch a real test fail against unchanged source, for the right reason | **built**, verbatim at `siegemaster-prompt-statics.ts:667` |
| Cap two fixers, only over a disjoint file set | **built**, verbatim at `siegemaster-prompt-statics.ts:374`. Under this plan the ROUTER holds the cap, not a prompt |
| A fixer touches no instance it did not start | **built**, and now stronger: a fixer starts nothing because the ROUTER starts instances, and a fixer's step does not declare `needsLane` |
| **A fixer writes the regression test using the same recipes the setup named** | missing; no recipe concept in any siege prompt |
| A fixer RE-RUNS THE SETUP on a fresh instance | **decided against.** The scroll called today's ban a contradiction; the ban stands. A fixer proves its work through ward, and the RE-WALK is the live proof — a walker's `unmet` mints the fixer, and the fixer's `done` returns to that walker, which drives the path again on a fresh instance. A fixer holding its own instance would consume a capacity slot nothing budgeted for, and would prove the symptom gone in a session nobody re-measures |

**The recipe rule is the point of the whole recipe book for a fixer. The hard part of writing a
regression e2e was always the setup.** A recipe returns a plan, an ingredient's `write` route is pure
`fs` and its `api` route is a `fetch`, so the state a walk ran against and the state its regression
test runs against come from the same plan handed two different targets. The alternative is what
happens today: the fixer re-derives the setup in the e2e's own idiom, gets it subtly different, and
the test passes against a state the walk never saw. **The plumbing is already built; only the
instruction is missing.**

**One dependency on the tool:** `results` must still answer for a killed instance, flagged as gone,
and reading it must start nothing. The walker's instance is gone by the time a fixer reads its record.
Without that, a fixer holding a run id finds it resolves to nothing, and the handoff depends on the
walker having hand-copied every reading.

### 9g. The operator's job goes to the ROUTER, not to another prompt

**Six rules were written against a session this plan deletes, and none of them becomes prompt text.**
Every one lands on code — which is the better answer, because a rule in code cannot be ignored by the
session it binds.

| The operator rule | Now |
|---|---|
| A crashed walker is answered by a FRESH walk on a fresh instance — never by reading the dead run to salvage it | **the `unmet` route.** A verdict assembled out of half a run plus a second run is not a walk. An issue the walk already wrote down keeps its own evidence and reaches a fixer regardless |
| Refuse to dispatch a walk down a path whose recipe is missing or unproven | **a plan-validation check**, already in wave 1: every `recipeId` a piece names is recorded on that flow AND carries the run id that proved it |
| The operator allocates two lane names per round | **the router's**, along with `start` and `kill` — see below |
| Run the pass in TWO PHASES — every happy walk, then a STAMP, then every adversarial walk, never interleaved | **the step chain.** `happyWalk` routes to `adversarial`, and a step's `done` fires only when every piece at it has drained. The STAMP is that route firing. wave 1's step graph has the rule and the plan contract refuses a batch that mixes the two steps |
| Call `cleanup` at the START of the pass and again at the END | **two deterministic steps**, `sweepIn` and `sweepOut`, bookending the siegemaster graph. Two bookends make the first `capacity` reading honest and catch what this pass leaked, without a daemon watching. They are ledger rows, so a leak is visible rather than inferred |
| No phase advances while any instance is in an unknown state; after a death someone owns `status`, reaping orphans, re-reading `capacity` and re-dispatching | **the router**, because the router now starts and stops every instance |

**The router owns instances outright, and that is the load-bearing consequence.** It was already
reading `siegelense capacity` to decide how many lane steps may run at once. A reader that does not
also spend is a split the two halves drift across, so the router `start`s an instance before
dispatching a `needsLane` work item, substitutes the **instance id** into that prompt beside the quest
and work item ids, serves the manifest through `get-quest-work`, and `kill`s it when the work item
records. "Concurrency is measured" under the step maps above has the table.

**What that buys, stated so nobody trades it away later:** a session that dies mid-walk strands
nothing, because reaping is tied to the work item recording rather than to a prompt step running. No
two sessions can hold different beliefs about the pool count. And `suggested` cannot drift from the
number actually started, because one piece of code does both.

**The one rule it forces into a prompt anyway** is the antagonist's, and the antagonist section below carries it: a probe that
kills the instance is marked `unmet` with the `status` output and the points not yet driven, and the
router mints the continuation on a fresh instance. A session that cannot restart cannot hide a restart
in its transcript.

### 9h. Codeweaver's reviewer takes the operational units

**No `siegemaster-operational` role is built, and none should be.** wave 1's "Operational flows and nodes"
table is the decision; this is the reasoning and the rules that move with it.

**An operational flow has nothing to walk, and the contract already says so.**
`flow-type-contract.ts:12-14`: "An operational flow is a one-time task sequence executed by the
engineer or Codeweaver to achieve a state change — refactor sweep, infrastructure setup, lint rule
registration. It is verified by Siegemaster checking the final state, not by walking paths." A
one-time sequence has no paths, and its final state is a fact about the source tree — this file is
gone, this import is there, this rule is registered. **That is a READING, and this repo already has a
track for readings.** `verifyByReading` marks exactly this kind of criterion and is already settled by
codeweaver's reviewer opening the file.

**Also update the contract's own comment.** `flow-type-contract.ts:13-14` says an operational flow "is
verified by Siegemaster checking the final state". After this change it is not.

| Rule | Why |
|---|---|
| An operational unit is settled by codeweaver's reviewer, and no siege mark is expected on it | a unit no step can close is one an agent invents a mark for — the same reason a `verifyByHuman` unit is filtered out of every work item's view |
| A runtime flow's non-browser units stay with the BROWSER walker | reaching a log line that only exists after four clicks needs the path driven. That is one more step in a batch already there, against a whole second walk. This does NOT move to codeweaver |
| **The evidence is the TREE — a path that is gone, an import that is there, a rule that is registered** | there is no run to observe and no picture to take. Its final state is a filesystem fact, and that fact is the whole verdict |
| The repo's "the browser UI is the verdict" rule is untouched | that rule governs a flow that HAS a UI |
| **The mark names the state it read, path by path — never that the sequence was followed** | "I did the steps" is the executor grading its own work, and codeweaver IS the executor. `deleted X` and `Y imports Z at line N` are checkable by the next reader; "the refactor sweep completed" is not |
| A unit whose final state the reviewer cannot see from the tree is `cant-meet` with a `toSettle`, never `met` on the sequence having been followed | same reason, from the other end |

**The cost is INDEPENDENCE, not liveness.** There was never anything to drive. What is lost is the
separation: the flow-type contract names codeweaver as the thing that EXECUTES an operational
sequence, and this makes codeweaver's own reviewer the thing that confirms it landed. A mark that
names the state on disk is what keeps that survivable.

### 9i. The spec authors — ChaosWhisperer and BugHunt

the step maps above gives ChaosWhisperer "wording fixes only". These are the fixes, and one is a live drift.

| Rule | Why |
|---|---|
| **An observable naming an IMPLEMENTATION — a className, a hook, a prop — is a READ-CHECK, authored with `verifyByReading`** | a class name is the mechanism behind something a person sees, never the thing itself, and it can move to an inline style or a generated hash without the outcome changing |
| **Phrase the observable as what a PERSON would see** — "the failed row is red", not "the row has `.failed`" | an observable written in the implementation's words hands a walk the mechanism instead of the outcome, which does to it automatically what reading source did to the trial's arm B |
| The human-check category stays NARROW: motion quality and taste, nothing else | contrast, alignment and clipping are computable, and a model can judge an error message's clarity. A long list is a list nobody works |

**The declared-value enumeration is duplicated and has already drifted, in the dangerous direction —
the author's list is narrower than the reviewer's, and the author is the only role that may set the
flag:**

| Copy | Says |
|---|---|
| `dumpster-create-prompt-statics.ts:163` (the author) | "A font size, a colour token, a class name, a border, a padding, an animation duration, a typeface…" |
| `chaoswhisperer-gap-minion-statics.ts:191` (the reviewer) | "a font size, a colour **or colour token**, a class name, a typeface, a border, a padding **or margin**, an animation duration…" |

A raw colour and a margin are declared values the reviewer catches and the author never flags. Extract
one interpolated statics, add the siege consequence to its rationale, and give it to both. **And no
siege prompt has any rule for an unflagged declared-value observable** — the rule exists, and the gap
is on the walker, which meets one and has nothing telling it what to do. the happy-walker section below's five steps are that
rule.

### 9j. Registering a new prompt — three places, none of which has it

`agentPromptClassificationStatics.ts:36` holds the exhaustive roster of served prompt names. Every
prompt the step maps above adds needs a row in three places, or `get-agent-prompt` cannot serve it:

| Place | What goes in |
|---|---|
| `agentPromptNameContract` | the name |
| `agentPromptClassificationStatics.minionNames` | the name, for anything dispatched rather than chatted with |
| `agentNameToPromptTransformer` | the name plus its model — sonnet for every worker, opus for every planner and reviewer |

**`recipe-maker` and `siegemaster-reader` are inline prose today**, briefing a generic
`Agent(subagent_type: "general-purpose")` from inside `siegemaster-prompt-statics.ts`. A generic brief
cannot carry what the recipe-maker section below and the reader section below put on these roles, so both become served prompts with all three
registration points. **Wave 1 opened `agentPromptNameContract` to free strings**, so the contract half
becomes a lint-and-load reachability check rather than an enum edit — but the classification and
transformer rows are still required, and a missing one is a step that dispatches against nothing.

### 9k. Not a gap — the unowned session is already served

A session nobody dispatched — a developer's own, or one told to drive the app — needs its own rules:
`capacity` before starting, `start` queues, `kill` is mandatory because nothing else will do it, its
instance is filed under `unowned/` with no quest reference protecting its evidence, and `start` hands
back the id and the evidence directory because nothing lists and nothing searches.

**`docs { for: 'driving' }` is built and carries all of it.** No prompt work needed.

### 9l. Every walk records the instance and run that ran it

`questNoteKindContract` holds `walked`, and `questNoteContract` carries typed `instanceId` and `runId`
beside the prose — which is what lets `prune` and `cleanup` resolve a `WALKED` citation mechanically
instead of matching an id buried in a sentence. **Both fields are `.nullish()`, no refinement forces a
`walked` note to carry them, and nothing requires a walk to record one at all.**

**Every path walked carries the instance and run that walked it, a CLEAN walk included**, because that
id is the proof the path was driven rather than claimed — the same thing a setup's `VERIFIED` line
does one level down. And it is the only handle anything has on that walk's evidence: the tool keeps
the run for its retention window and offers no way to find it without the id. Nothing browses.

**This answers half of the step maps above's open shape question about "notes from previous sessions".** A walked note
is `quest.planningNotes.questNotes[]` keyed `{role, workItemId, flowId?, unitId?}`, written by the
walker, and it is a different thing from the plan's per-piece `notes: ["trap: …"]`, which the planner
writes. Both are served by `get-quest-work`; only the first is written by a running session.

---

### 6p — the shared blocks

```
OWNS      a new statics holding the SAD-PATH block and the MARKING block, interpolated
          verbatim into every non-planner prompt
          the declared-value enumeration, extracted from its two drifted copies
NO TOUCH  any prompt body — every other session in this wave interpolates what you write
DONE      each block exists once and is interpolated, never copied
ASSERT    a shared block is a CONTRACT on every prompt that takes it. The pattern to copy
          is standards-review-concerns-statics, already interpolated into three prompts.
          Assert byte-equality across every interpolation site
```

**The declared-value drift is live and in the dangerous direction** — the author's list is narrower
than the reviewer's, and the author is the only role that may set the flag. A raw colour and a margin
are values `chaoswhisperer-gap-minion-statics.ts:191` catches and
`dumpster-create-prompt-statics.ts:163` never flags. The spec-author section of the rulebook below has both quotes.

---

### 6q — registration, and the five deletions

```
OWNS      packages/orchestrator/src/statics/agent-prompt-classification/…
          packages/orchestrator/src/transformers/agent-name-to-prompt/…
          the deletion of glyphsmith-prompt/, siegemaster-reviewer/, and the three
            operator prompts — codeweaver-prompt/, flowrider-prompt/, siegemaster-prompt/
NO TOUCH  role-to-model-statics — it survives for chat roles only, and wave 4 already
          superseded it for the six families
DONE      every prompt this wave adds is servable, and no deleted name resolves
ASSERT    wave 1 opened agentPromptNameContract to free strings, so the CONTRACT half becomes a
          reachability check. The classification and transformer rows are still required,
          and a missing one is a step that dispatches against nothing — assert that, per
          new name
```

**Do not delete the three operator prompts until 6a–6i have landed.** They are what those sessions cut
from, and `siegemaster-prompt-statics.ts` alone is 46,663 bytes of rules that have to find a home.

---

## The siege prompts cut over with a siegelense delete

`scrolls/seigelense/remaining-build-items.md` §18 deletes `packages/web/test/siege-driver/` — three
files, 964 lines. **Every siege prompt today drives that lane by name.** Do it first and every other
item in that scroll gets done twice; do it last and 6g–6m are written against a mechanism about to be
replaced. Cut them together, and note that §18 gets no help from lint: `siege-lane.ts` hardcodes two
package names and passes `no-hardcoded-package-names` clean.

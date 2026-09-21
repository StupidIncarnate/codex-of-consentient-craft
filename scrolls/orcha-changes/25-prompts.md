# 25 — the prompts (a set of 19)

```
GOAL      Nineteen prompts: nine new, two adapted, four rewritten, five deleted, one
          wording fix. One session each.
AFTER     18 — every one begins with `get-quest-work` and none can be written until its
          return shape is fixed. They can be WRITTEN before 22 lands; they cannot RUN.
PACKAGE   @dungeonmaster/orchestrator
```

**One session per prompt, and that is not over-splitting.** Each is budgeted against a
50,000-character ceiling, and today's operator prompts are already 44,301 and 49,216 bytes.

**Every brief below is self-contained.** A session handed "do 25h" writes `siege-happy-walker` from
this file alone. The step maps are cut in from `scrolls/orchestrator-step-engine-plan.md` §8 and the
siege role rules from its §9, because a brief that delegates by section number is a brief that gets
executed by a session that never opened the section.

---

## The rule that kills this set if it is ignored

**Budget against `mcpToolResultStatics.maxVerbatimChars` BEFORE writing, not after.** Over the ceiling
the MCP layer spills the result to a file and hands the agent an error stub — **the session then holds
a path instead of its instructions, and nothing reports a failure.**

| | |
|---|---|
| The number | **50,000** |
| Where | `packages/shared/src/statics/mcp-tool-result/mcp-tool-result-statics.ts:32` — `maxVerbatimChars: 50_000` |
| How it is derived | `maxOutputTokens * verbatimTokenFactor * estimatedCharsPerToken`, asserted in the colocated test |
| How you measure | `expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars)` in your colocated `.test.ts` — the shape nine prompts already use |

**Measure the SERVED string, not the file.** A statics file's byte size includes its JSDoc header and
its TypeScript wrapper, and the template it exports interpolates other statics. `codeweaver-reviewer`
is 19,084 bytes on disk, 16,320 in its template literal, and ~21,565 served once
`standardsReviewConcernsStatics.markdown` (5,245 bytes) expands into it. Three numbers, and only the
third is the one the ceiling grades.

**No prompt in this set lands near the ceiling, and that is the measured answer rather than the
assumed one.** The tightest thing in the tree today is `codeweaver-prompt-statics.ts` at 46,726
template bytes — 3,274 of headroom — and splitting it three ways is what buys the room back. Write the
budget test anyway: it is the only thing that catches the next session that adds a block.

---

## The list

Every one owns its own directory under `packages/orchestrator/src/statics/`, so the set is
file-disjoint and runs in parallel.

| # | Prompt | Status | Cut from | Bytes today | Model |
|---|---|---|---|---|---|
| 25a | `codeweaver-planner` | NEW | `codeweaver-prompt/` steps 1–3 + the brief's authored blocks | 49,216 | opus |
| 25b | `codeweaver-worker` | NEW | the brief template's seven constant blocks | — | sonnet |
| 25c | `codeweaver-reviewer` | REWRITTEN | `codeweaver-reviewer/` steps 1–5, 8 + operator step 5 | 19,084 | opus |
| 25d | `flowrider-planner` | NEW | `flowrider-prompt/` steps 1–4 | 44,301 | opus |
| 25e | `flowrider-worker` | NEW | the constant blocks + BOTH `HOW TO WRITE THESE` sections | — | sonnet |
| 25f | `flowrider-reviewer` | REWRITTEN | `flowrider-reviewer/` steps 1–5 + `flow-evidence-contract/` | 16,494 | opus |
| 25g | `siege-planner` | NEW | `siegemaster-prompt/` steps 1–3 | 46,663 | opus |
| 25h | `siege-happy-walker` | ADAPTED | `siegemaster-verifier/` pass 1 + operator step 5 | 28,552 | sonnet |
| 25i | `siege-adversarial-walker` | ADAPTED | `siegemaster-stress/` pass 1 | 18,936 | sonnet |
| 25j | `siege-happy-fixer` | NEW | today's inline fixer brief | — | sonnet |
| 25k | `siege-adversarial-fixer` | NEW | 25j, with ONE inversion | — | sonnet |
| 25l | `recipe-maker` | NEW | today's inline phase-zero guide-writer | — | opus |
| 25m | `siegemaster-reader` | NEW | today's inline `OFF-SCREEN` instructions | — | sonnet |
| 25n | `spiritmender` | REWRITTEN | `spiritmender-prompt/`, minus its git section and its commit | 18,548 | sonnet |
| 25o | `warpgate` | REWRITTEN | `warpgate-prompt/`, minus its commit gate | 16,262 | sonnet |
| 25p | the SHARED blocks | NEW | — | — | opus |
| 25q | registration + five deletions | — | — | — | sonnet |
| 25r | `chaoswhisperer` wording | 3 fixes | `dumpster-create-prompt/` | 63,538 | sonnet |

**Every `Bytes today` figure above is confirmed against the tree.** The `Model` column is the model the
AUTHORING session runs on, not the model the prompt is served at — those are in each brief's `STEP`
row and come from story 05's config.

**Eighteen rows, and the nineteen in `GOAL` is a different count.** Nineteen is §8's roster of prompts
in the SYSTEM: the fifteen written here (25a–25o), plus `chaoswhisperer` (25r), plus the three nothing
in this story touches — `chaoswhisperer-gap-minion`, `bughunt`, `tavernkeeper`. Three of the eighteen
rows write no prompt at all: 25p writes shared blocks, 25q registers and deletes, 25r edits wording.

**25b and 25e have no source to cut from**, and both are bigger than they look: they inherit constant
text copied per-flow today that becomes served text.

---

## Facts every session in this set needs

### Where a new prompt gets registered — three places, all of them

`agentPromptClassificationStatics.promptNames` is the roster today. A prompt missing from any of these
three is a step that dispatches against nothing.

| Place | Path | What goes in |
|---|---|---|
| the contract | `packages/orchestrator/src/contracts/agent-prompt-name/agent-prompt-name-contract.ts` | nothing, after story 03. It becomes a branded `z.string().min(1)`, so this half is a reachability check rather than an enum edit |
| the roster | `packages/orchestrator/src/statics/agent-prompt-classification/agent-prompt-classification-statics.ts` | the name, in `promptNames`; and in `minionNames` for anything dispatched rather than chatted with. `roleNames` and `minionNames` are DISJOINT and the file says why — a minion in `roleNames` widens `agentRoleContract` with a role no operation item can hold |
| the resolver | `packages/orchestrator/src/transformers/agent-name-to-prompt/agent-name-to-prompt-transformer.ts` | the name, its statics import, and its model — sonnet for every worker, opus for every planner and reviewer |

**The resolver's exhaustiveness dies with story 03 and that is the trap.** Its `AGENT_PROMPTS` table is
`satisfies Record<AgentPromptName, unknown>` today, so a name with no prompt behind it fails to
compile. Once `AgentPromptName` is an open string that check is gone, and story 03 replaces it with a
loud runtime throw. **Nothing type-checks a missing row after that** — 25q's DONE condition is the
only gate left.

### The naming convention for a new directory

**The directory is the prompt name, verbatim**, and so is the statics file inside it:
`packages/orchestrator/src/statics/<prompt-name>/<prompt-name>-statics.ts`, with a colocated
`<prompt-name>-statics.test.ts`. That already holds for `codeweaver-reviewer`, `flowrider-reviewer`,
`siegemaster-verifier` and `siegemaster-stress`.

**The `-prompt` suffix is not part of it.** `codeweaver-prompt/`, `spiritmender-prompt/` and
`warpgate-prompt/` are named after a ROLE rather than a step, which is why they carry it.
**25n and 25o rewrite in place and rename nothing** — the resolver maps a name to a statics import, so
the directory name and the prompt name need not agree, and a rename is churn this story did not ask
for.

### The `docs` scope each siege prompt fetches — §9a

`siegelenseCallStatics.docs.scopes` at
`packages/siegelense/src/statics/siegelense-call/siegelense-call-statics.ts:36` pins seven:
`operating`, `planning`, `walking`, `attacking`, `fixing`, `driving`, `operational`. Each has its own
audience line in `packages/siegelense/src/statics/docs/docs-statics.ts`. **Not one orchestrator prompt
fetches any of them today.**

Fetching buys one source for how the tool behaves, and a vocabulary bounded by the role — the
operating scope carries no browser verb at all, which is what stops a session that dispatches from
starting to drive.

| Step | Fetches | That scope's audience, verbatim from `docs-statics.ts` |
|---|---|---|
| `recipe-maker` | `docs { for: 'planning' }` | `docs-statics.ts:104` — "the planner — the session that writes the test sequence and proves that the application reaches its starting state." |
| `siege-happy-walker` | `docs { for: 'walking' }` | `docs-statics.ts:164` — "the walker — the session driving a browser against one instance and recording what it reads." |
| `siege-adversarial-walker` | `docs { for: 'attacking' }` | `docs-statics.ts:275` — "the stress tester — the session running attacks against one instance and measuring what breaks." |
| both siege fixers | `docs { for: 'fixing' }` | `docs-statics.ts:353` — "the fixer — the session that arrives after the walk is over and the instance is gone." |

**A prompt and its scope are one edit.** A step fetching a scope written for a different audience is
worse than fetching none: it arrives holding verbs its own prompt forbids, and the first thing it does
with them is the thing its prompt refuses.

**Three steps in this family fetch nothing, and each absence is load-bearing:**

| Step | Why no scope |
|---|---|
| `siegemaster-reader` (25m) | it opens files. It calls no tool, starts no instance and holds no lane, so the driving vocabulary would only be a route to misuse |
| `siege-planner` (25g) | it plans. It drives nothing, and the walking scope would teach it to |
| `spiritmender` (25n) | it is not a siege step. It fixes what a ward gate named |

**One rule the `walking` and `attacking` scopes need trimming for:** neither may teach `start` or
`kill`. The router owns both verbs now, and a walker holding them will use them the first time
something looks wrong. **That trim is a siegelense-package edit, not a prompt edit** — name it in your
commit so 25h and 25i do not each assume the other did it.

**`driving` keeps its reader and needs no prompt work** — it addresses a session nobody dispatched,
which fetches the scope itself. `operating` loses its reader to the ROUTER and keeps the scope: its
rules become the router's spec. `operational` is OPEN — see below.

---

## The brief every prompt session gets

```
GOAL      write <prompt name>, a `<role>` step in the `<family>` graph
READ      packages/orchestrator/src/statics/<the source it is cut from>/
          this file's "what every prompt must carry" below
OWNS      packages/orchestrator/src/statics/<new-name>/
NO TOUCH  every other prompt directory. A sibling session has it open
DONE      the prompt is under maxVerbatimChars, MEASURED and stated; its step 1 is
          get-quest-work; every endpoint it names exists
WARD      npm run ward -- -- <your paths>
```

**Which checks.** A statics directory holds a `-statics.ts` and a `-statics.test.ts`, which is
`unit` only — so `npm run ward -- --only lint,typecheck,unit -- <your paths>`. Say in the commit which
checks you ran and why.

---

## What every non-planner prompt must carry

**Three blocks, written once in 25p and interpolated verbatim.** A shared block is a CONTRACT on every
prompt that takes it — copy the `standards-review-concerns-statics` pattern, which is already
interpolated into three prompts: `codeweaver-reviewer-statics.ts`, `flowrider-reviewer-statics.ts` and
`siegemaster-reviewer-statics.ts`.

### The MARKING block

**Mark each unit the moment you settle it, never in one block at the end.** Two reasons, and the second
matters more: a 40-visit step means long sessions are expected, and a session that dies having marked
nothing loses the whole piece; and marking at the end means transcribing from memory.

| Mark | Write it when | It must carry |
|---|---|---|
| `met` | you settled it and can say how | the evidence — a test `file:line` and the wrong value that turns it red, or the value measured off the running system |
| `cant-meet` | nobody in this role could settle it at this layer | `toSettle` — the action that WOULD settle it, as an instruction |
| `unmet` | real work remains | what is left, and what you already learned. That note reaches your successor |

**Three rules no gate can enforce**, so they are prompt text:

- **`unmet` is not failure and costs nothing.** A session marking its remainder `unmet` and stopping is
  doing the right thing. Pushing on with no context left is what produces a `met` nobody can trust.
- **Never mark a unit you did not settle.** The gate forces a mark on every one; it cannot tell a real
  `met` from a hopeful one. **This is the single sentence most worth getting right in every prompt.**
- **`toSettle` is an instruction, not a question.** *"Drive a real send through a live quest and read
  the session JSONL for a Read call on the written path"* — never *"how should this be tested?"*

### The SAD-PATH block

| Situation | What the agent does | Where it lands |
|---|---|---|
| out of scope / out of context | mark those units `unmet` with a note on what is left, then signal | the router mints part two on exactly those |
| cannot be settled at this layer, by anyone in this role | mark `cant-meet` with `toSettle` | the unit is settled; nothing re-opens it |
| environment wall — a denied command, a missing credential, an unreachable service | mark what is markable, then signal `wall` | the quest blocks for a human, carrying the reason |
| the plan itself is wrong | `quest-work` → `amendment`, then mark and signal normally | the router re-reads the plan |
| the seed is wrong or missing | request `recipe`, carry on when it returns | never invent a seed inline |

### The declared-value block

**Extracted from two copies that have already drifted, in the dangerous direction — the author's list
is narrower than the reviewer's, and the author is the only role that may set the flag:**

| Copy | Says |
|---|---|
| `dumpster-create-prompt-statics.ts:163` (the author) | "A font size, a colour token, a class name, a border, a padding, an animation duration, a typeface…" |
| `chaoswhisperer-gap-minion-statics.ts:191` (the reviewer) | "a font size, a colour **or colour token**, a class name, a typeface, a border, a padding **or margin**, an animation duration…" |

A raw colour and a margin are values the reviewer catches and the author never flags.

---

## The three OPEN questions, and who they block

**Each is repeated inside the brief it blocks**, so the blocked session sees it without reading this
section. They are collected here so whoever settles them settles all three in one pass — the second
and third are the same question one level apart.

| # | Question | Blocks | Who decides |
|---|---|---|---|
| **O1** | Who writes a hydration INGREDIENT — a step of its own, or a sub-agent of `recipe-maker`? | **25l** | plan §9b leans "a step, `mintableOnRequest`, in both graphs that carry `recipe`", and says a sub-agent "is exactly the black box this plan exists to delete". **Story 05's graph declares no such step.** So story 05's owner and the user, together — 25l cannot name a step nobody registered |
| **O2** | Does an all-operational quest get ONE whole-quest off-map item, or does siege close `empty`? | **25g**, and 25i's mis-route rule | plan §9e: "**This plan declares no such item** — §8's siege planner returns `empty` on an all-operational quest and the family closes." `scrolls/seigelense/remaining-build-items.md:571` calls the off-map item "the likelier answer" and defers to the plan. The user decides |
| **O3** | The `operational` `docs` scope — deleted, or re-pointed at that whole-quest item? | nothing in 25 directly; no prompt fetches it | **downstream of O2, and `remaining-build-items.md:552-575` holds it as §9c.** Deleting means editing `siegelense-call-statics.ts:36` and `docs-statics.ts:461`, and seven scopes become six. Re-pointing means rewriting its audience line. Settle O2 first |

**O1's second half is unsettled too, and §9b names it:** how ONE `request` payload mints three
`writeIngredient` sessions when three ingredients are missing. The router's request rule mints one step
per request.

**Until O2 is settled, 25g writes what the plan DECLARES** — `empty` on an all-operational scope — and
says so in one line, so a later flip is one edit rather than an archaeology exercise.

---

# The briefs

## 25a — `codeweaver-planner` · NEW

| | |
|---|---|
| **OWNS** | `packages/orchestrator/src/statics/codeweaver-planner/codeweaver-planner-statics.ts` + its colocated test |
| **CUT FROM** | `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts` — `### 1. Fetch your flow` (:167), `### 2. Explore the package` (:242), `### 3. Write your map` (:291), and the AUTHORED blocks inside `## Briefing a sub-agent` (:543): `FILES` (:572), `FACTS` (:589), `FENCES` (:598), `UNITS` (:604), and the content half of `TRAPS` (:634) |
| **STEP** | `codeweaver.plan` · `role: 'planner'` · opus · `maxVisits: 5` · entry · `routes: { done: 'work', empty: '@done', wall: '@blocked' }` |
| **FETCHES** | no `docs` scope |
| **BUDGET** | source file 49,216 bytes; the parts you cut measure 14,121 (steps 1–3) + 13,975 (the whole brief section, of which you take the authored half). Ceiling 50,000 |

**Where each of today's operator steps lands.** Splitting one 49,216-byte prompt three ways is mostly a
MOVE, and saying which part moves where is what stops a rule being dropped in the cut.

| Today's operator step | Goes to |
|---|---|
| 1 fetch the flow, read both `## Contracts` headings | planner |
| 2 standards, `get-project-map`, `discover`, then `Read` | planner |
| 2 `git log` for what earlier cells landed | planner, but **served** — it runs no git |
| 3 write the map — groups, FACTS, FENCES, PROVES, TRAPS | **the plan file.** `.quest-plans/<id>-map.md` stops existing |
| 3 the cross-package move table, `packagesAffected` | planner — the one `modify-quest` field it keeps |
| 4 the brief template's 5 authored blocks | the piece's `payload` |
| 4 the brief template's 7 constant blocks | 25b, the worker's served prompt |
| 4 sign each wave's `PROVED` lines | the worker marks its own units as it settles them |
| 5 read the diff, the four questions | 25c, the reviewer — and it reads FILES, which is what it always did |
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
```

---

## 25b — `codeweaver-worker` · NEW

| | |
|---|---|
| **OWNS** | `packages/orchestrator/src/statics/codeweaver-worker/codeweaver-worker-statics.ts` + its colocated test |
| **CUT FROM** | `codeweaver-prompt-statics.ts` — the CONSTANT blocks inside `## Briefing a sub-agent` (:543): `RED FIRST` (:612), the rules half of `TRAPS` (:634), `DO NOT TOUCH` (:640), `DISCOVERY` (:643), `THIS BRIEF IS A BEST GUESS` (:659), `PROVE` (:672), `RETURN` (:683). Plus `## Operating rules` (:77) |
| **STEP** | `codeweaver.work` · `role: 'worker'` · sonnet · `maxVisits: 40` · `routes: { done: 'review', unmet: 'work', wall: '@blocked' }` |
| **FETCHES** | no `docs` scope |
| **BUDGET** | no source file of its own. The parts measure 10,103 (constant blocks :612–761) + 4,258 (operating rules :77–137), plus 25p's MARKING and SAD-PATH blocks. Ceiling 50,000 |

**`TRAPS` is on both lists and that is not a mistake.** Its heading and its rules are constant text and
come here; the trap CONTENT is authored per piece and goes to 25a. Read :634 before deciding which
lines are which — the split is by sentence, not by block.

**This prompt inherits text that is copied per brief today.** Every constant block above is re-emitted
by the operator into every sub-agent brief it writes. Served once, it stops being something a planner
can get wrong.

```
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
```

---

## 25c — `codeweaver-reviewer` · REWRITTEN

| | |
|---|---|
| **OWNS** | `packages/orchestrator/src/statics/codeweaver-reviewer/` — rewritten in place, same path |
| **CUT FROM** | itself: `### 1. Load the standards` (:113) through `### 5. Fix what you can` (:247), plus `### 4a. Settle the read-checks` (:225) and `### 8. Return` (:295). **DROP `### 6. Ward` (:252) and `### 7. Commit and push` (:279)** — both are deterministic steps after you. Plus `codeweaver-prompt-statics.ts` `### 5. Read what changed` (:441) for the four questions |
| **STEP** | `codeweaver.review` · `role: 'reviewer'` · **opus** · `maxVisits: 10` · `routes: { done: 'commit', unmet: 'work', wall: '@blocked' }` |
| **FETCHES** | no `docs` scope. It interpolates `standardsReviewConcernsStatics.markdown` — 5,245 bytes — as it does today |
| **BUDGET** | 19,084 bytes on disk / 344 lines / 16,320 template literal / ~21,565 served with the standing concerns expanded. Ceiling 50,000 |

**The model changes and 25q is where that lands.** `agent-name-to-prompt-transformer.ts` has
`'codeweaver-reviewer': { model: 'sonnet' }` today. §8 moves it to opus because this role inherits the
operator's whole-picture job. Story 05's config already says `model: 'opus'`.

### The seam walk — the part with no other home

Pulling the operator's loop out leaves one job homeless, and it is the most valuable one: **nobody is
left looking at the whole thing.** A worker sees its piece; a planner saw the scope before code
existed. That job goes to the reviewer, and it is why this prompt moves to opus.

| The reviewer does | Why it is the reviewer |
|---|---|
| walk every code bit the pieces added, in full — not the diff | a diff hides a false green; the file is what shows one |
| check the pieces glue together, **especially across package seams** | a seam has two halves built by two pieces, and neither worker saw the other's |
| fix what it can, itself | deferring a one-line fix downstream makes the next session re-derive it |
| mark `unmet` for what it cannot | that is the whole rework edge, and it names exactly which units |

**The seam case is the specific one.** Codeweaver fans out per (package, flow) cell, so a flow crossing
an HTTP boundary is built by two pieces in two packages that never see each other. Today the operator
reads both halves; under the step model the reviewer is the only session that does. **"Read both sides
of every seam your pieces touched" is required prompt text, not a nice-to-have.**

**It also takes the OPERATIONAL units — §9h.** No `siegemaster-operational` role is built and none
should be. An operational flow is a one-time task sequence with no paths, and its final state is a fact
about the source tree. That is a READING, and `verifyByReading` already marks exactly this kind of
criterion.

| Rule | Why |
|---|---|
| An operational unit is settled here, and no siege mark is expected on it | a unit no step can close is one an agent invents a mark for |
| A runtime flow's non-browser units stay with the BROWSER walker | reaching a log line that only exists after four clicks needs the path driven. **This does NOT move to codeweaver** |
| **The evidence is the TREE — a path that is gone, an import that is there, a rule that is registered** | there is no run to observe and no picture to take |
| **The mark names the state it read, path by path — never that the sequence was followed** | "I did the steps" is the executor grading its own work, and codeweaver IS the executor. `deleted X` and `Y imports Z at line N` are checkable by the next reader; "the refactor sweep completed" is not |
| A unit whose final state you cannot see from the tree is `cant-meet` with a `toSettle`, never `met` on the sequence having been followed | same reason, from the other end |

```
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

---

## 25d — `flowrider-planner` · NEW

| | |
|---|---|
| **OWNS** | `packages/orchestrator/src/statics/flowrider-planner/flowrider-planner-statics.ts` + its colocated test |
| **CUT FROM** | `packages/orchestrator/src/statics/flowrider-prompt/flowrider-prompt-statics.ts` — `### 1. Fetch your flow` (:156), `### 2. Get the full list of units` (:189), `### 3. Read the implementation, and choose a layer per unit` (:223), `### 4. Write your map` (:260) |
| **STEP** | `flowrider.plan` · `role: 'planner'` · opus · `maxVisits: 5` · entry · `routes: { done: 'work', empty: '@done', wall: '@blocked' }` |
| **FETCHES** | no `docs` scope |
| **BUDGET** | source file 44,301 bytes; steps 1–4 measure 10,715 (:156–341). Ceiling 50,000 |

**Where each of today's operator steps lands.**

| Today's operator step | Goes to |
|---|---|
| 1 fetch the flow; the operational-retype escape | planner |
| 2 `get-qa-checklist` — units, `CHECK SURFACES`, `WALK PATHS` | planner, through `get-quest-work` — the checklist tool is deleted |
| 3 read the implementation for each unit's exact value; choose a layer PER UNIT | planner |
| 4 the map, with per-unit `layer` / `surface` / `assert` / `fails if` | the plan file's `payload.units[]` |
| 4 `HOW TO WRITE THESE` — the two rule sections copied into every map | 25e, **as constant text.** They are the same words on every flow |
| 5 send, and sign each group's `PROVED` lines | the worker marks its own units |
| 6 read the diff, three questions, hunt dropped units | 25f, the reviewer |
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
```

---

## 25e — `flowrider-worker` · NEW

| | |
|---|---|
| **OWNS** | `packages/orchestrator/src/statics/flowrider-worker/flowrider-worker-statics.ts` + its colocated test |
| **CUT FROM** | `flowrider-prompt-statics.ts` — the constant blocks inside `## Briefing a sub-agent` (:514): `RED FIRST` (:583), `MIRROR` (:605), `TRAPS` (:608), `DO NOT TOUCH` (:614), `DISCOVERY` (:617), `PROVE` (:632), the best-guess block (:643), `RETURN` (:652). **PLUS both `HOW TO WRITE THESE` sections**: `## Proving something in the browser` (:454) and `## Proving something below the browser` (:485) |
| **STEP** | `flowrider.work` · `role: 'worker'` · sonnet · `maxVisits: 40` · `maxConcurrent: { limit: 4, counts: 'browser-pieces' }` · `routes: { done: 'review', unmet: 'work', wall: '@blocked' }` |
| **FETCHES** | no `docs` scope. **A browser walk here boots Playwright through ward, NOT a siegelense lane** — a different budget, invisible to `capacity` |
| **BUDGET** | no source file of its own. The parts measure 8,679 (constant blocks :583–714) + 3,213 (both `HOW TO WRITE THESE` sections :454–500), plus 25p's blocks. Ceiling 50,000 |

**The two `HOW TO WRITE THESE` sections are the whole reason this prompt is bigger than it looks.**
`flowrider-prompt-statics.ts:293` writes them into the map ONCE per flow and :298 says "Copy the two
sections". They are the same words on every flow, so they become served text and stop being something
a planner can fail to copy.

```
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
```

---

## 25f — `flowrider-reviewer` · REWRITTEN

| | |
|---|---|
| **OWNS** | `packages/orchestrator/src/statics/flowrider-reviewer/` — rewritten in place, same path |
| **CUT FROM** | itself: `### 1. Load the standards` (:107) through `### 5. Take the standing concerns on the same files` (:207), plus `### 8. Return` (:253). **DROP `### 6. Ward` (:213) and `### 7. Commit and push` (:240).** Plus the JUDGING half of `flow-evidence-contract-statics.ts` — `judgingMarkdown` (:72), 5,406 bytes. **Not `authoringMarkdown` (:158)** — that is the planner's |
| **STEP** | `flowrider.review` · `role: 'reviewer'` · opus · `maxVisits: 10` · `routes: { done: 'commit', unmet: 'work', wall: '@blocked' }` |
| **FETCHES** | no `docs` scope. It interpolates `standardsReviewConcernsStatics.markdown` (5,245) and `flowEvidenceContractStatics.judgingMarkdown` (5,406) as it does today |
| **BUDGET** | 16,494 bytes on disk / 305 lines / 13,530 template literal / ~24,181 served with both interpolations expanded. Ceiling 50,000 |

**The seam walk applies here too**, in the form the design states for a reviewer: this is the only
session that reads the whole in-scope set rather than one piece. The 25c section's four-row table is
the same job; read it before writing this one.

```
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

---

## 25g — `siege-planner` · NEW

| | |
|---|---|
| **OWNS** | `packages/orchestrator/src/statics/siege-planner/siege-planner-statics.ts` + its colocated test |
| **CUT FROM** | `packages/orchestrator/src/statics/siegemaster-prompt/siegemaster-prompt-statics.ts` — `### 1. Fetch your flow, and the list of what you owe a verdict on` (:194), `### 2. Order your path walks` (:237), `### 3. Build the guide, then allocate your off-map families` (:260), **the allocation half only** — the guide-writing half is 25l's |
| **STEP** | `siegemaster.plan` · `role: 'planner'` · opus · `maxVisits: 5` · `routes: { done: 'happyWalk', empty: 'sweepOut', wall: '@blocked' }` |
| **FETCHES** | **nothing. §9a: "it plans. It drives nothing, and the walking scope would teach it to"** |
| **BUDGET** | source file 46,663 bytes; steps 1–3 measure 8,750 (:194–330). Ceiling 50,000 |

**Six of today's mechanisms retire rather than move**, and each is a thing the new engine already does.
Do not carry any of them across.

| Today | Replaced by |
|---|---|
| **the GUIDE** — one sub-agent writes `.quest-plans/<id>-guide.md` under eight headings | split four ways. The file stops existing |
| **rounds** — one path walk at a time, both minions back before the next | plan batches, bounded by measured lane capacity — and PHASED by the step chain, `happyWalk → adversarial` |
| the operator allocating two lane NAMES per round | the router, which starts and kills every instance and substitutes its id into the prompt |
| the operator holding the pass together — `cleanup` at both ends, `status` after a death | `sweepIn` and `sweepOut`, two deterministic steps, plus the router owning `start` and `kill` |
| "re-read the checklist before every round, brief only the units still REMAINING" | the router re-filters the assignment at dispatch |
| step 5's fixer dispatch and step 7's re-walk | an `unmet` mints a fixer; its `done` returns to the walker that found it |
| `reset-flow-signoffs` off a fixer's `REACHES:` line | the `invalidation` payload |

**Where each of the guide's eight headings goes**, since the guide is one file and its contents are not
one thing. This is the part most likely to be dropped silently:

| Guide heading | In `siegemaster-prompt-statics.ts` | Now |
|---|---|---|
| `TOOLING` (:289), `ENTRY` (:294), `SEEDING` (:297), `RESET` (:299) | the guide-writer brief | **the recipe** — 25l. Executable, proven by a run, reusable by the next quest |
| `CONTROLS` (:301), `FORCING` (:304) | same | the piece's `payload` — the path's own nodes and force labels, which the plan already carries |
| `OFF-SCREEN` (:302) | same | **`siegemaster-reader`** — 25m, which returns it with `file:line` |
| `TRAPS` (:305) | same | the piece's `notes`, written by this planner |

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
```

### **OPEN — the whole-quest off-map item (O2)**

§9e: the scroll's argument is that an all-operational quest now has no eligible siege flow, so
siegemaster keeps ONE whole-quest item, and `hostile-input` and `perf` get settled once against the
running system rather than spread across screenless flow walks. **This plan declares no such item** —
step 2 above returns `empty` and the family closes.
`scrolls/seigelense/remaining-build-items.md:571-575` calls the off-map item "the likelier answer" and
then defers to this plan. **Write step 2 as the plan declares it, and put one line in the prompt saying
the whole-quest item is not built**, so a later flip is one edit. The user decides.

---

## 25h — `siege-happy-walker` · ADAPTED

| | |
|---|---|
| **OWNS** | `packages/orchestrator/src/statics/siege-happy-walker/siege-happy-walker-statics.ts` + its colocated test |
| **CUT FROM** | `packages/orchestrator/src/statics/siegemaster-verifier/siegemaster-verifier-statics.ts` — `## Rules` (:75) and `## Pass 1 — walk the whole path, dispatch nothing` (:163) through `### 8. Close pass 1` (:327). **DROP `## Pass 2 — dispatch two at a time against the list` (:338) entirely — a walker dispatches nothing.** Plus `siegemaster-prompt-statics.ts` `### 5. Send fixers for what every round found` (:360), for its judging table |
| **STEP** | `siegemaster.happyWalk` · `role: 'reviewer'` · sonnet · `maxVisits: 40` · **`needsLane: true`** · `routes: { done: 'adversarial', unmet: 'fixHappy', wall: '@blocked' }` |
| **FETCHES** | **`docs { for: 'walking' }`** — "the walker — the session driving a browser against one instance and recording what it reads" (`docs-statics.ts:164`) |
| **BUDGET** | 28,552 bytes on disk / 25,834 template literal. Pass 1 measures 10,930 (:163–337), rules 5,497 (:75–162), the operator's judging table 2,212 (:360–396). Ceiling 50,000 |

**Two deletions this adaptation must make on purpose, with a note saying why.**

**`[SIGN ONCE]` is deleted, and the reason is gone rather than relaxed.** It existed because a second
sign-off overwrote the first's evidence in a shared field. A re-walk now writes its own set on its own
work item and the first stays readable, so nothing is destroyed — and *"a fix is only proved by a round
that did not make it"* becomes something the engine does rather than something a prompt asks for.
**Leave the rule standing and an adapted prompt carries a ban whose reason is gone.**

**The deliberate-red mechanism retires with pass 2.** Today a walker's pass-2 sub-agents write one
failing test per defect, and the operator then passes a `RED TESTS:` list to its reviewer so that
reviewer does not "fix" a red that is deliberate. Under the step model the FIXER writes that red
itself, watches it fail against unchanged source, and turns it green in the same session — so no
orphaned red ever reaches a ward gate, and no list is needed to protect one.

```
siege-happy-walker · reviewer · sonnet                                [ADAPTED from verifier]
  DOES      drives one path by hand against a live lane and settles what it measures
  CONSUMES  get-quest-work → the scope's WHOLE in-scope unit set, the piece (its path, force
            labels, recipe names, notes), each unit's served surface, and the running
            instance's id and manifest — the router started it before dispatching you
  WRITES    quest-work → observations · modify-quest → a new observable per defect ·
            quest-work → amendment · quest-work → request (recipe, read)
  DONE      every in-scope unit marked, one `unmet` per defect, the lane closed, nothing
            committed
  FROM      today's `siegemaster-verifier` pass 1, plus operator step 5's judging table

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
```

### §9d — the nine rules, none of which is in `siegemaster-verifier-statics.ts` today

| Rule | Why |
|---|---|
| **A walker opens NO source file, for any reason.** What only source can answer arrives as a value in its brief | the contradiction below, and the trial that measured it |
| **Selectors come from the running page, not from test files** | the trial's arm B read the e2e specs and learned the answers before driving. That removes the reason siegemaster runs at all |
| **The KEY is the default reading. `dom` is the escape hatch: last, expensive, narrow target** | the one measured cost in this design — `dom` on `body *` returned 58 nodes whose first entry carried an entire stylesheet. The prompt carries that one line; `docs { for: 'walking' }` carries the whole ladder |
| **An observable naming a className or any implementation detail is settled on what a PERSON would see** | the five steps below |
| **Every PATH walked is recorded with its instance id and run id — a CLEAN walk included** | §9l. The clean walk is the one an issue-only rule leaves unevidenced |
| A walk that sees its instance stop checks `status` BEFORE writing anything down | a dead driver leaves a blank screen, and "the page went blank" is exactly what a walker is trained to report. A fixer briefed against it hunts a rendering bug that never existed |
| A slow `start` is a QUEUE, not a hang — never a `wall` | the tool admits one boot at a time, so the third walk in a pool waits out two. `queuedMs` says so, and a session reporting a wall over it halts a quest for nothing |
| A dead instance is `unmet` with the `status` output — never self-healed, never `wall` | `wall` means no session of any role could pass. A crash is not that, and a session self-healing is one acting on a third of the picture |
| A DRIVER death is never a finding about the app; an API-SERVER death may be | a leak or an unbounded allocation that kills the server is a real defect, recorded WITH the server log as well as marked |

**The no-source rule resolves a live contradiction, and the walker's own copy is the one that wins
today** — which is why it gets rewritten here rather than left alone:

| Prompt | Says |
|---|---|
| `siegemaster-verifier-statics.ts:222` — the walker's own | "**Read the implementation only for a value a unit names indirectly** — 'the configured cap', 'the default timeout' — where the number lives in the code and the unit does not spell it out. Use `discover` to find the symbol and `Read` to open it." |
| `siegemaster-prompt-statics.ts:226` — the operator's | an observable marked `(read-check)` "is settled by opening a source file, **which no round can do**" |

**The five-step rule for an implementation-detail unit.** Siegemaster handles the FLAGGED case today
(`siegemaster-prompt-statics.ts:226`) and says nothing about a className observable that reached its
list unflagged. **Signing one on the class alone is the cheapest false pass in this system** — the
class is present, the stylesheet rule was deleted, the row is not red, the unit reads `met`, and
nothing in the record says the screen was never looked at.

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

**§9l — record the walk.** `questNoteKindContract` holds `walked`, and `questNoteContract` carries
typed `instanceId` and `runId` beside the prose. Both are `.nullish()` and no refinement forces a
`walked` note to carry them, so **this is prompt text or it does not happen.** Every path walked
carries the instance and run that walked it, a CLEAN walk included: that id is the proof the path was
driven rather than claimed, and it is the only handle anything has on that walk's evidence. Nothing
browses.

---

## 25i — `siege-adversarial-walker` · ADAPTED

| | |
|---|---|
| **OWNS** | `packages/orchestrator/src/statics/siege-adversarial-walker/siege-adversarial-walker-statics.ts` + its colocated test |
| **CUT FROM** | `packages/orchestrator/src/statics/siegemaster-stress/siegemaster-stress-statics.ts` — `## Rules` (:70), `## Your tools` (:156), and `## Workflow` steps `### 1. Read the flow` (:183) and `### 2. Enumerate every stress point — PASS 1` (:195). **DROP `### 3. Dispatch — PASS 2` (:230), `### 4. Read what came back` (:240) and `## Briefing a sub-agent` (:273)** |
| **STEP** | `siegemaster.adversarial` · `role: 'reviewer'` · sonnet · `maxVisits: 40` · **`needsLane: true`** · `routes: { done: 'commit', unmet: 'fixAdversarial', wall: '@blocked' }` |
| **FETCHES** | **`docs { for: 'attacking' }`** — "the stress tester — the session running attacks against one instance and measuring what breaks" (`docs-statics.ts:275`) |
| **BUDGET** | 18,936 bytes on disk / 16,687 template literal. Rules + tools measure 6,716 (:70–180); pass 1 measures 2,678 (:183–229). Ceiling 50,000 |

**`[SIGN ONCE]` is deleted here too, same reason as 25h.** So is the sub-agent dispatch.

```
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
  FROM      today's `siegemaster-stress` pass 1

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
```

### §9e — the nine rules, and the baseline discipline

**One principle generates almost all of these: the walker measures against the UNIT, the antagonist
measures against a BASELINE.** A walker asks whether the screen shows the value its unit names, so its
comparison is to a sentence in the spec. An antagonist claims an ABSENCE — I attacked this and it did
not fall over — and an absence is only evidence against a known-good reading taken before the attack.

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

**Why it never sees an operational flow — §9h.** Its whole vocabulary is `paste`, `key` and `click`,
and the three key columns above are all properties of a rendered control. With siegemaster restricted
to runtime flows, an operational flow is never handed to it at all.

**One rule its prompt still needs:** handed an operational flow anyway, **it marks `unmet` naming the
mis-route, and never improvises.** It always has `request` and `file`, so it can always do SOMETHING —
and that something is an attack nobody scoped, marked against a family the whole-quest item was going
to settle properly.

**That last rule is downstream of O2.** If the whole-quest off-map item is never built, the mis-route
rule still stands; only its second sentence's reference changes. Write the rule.

---

## 25j — `siege-happy-fixer` · NEW

| | |
|---|---|
| **OWNS** | `packages/orchestrator/src/statics/siege-happy-fixer/siege-happy-fixer-statics.ts` + its colocated test |
| **CUT FROM** | `siegemaster-prompt-statics.ts` `## Briefing a fixer` (:602–711) — SYMPTOM, LOOK AT, FACTS, FENCES, EVIDENCE WINS, FIX, RED FIRST (`:667`), DO NOT TOUCH, PROVE |
| **STEP** | `siegemaster.fixHappy` · `role: 'worker'` · sonnet · `maxVisits: 40` · **no `done` route** — mark-minted, so `done` returns to the walker that minted it. `routes: { unmet: 'fixHappy', wall: '@blocked' }` |
| **FETCHES** | **`docs { for: 'fixing' }`** — "the fixer — the session that arrives after the walk is over and the instance is gone" (`docs-statics.ts:353`) |
| **BUDGET** | no source file of its own; the fixer brief measures 6,131 (:602–711), plus 25p's blocks. Ceiling 50,000 |

```
siege-happy-fixer · worker · sonnet                                                   [NEW]
  DOES      fixes the cause of what a walk measured
  CONSUMES  get-quest-work → the MINTING OBSERVATION (the walker's whole measured block,
            word for word), the inherited payload (look-at, facts, fences, doNotTouch), the
            uncommitted file list
  WRITES    quest-work → observations · quest-work → invalidation
  DONE      the cause fixed rather than the symptom, every assigned unit marked, no lane
            touched, nothing committed
  FROM      today's fixer brief — SYMPTOM, LOOK AT, FACTS, FENCES, EVIDENCE WINS, FIX,
            RED FIRST, DO NOT TOUCH, PROVE

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
```

### §9f — two rules built, two missing, one decided against

| Rule | State today |
|---|---|
| `RED FIRST` — watch a real test fail against unchanged source, for the right reason | **built**, verbatim at `siegemaster-prompt-statics.ts:667`. Carry it |
| Cap two fixers, only over a disjoint file set | **built**, verbatim at `siegemaster-prompt-statics.ts:374`. **Do not carry it** — under this plan the ROUTER holds the cap, not a prompt |
| A fixer touches no instance it did not start | **built**, and now stronger: a fixer starts nothing because the ROUTER starts instances, and this step does not declare `needsLane` |
| **A fixer writes the regression test using the SAME recipes the setup named** | **missing — this is the rule the step map above does not carry, and it is the one this brief exists to add.** No recipe concept exists in any siege prompt today |
| A fixer RE-RUNS THE SETUP on a fresh instance | **decided against.** The ban stands. A fixer proves its work through ward, and the RE-WALK is the live proof — a walker's `unmet` mints the fixer, and the fixer's `done` returns to that walker, which drives the path again on a fresh instance. A fixer holding its own instance would consume a capacity slot nothing budgeted for, and would prove the symptom gone in a session nobody re-measures |

**The recipe rule is the point of the whole recipe book for a fixer. The hard part of writing a
regression e2e was always the setup.** A recipe returns a plan, an ingredient's `write` route is pure
`fs` and its `api` route is a `fetch`, so the state a walk ran against and the state its regression
test runs against come from the same plan handed two different targets. The alternative is what
happens today: the fixer re-derives the setup in the e2e's own idiom, gets it subtly different, and the
test passes against a state the walk never saw. **The plumbing is already built; only the instruction
is missing.**

**One dependency on the tool, and it is not yours to build:** `results` must still answer for a killed
instance, flagged as gone, and reading it must start nothing. The walker's instance is gone by the time
this session reads its record. Without that, a fixer holding a run id finds it resolves to nothing.

---

## 25k — `siege-adversarial-fixer` · NEW

| | |
|---|---|
| **OWNS** | `packages/orchestrator/src/statics/siege-adversarial-fixer/siege-adversarial-fixer-statics.ts` + its colocated test |
| **CUT FROM** | **25j's finished prompt**, plus `siegemaster-stress-statics.ts`' own layer rule — stated twice there, at `:142-143` (in `## Rules`) and `:295-297` (in `## Briefing a sub-agent`) |
| **STEP** | `siegemaster.fixAdversarial` · `role: 'worker'` · sonnet · `maxVisits: 40` · no `done` route · `routes: { unmet: 'fixAdversarial', wall: '@blocked' }` |
| **FETCHES** | **`docs { for: 'fixing' }`** — the same scope 25j fetches |
| **BUDGET** | whatever 25j lands at, plus one inverted step. Ceiling 50,000 |

**This session runs AFTER 25j and reads its output.** That is the one ordering constraint inside the
set; everything else is parallel.

```
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

**§9f applies here unchanged** — read 25j's rulebook section above. The recipe rule, the no-instance
rule and the `RED FIRST` rule are identical; only the LAYER the red is written at inverts.

---

## 25l — `recipe-maker` · NEW

| | |
|---|---|
| **OWNS** | `packages/orchestrator/src/statics/recipe-maker/recipe-maker-statics.ts` + its colocated test |
| **CUT FROM** | `siegemaster-prompt-statics.ts` `### 3. Build the guide, then allocate your off-map families` (:260) — the GUIDE-WRITING half. The inline sub-agent is dispatched at `:272` with `subagent_type: "general-purpose"`, and its eight headings run `:289`–`:305`. Take `TOOLING` (:289), `ENTRY` (:294), `SEEDING` (:297) and `RESET` (:299). **Leave `CONTROLS` (:301) and `FORCING` (:304) to 25g's payload, `OFF-SCREEN` (:302) to 25m, and `TRAPS` (:305) to 25g's notes** |
| **STEP** | `flowrider.recipe` AND `siegemaster.recipe` — **ONE prompt, registered once, referenced by two graphs.** `role: 'planner'` · opus · `maxVisits: 5` · **`mintableOnRequest: true`** · **no `done` route**; `routes: { wall: '@blocked' }`. `empty` means the seeds it was asked for already exist |
| **FETCHES** | **`docs { for: 'planning' }`** — "the planner — the session that writes the test sequence and proves that the application reaches its starting state" (`docs-statics.ts:104`) |
| **BUDGET** | no source file of its own; the guide-writer brief measures 4,793 (:260–330). Ceiling 50,000 |

**A recipe is flow-scoped, not family-scoped**, which is why one prompt serves both graphs: whichever
family asks first authors it and the other reuses it.

```
recipe-maker · planner · opus · ON REQUEST, by flowrider and siegemaster               [NEW]
  DOES      makes sure every seed the requesting session needs exists and has been run
  CONSUMES  get-quest-work → the request that minted it, the flow · `siegelense recipes` →
            what already exists
  WRITES    recipe files in packages/hydration-recipes · the recipe names onto the flow ·
            quest-work → outcome
  DONE      every seed the request named exists, ran as a SEQUENCE, and carries the run id
            that proved it
  FROM      today's phase-zero guide-writer, inline in siegemaster-prompt-statics.ts

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
```

### §9b — the rules behind that map

**Its deliverable is a COMPLETE seed set for the walks it was asked about, proven by running it.** Every
path the requesting session will drive gets a SETUP — the runnable batch that carries a fresh instance
to that path's entry state — every setup names only recipes that exist, and every one of those recipes
is run during this session. A path left without a proven setup is a path no walk may be sent down, so a
gap here does not degrade the pass; it removes coverage from it.

Walk by walk:

1. Read the walk paths the request names — every route through the flow.
2. For each path, work out the state that makes it reachable.
3. Match those states against existing recipes: `dungeonmaster siegelense recipes`.
4. **Make every recipe the set is missing.** Where existing ingredients compose to the state, write the
   recipe itself in a few lines. Where the state needs an entity nothing declares yet, that is an
   INGREDIENT — see the OPEN below. **"No recipe covers this path" is not an outcome this step may
   return.**
5. **Run every recipe the set uses — the ones it wrote and the ones it found alike — as the SEQUENCE
   the setup submits**, against a throwaway instance, and confirm it lands where it claims. Not each
   recipe alone; the sequence, end to end.
6. Record the run id that proved each one onto the flow.

**Step 5 is the one that cannot be skipped.** An unproven recipe does not fail loudly; it manufactures
false defects. A recipe that claims two rows and seeds one leaves the walker looking at a one-row list.
The walker reports a defect correctly. A fixer is briefed against a symptom that does not exist and
hunts in working code. A whole round is spent and nothing in the record says the seed was the problem.
**The quieter version is worse:** a recipe seeding *one* of something an assertion must tell apart
makes "the right one" and "the first one" the same value, so an off-by-index bug passes and the clean
result means nothing.

**Seeding the same thing twice and comparing is a STEP in this session**, and it is the one check for a
randomised on-screen value that travels to a repo nobody here has seen. Seed one recipe into two fresh
instances, read both screens, compare. Every value a recipe supplied is identical by construction, so
**whatever differs is a value the app generated and then displayed.** That is the whole reason it works
without knowing the domain.

> **It depends on the element delta on `look` and on `compare`'s `elements` field, both of which are
> `scrolls/seigelense/remaining-build-items.md` §13 and are NOT BUILT.** Write the step; say in the
> prompt that it waits on §13, so a session reaching for a field that does not exist knows why.

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

**`SEEDING`, `CONTROLS` and `TRAPS` all existed because a walk had to work something out, and all three
stop being work once something durable answers.** `SEEDING` becomes the recipes this step proves.
`CONTROLS` becomes the key — the text tree of the screen the tool produces. `TRAPS` becomes the
committed app-oddities file, which is `remaining-build-items.md` §3 and is not built.

### **OPEN — who writes an INGREDIENT (O1)**

**A sub-agent is not it.** A recipe is composition and `recipe-maker` writes one itself in a few lines.
An ingredient means reading the production writer, declaring `links`, `routes` and `copies:`, and
proving it with a colocated test — enough reading to spend the context the remaining paths need. The
scroll's answer was a `guide-recipe-writer` sub-agent, one per missing ingredient, capped at two at a
time. **That is exactly the black box this plan exists to delete**, so §9b says it becomes a step of its
own, `mintableOnRequest`, in both graphs that carry `recipe`.

**Story 05's graph declares no such step.** So 25l cannot name it, and cannot name a sub-agent either.
**Whoever owns story 05, with the user, decides.** §9b's second half is open with it: how ONE `request`
payload mints three of these when three ingredients are missing — the router's request rule mints one
step per request.

The rules that come with it either way, so they are not lost whichever way it lands:

| Rule | Why |
|---|---|
| its first question is whether existing recipes already compose to the state | a new ingredient where two compose makes the book worse while looking productive |
| **it fills `copies:`**, because it has just read the production writer | left for later it is a guess, and a wrong `copies:` pointer makes the drift test assert against the wrong thing — worse than no pointer, because it passes |
| it is briefed in the flow's words, never from an implementation detail | handed the code to start from, it writes an ingredient for whatever the code happens to do |
| the same session that wrote an ingredient diagnoses it when `recipe-maker`'s run does not land | it already holds the production writer it read, the `routes` it declared and the `copies:` it filled |
| the diagnosis brief carries the READINGS from the run that failed | otherwise it is "this is broken, go look" rather than a diagnosis starting from a measured symptom |
| a break that turns out to be production changing shape is a finding about the app | it becomes an observable, not an ingredient patch |
| **`recipe-maker` re-runs the setup itself on every return** | a sub-session's claim that its ingredient works is not evidence, and that is as true of a repair as of a first draft |

The diagnosis is bounded by the route that failed: a `write` failure means diffing the `copies:` target
against what the ingredient writes; an `api` failure means the real code path changed — read the
handler; a `recording` failure means the recording is of a version that no longer exists — re-capture,
do not patch. **That third row is not performable today and must not reach a prompt** until
`remaining-build-items.md` §5c gives a recording something to check.

---

## 25m — `siegemaster-reader` · NEW

| | |
|---|---|
| **OWNS** | `packages/orchestrator/src/statics/siegemaster-reader/siegemaster-reader-statics.ts` + its colocated test |
| **CUT FROM** | `siegemaster-prompt-statics.ts` — the `OFF-SCREEN` heading at `:302`, inside the guide-writer brief at `:260`–`:330`. That is the whole source: inline prose in one heading of a sub-agent brief |
| **STEP** | `siegemaster.read` · `role: 'worker'` · sonnet · `maxVisits: 10` · **`mintableOnRequest: true`** · no `done` route; `routes: { wall: '@blocked' }` |
| **FETCHES** | **nothing. §9a: "it opens files. It calls no tool, starts no instance and holds no lane, so the driving vocabulary would only be a route to misuse"** |
| **BUDGET** | no source file of its own. This is the smallest prompt in the set. Ceiling 50,000 |

```
siegemaster-reader · worker · sonnet · ON REQUEST                                      [NEW]
  DOES      opens the source files a walker may not, and hands back configured values
  CONSUMES  get-quest-work → the request: which values, for which units
  WRITES    nothing to the quest. Its answers ride back on the return
  DONE      every requested value returned with `file:line` provenance
  FROM      inline prose in siegemaster-prompt-statics.ts

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
```

### §9c — the authority, and it is the authority over the map above

*Returns values. Drives nothing. Signs nothing. Dispatches nothing.*

**The problem it solves.** A walker may not open a source file — §9d makes that absolute, and the trial
measured why. But some units name a value only source holds: "the list caps at the configured maximum",
"the default timeout". **A walk told "read no source" facing one of those either breaks the rule or
stalls, and breaking it is what actually happens.**

> Unit: *the quest list caps at the configured maximum.*
> The walker drives the app and counts 50 rows. Is 50 the right number? It lives in
> `questListStatics.ts:12`, which the walker may not open.
> The reader returns one line — `quest list cap  50  questListStatics.ts:12` — and the walker measures
> what it counted against it, having never read the list's implementation.

| Rule | Why |
|---|---|
| It is the ONLY session on a siege pass that opens a source file | a walker that opens one holds it for the rest of the walk. The trial measured what that produces: six correct verdicts reached with the expected values known in advance, and no independent look anywhere in the pass |
| Every value it returns carries `file:line` | a value with no provenance cannot be told from one a session remembered, and the walker citing it cannot check it without doing the reading this step exists to prevent |
| **It returns a LOCATION or a CONFIGURATION — never an EXPECTED VALUE the unit should have carried** | handing that forward launders the contamination through one more session. The walk still measures the system against what the code intends, and now it is invisible, because it arrived as a fact in a brief |
| A unit whose expected value exists only in source is a `questNotes` open question | that is a spec defect — the unit is under-specified |
| It touches no instance and holds no lane | it reads files, so it runs beside anything, including a full pool of walks |

| When it runs | Why |
|---|---|
| requested by the PLANNER, before the first walk | its answers go into every piece's notes, which is what lets §9d's no-source rule be absolute |
| requested by a WALKER, mid-pass | a reading is one value for one unit, and a walk reaches that need at any point |

**Both cadences, which is why the step is `mintableOnRequest` rather than on a route.**

What it hands back:

```
OFF-SCREEN
  quest list cap          50      questListStatics.ts:12
  default guild slug      siege-1 guild-create-broker.ts:88
  outbox path             .dungeonmaster/event-outbox.jsonl   quest-persist-broker.ts:41
```

---

## 25n — `spiritmender` · REWRITTEN

| | |
|---|---|
| **OWNS** | `packages/orchestrator/src/statics/spiritmender-prompt/` — rewritten in place, **no rename** |
| **CUT FROM** | itself. **DROP `### 3. Check Git for What Prior Sessions Built` (:169)** — that is served now — **and the commit half of `## Committing & Signaling` (:255)** |
| **STEP** | the `repair` step in **FIVE graphs**: `codeweaver`, `flowrider`, `siegemaster` (through `CLOSE_OUT`), plus `riftcarver` and `wardFull`, which declare their own. `role: 'worker'` · sonnet · `maxVisits: 3` · `routes: { unmet: 'repair', wall: '@blocked' }` |
| **FETCHES** | **nothing. §9a: "it is not a siege step. It fixes what a ward gate named"** |
| **BUDGET** | 18,548 bytes on disk / 16,955 template literal. Ceiling 50,000 |

**It holds no units**, so `done` cannot derive from marks — it declares its own outcome through the
`outcome` payload, exactly as a planner does. It is one of only two prompts in this set that do.

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
 13 declare the outcome and signal. **No commit** — the deterministic `commit` step follows
```

**One addition the map does not carry: the six symptom-hiding shapes belong in this prompt too**, per
the siege decision at 25j step 4. A repair that makes a red go away by loosening the thing that was red
is reviewed by nobody. Name them: do not widen a type to accept the bad value, swallow the error,
default the missing value, raise the timeout, loosen an assertion, or delete the branch.

---

## 25o — `warpgate` · REWRITTEN

| | |
|---|---|
| **OWNS** | `packages/orchestrator/src/statics/warpgate-prompt/` — rewritten in place, **no rename** |
| **CUT FROM** | itself. **DROP the commit-gate paragraph at `:227`–`:233`** — the gate it describes is the sign-off machinery stories 24 and 26 retire |
| **STEP** | `warpgate` — a single-step graph appended at merge. `role: 'worker'` · opus · `maxVisits: 3` |
| **FETCHES** | no `docs` scope |
| **BUDGET** | 16,262 bytes on disk / 14,708 template literal. Ceiling 50,000 |

**It holds no units** and declares its own outcome, same as 25n.

**THE ONE EXCEPTION to "no session runs git".** Driving git IS the job. It is a one-step family with no
`CLOSE_OUT`, so there is no deterministic `commit` step to collide with it. **Anyone reading the
universal rule and taking warpgate's git away stops the merge working** — say so in the prompt.

```
warpgate · single-step graph, appended at merge                            [NEEDS REWRITING]
  DOES      lands the quest branch on the local base branch as ONE commit
  CONSUMES  get-quest-work → `baseBranch` and `worktreePath`, typed
  WRITES    quest-work → outcome. Holds no units
  DONE      one commit on local base, worktree clean, nothing fetched and nothing pushed
  FROM      today's prompt, minus its commit gate

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
```

**`warpgate` is prohibited from pushing and that is deliberate.** Deleting the reviewer's git took its
bare `git push` with it, so the deterministic `commit` handler is what pushes. Do not add a push here
to close that gap.

---

## 25p — the SHARED blocks · NEW

| | |
|---|---|
| **OWNS** | new statics directories under `packages/orchestrator/src/statics/`, one per block, plus their colocated tests. **Neither source names them.** The pattern to copy is `standards-review-concerns/standards-review-concerns-statics.ts` — 6,872 bytes on disk, 5,245 in its exported `markdown`, interpolated into three reviewer prompts today |
| **CUT FROM** | — |
| **BUDGET** | each block is interpolated into several prompts, so **its size is multiplied.** `standardsReviewConcernsStatics.markdown` at 5,245 bytes costs 15,735 across its three readers. Keep each block to the rule and the reason |

**The three blocks are written out in full above**, under *"What every non-planner prompt must carry"*:
MARKING, SAD-PATH, declared-value. That section IS this session's source.

**Who takes which:**

| Block | Taken by |
|---|---|
| MARKING | every prompt that holds units — 25b, 25c, 25e, 25f, 25h, 25i, 25j, 25k. **Not** 25a, 25d, 25g (a planner's only mark authority is `plannerMarks`), **not** 25l, 25m, 25n, 25o (no units) |
| SAD-PATH | every prompt in the set except 25m, which returns values and signals |
| declared-value | 25r (the author), `chaoswhisperer-gap-minion` (the reviewer), and 25h — §9i says the gap is on the walker, which meets an unflagged declared-value observable and has nothing telling it what to do. §9d's five steps are that rule |

**OPEN — the directory names are not pinned by either source.** One directory per block, kebab-case,
following the convention. 25p is the only session that owns them, so nothing collides whichever names
it picks — but it must state them in its commit, because eight sibling sessions import them.

---

## 25q — registration, and do it LAST

```
OWNS      contracts/agent-prompt-name/agent-prompt-name-contract.ts
          statics/agent-prompt-classification/agent-prompt-classification-statics.ts
          transformers/agent-name-to-prompt/agent-name-to-prompt-transformer.ts
          the deletion of FOUR prompt directories — siegemaster-reviewer/ and the three
            operator prompts: codeweaver-prompt/, flowrider-prompt/, siegemaster-prompt/
NO TOUCH  glyphsmith-prompt/ — story 28a owns it, and owns the ~35 other files that name
            the role. See below
DONE      every prompt this set adds is servable, and no deleted name resolves
```

**The three places in full**, since §9j names them and the story used to leave them at "three places":

| Place | Exact path | What goes in |
|---|---|---|
| the contract | `packages/orchestrator/src/contracts/agent-prompt-name/agent-prompt-name-contract.ts` | nothing new. Story 03 turns it from `z.enum(agentPromptClassificationStatics.promptNames)` into a branded `z.string().min(1)`, so this half becomes a reachability check |
| the roster | `packages/orchestrator/src/statics/agent-prompt-classification/agent-prompt-classification-statics.ts` | the fifteen new names in `promptNames`, and in `minionNames` for anything dispatched rather than chatted with. Its own header states the mechanical stakes: a minion in `roleNames` widens `agentRoleContract` with a role no operation item can hold; a role in `minionNames` lets it fetch without a `workItemId` and escape `subagentStopNeedsBlockGuard` |
| the resolver | `packages/orchestrator/src/transformers/agent-name-to-prompt/agent-name-to-prompt-transformer.ts` | one `AGENT_PROMPTS` row per name: its statics import and its model — **sonnet for every worker, opus for every planner and reviewer** |

**TWO model CHANGES, not just additions.** Both reviewers are `sonnet` in `AGENT_PROMPTS` today and
both become `opus`:

| Row | Today | Becomes | Why |
|---|---|---|---|
| `'codeweaver-reviewer'` | `sonnet` | **`opus`** | it inherits the operator's whole-picture job — nobody else reads both halves of a package seam |
| `'flowrider-reviewer'` | `sonnet` | **`opus`** | same rung in its family, and story 05's config says `model: 'opus'` |

Verified against `agent-name-to-prompt-transformer.ts`, where the six rows present today —
`chaoswhisperer-gap-minion`, `codeweaver-reviewer`, `flowrider-reviewer`, `siegemaster-reviewer`,
`siegemaster-stress`, `siegemaster-verifier` — are ALL `sonnet`. A session that only ADDS rows leaves
both reviewers on the wrong model, and nothing fails: the prompt serves, the session runs, and it is
quietly the weaker model on the two steps that most need the stronger one.

**The compile-time net is gone by the time you run.** `AGENT_PROMPTS` is
`satisfies Record<AgentPromptName, unknown>` today, so a name with no prompt fails to compile. Once
story 03 opens `AgentPromptName` to a string, that check no longer exists — story 03 replaces it with a
loud runtime throw naming the name. **Your DONE condition is the only gate left**, so assert it:
resolve every name in `promptNames` and every `prompt:` value in story 05's `agentFlowStatics`.

**Do not delete the three operator prompts until 25a–25i have landed.** They are what those sessions
cut from, and `siegemaster-prompt-statics.ts` alone is 46,663 bytes of rules that have to find a home.

**`glyphsmith-prompt/` is NOT yours — it was, and that was an ownership bug.** Story 28a owns it, and
owns the roughly 35 other files that name the role, including `design-chat-start-responder` and web's
`design-session-broker`. Deleting the prompt directory here would leave 28a's session staring at a
directory its brief says to delete and something else already did.

**So 25q deletes four directories, not five.** And 28a is independent of this whole chain, so it may
already have run — do not treat a missing `glyphsmith-prompt/` as a problem.

---

## 25r — `chaoswhisperer` wording · 3 fixes

| | |
|---|---|
| **OWNS** | `packages/orchestrator/src/statics/dumpster-create-prompt/` — edited in place. **Wording only; no restructure** |
| **CUT FROM** | — |
| **STEP** | none. It is a CHAT prompt with no graph, invoked as `/dumpster-create` |
| **FETCHES** | no `docs` scope |
| **BUDGET** | 63,538 bytes on disk / 57,931 template literal — **and that is not a violation.** See below |

**It is not served through MCP, which is why it is over 50,000 and why no budget test guards it.**
`slash-commands-statics.ts` writes its body to `<targetProjectRoot>/.claude/commands/dumpster-create.md`
with two placeholders substituted (`questBootstrap` → `mint`, `clarifyInstruction` → `native`), and
Claude Code reads that file off disk. There is no MCP-fetch indirection, so no tool result carries it
and `maxVerbatimChars` never applies. **Do not "fix" the size, and do not add a budget test** — it
would assert a ceiling this prompt does not sit under.

```
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
```

**Fix 1 — the design stage has no agent behind it.** `glyphsmith` is deleted; the design stage and
`design_approved` stay, and a human set that flag anyway. **A search of
`dumpster-create-prompt-statics.ts` for `glyphsmith` and for a design-stage agent returns nothing**, so
either the wording lives somewhere this story does not own, or there is nothing to change. **OPEN — find
it or record that it is absent.** Do not invent a sentence to correct.

**Fix 2 — `verifyByReading` is one of only two roles that may set it.** The flag is described at
`dumpster-create-prompt-statics.ts:158` and used at `:396`, `:404`, `:415` and `:423`. It decides which
units leave BOTH verify families' denominators, and §9i's first rule is what the wording must carry: an
observable naming an IMPLEMENTATION — a className, a hook, a prop — is a READ-CHECK, because a class
name is the mechanism behind something a person sees, never the thing itself, and it can move to an
inline style or a generated hash without the outcome changing.

**Fix 3 — the declared-value enumeration, which has already drifted.** `:163` (the author) is narrower
than `chaoswhisperer-gap-minion-statics.ts:191` (the reviewer), and **the author is the only role that
may set the flag** — so a raw colour and a margin are values the reviewer catches and the author never
flags. Extract one interpolated statics, add the siege consequence to its rationale, and give it to
both. That block is 25p's third; **take it from 25p rather than writing a fourth copy.**

**§9i's second rule is the one with the widest blast radius**, and it belongs here: **phrase the
observable as what a PERSON would see** — "the failed row is red", not "the row has `.failed`". An
observable written in the implementation's words hands a walk the mechanism instead of the outcome,
which does to it automatically what reading source did to the trial's arm B.

**OPEN — two fixes or three.** §8's `WORDING` line says "two fixes and nothing else"; §9i gives three
rules plus the declared-value extraction; this story's table says three. Read both before editing and
say in the commit which you took.

**NO TOUCH — `28c-3` owns the shared "can anything automate this?" block**, which is interpolated into
this prompt AND both walkers' from one source (`28-independent.md:58`). §9i's third rule — the
human-check category stays NARROW, motion quality and taste and nothing else — lands there, not here.

---

## The siege prompts cut over with a siegelense delete

`scrolls/seigelense/remaining-build-items.md` §18 (`:917`) deletes `packages/web/test/siege-driver/` —
three files, 964 lines, confirmed: `siege-command.ts` 403, `siege-driver.ts` 191, `siege-lane.ts` 370.
**Every siege prompt today drives that lane by name.** Do it first and every other item in that scroll
gets done twice; do it last and 25g–25m are written against a mechanism about to be replaced. Cut them
together.

**No siege prompt knows siegelense exists.** A search across every orchestrator prompt for the words
`siegelense`, `recipe` and `instance` returns nothing, and the word `docs` appears in none of the
statics files under `packages/orchestrator/src/statics/`. All four of today's siege prompts —
`siegemaster-prompt-statics.ts`, `siegemaster-verifier-statics.ts`, `siegemaster-stress-statics.ts`,
`siegemaster-reviewer-statics.ts` — are built around the lane.

And note §18 gets no help from lint: `siege-lane.ts` hardcodes two package names
(`siege-lane.ts:41-42`) and passes `no-hardcoded-package-names` clean.

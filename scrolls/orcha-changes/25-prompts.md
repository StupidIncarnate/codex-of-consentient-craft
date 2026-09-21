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

---

## The rule that kills this set if it is ignored

**Budget against `mcpToolResultStatics.maxVerbatimChars` BEFORE writing, not after.** Over the ceiling
the MCP layer spills the result to a file and hands the agent an error stub — **the session then holds
a path instead of its instructions, and nothing reports a failure.** The new worker carries the
operating rules plus seven constant brief blocks plus the sad-path block. The new reviewer carries
today's 344 lines plus `standardsReviewConcernsStatics` plus the seam walk. Both are close.

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

**25b and 25e have no source to cut from**, and both are bigger than they look: they inherit constant
text copied per-flow today that becomes served text.

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

---

## What every non-planner prompt must carry

**Three blocks, written once in 25p and interpolated verbatim.** A shared block is a CONTRACT on every
prompt that takes it — copy the `standards-review-concerns-statics` pattern, which is already
interpolated into three prompts.

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

## Per-prompt rules that are NOT in the step maps

The design plan's §8 holds each prompt's step map — job, first call, endpoints, gates, writes, ending.
**Its §9 holds what each SIEGE prompt must SAY**, and that is the half a rewrite drops. Both are in
`scrolls/orchestrator-step-engine-plan.md`, and for these eighteen sessions that document IS the
source: a prompt author is cutting from it, which is a different job from implementing against a spec.

| Session | Must also carry |
|---|---|
| 25h happy walker | §9d — nine rules, plus the five-step rule for an implementation-detail unit. §9a for its `docs { for: 'walking' }` scope |
| 25i antagonist | §9e — nine rules, the baseline discipline, why it never sees an operational flow |
| 25j / 25k fixers | §9f — including the rule the map omits: a fixer writes its regression test from the SAME recipes the walk's setup named |
| 25l `recipe-maker` | §9b — the setup shape, the twice-and-compare step, and the OPEN question about who writes an ingredient |
| 25m reader | §9c — it returns a LOCATION or a CONFIGURED VALUE, never an expected value |
| 25g siege planner | §9e's OPEN question about the whole-quest off-map item |
| 25c / 25f reviewers | §"The reviewer inherits the operator's real job" — the seam walk is the part with no other home |

---

## 25q — registration, and do it LAST

```
OWNS      statics/agent-prompt-classification/ · transformers/agent-name-to-prompt/
          the deletion of glyphsmith-prompt/, siegemaster-reviewer/, and the three
            operator prompts — codeweaver-prompt/, flowrider-prompt/, siegemaster-prompt/
DONE      every prompt this set adds is servable, and no deleted name resolves
```

**Do not delete the three operator prompts until 25a–25i have landed.** They are what those sessions
cut from, and `siegemaster-prompt-statics.ts` alone is 46,663 bytes of rules that have to find a home.

Story 03 opened `agentPromptNameContract`, so the CONTRACT half is a reachability check now. **The
classification and transformer rows are still required** — a missing one is a step that dispatches
against nothing.

---

## The siege prompts cut over with a siegelense delete

`scrolls/seigelense/remaining-build-items.md` §18 deletes `packages/web/test/siege-driver/` — three
files, 964 lines. **Every siege prompt today drives that lane by name.** Do it first and every other
item in that scroll gets done twice; do it last and 25g–25m are written against a mechanism about to be
replaced. Cut them together. And note §18 gets no help from lint: `siege-lane.ts` hardcodes two package
names and passes `no-hardcoded-package-names` clean.

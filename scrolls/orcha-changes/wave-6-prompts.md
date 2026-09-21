# Wave 6 — the prompts

**One session per prompt, and that is not over-splitting.** Each one is budgeted against a
50,000-character ceiling before a word of it is written, and today's operator prompts are already at
44,301 and 49,216 bytes. Two prompts in one session means one of them gets the leftover context.

**Model: opus** for the two reviewers and the three planners. **Sonnet** for everything else.

**Spec:** plan §8 for each step's map — job, first call, every endpoint, gates, writes, ending — and
plan §9 for what the siege prompts must SAY. Where a §8 map and §9 disagree, §9 wins and the map is
what needs correcting.

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

## What each siege session must read beyond its §8 map

| Session | Also reads |
|---|---|
| 6h happy walker | **plan §9d** — nine rules the map does not carry, plus the five-step rule for an implementation-detail unit. And §9a for its `docs { for: 'walking' }` scope |
| 6i antagonist | **plan §9e** — nine rules, the baseline discipline, and why it never sees an operational flow |
| 6j / 6k fixers | **plan §9f** — including the rule the map omits: a fixer writes its regression test from the SAME recipes the walk's setup named |
| 6l `recipe-maker` | **plan §9b** — the setup shape, the twice-and-compare step, and the OPEN question about who writes an ingredient |
| 6m reader | **plan §9c** — and it returns a LOCATION or a CONFIGURED VALUE, never an expected value |
| 6g planner | **plan §9e**'s open question about the whole-quest off-map item, which changes what it does with an all-operational quest |

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
`dumpster-create-prompt-statics.ts:163` never flags. Plan §9i has both quotes.

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
ASSERT    §7 opens agentPromptNameContract to free strings, so the CONTRACT half becomes a
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

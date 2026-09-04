# Work item 04 — codeweaver — orchestrator / render-images-in-transcript

## 0. Identity

- **Work item id:** `0bd22bc6-f1af-4f6f-9205-e977f2dbe274`
- **Operation item id:** `8857ed98-9679-424d-ba7e-ef800ad76d9b`
- **Session id:** `bd7e40a1-9281-4cb5-95a2-613b86bd3ef5`
- **Role:** `codeweaver`
- **Model:** `claude-opus-5` (`MODELS {'claude-opus-5': 153}` from `summary`; set by `roleToModelStatics.codeweaver: 'opus'`)
- **Operation text:** `Codeweaver: build this slice — package: orchestrator · flow: render-images-in-transcript`
- **dependsOn:** `["59f457a9-8c1e-4b10-aabd-28aa238e4c67"]` (work item [3], the orchestrator half of `send-message-with-images`)
- **Status:** `complete`, `actualSignal: "complete"`, `attempt: 0`, `maxAttempts: 1`, `retryCount: 0`
- **startRef:** `f48bbc660be26b80a6059f3a8eaf50c64a7ffba5`

**Window:** `createdAt 2026-09-01T20:14:38.798Z` -> `completedAt 2026-09-01T21:43:03.856Z`.
The transcript itself runs `START 2026-09-01T20:14:52.553000+00:00` -> `END 2026-09-01T21:43:18.442000+00:00`,
`WALL 1:28:25.889000 (88.4 min)`. All elapsed times below are measured from the transcript start.

**Sub-agent count and models — 18 total**, from the `subagents` roster (pasted verbatim in §7):

| Depth | Count | Model |
|---|---|---|
| Direct children dispatched by the operator (`Agent` x10) | 10 | 9 × `general-purpose/sonnet`, 1 × `general-purpose/sonnet` (the `codeweaver-reviewer`) |
| Grandchildren spawned by those children | 8 | 1 × `Explore/haiku` (`agent-a7edb510690a9b4c0`), 1 × `general-purpose/None` (`agent-aa482853400244900`), 6 × `Explore/None` |

The `10 Agent` calls in the operator's own tool histogram plus 8 grandchildren = 18. Six of the eight
grandchildren were spawned by one sub-agent, `agent-abfedef11259e5533`.

**Outcome:** one reviewer pass, zero rework rounds. Single commit `022d408cb`, 29 files, `965 insertions(+), 17 deletions(-)`.
All 12 of the cell's observables carry `codeweaverSignoff.verdict: 'confirmed'` attributed to this work item.

---

## 1. Chronological breakdown — where the time went

Phases sum to 88.4 min. Clock times are UTC; elapsed is minutes from `20:14:52.553`.

| # | Clock window | Elapsed | Min | What happened | Evidence |
|---|---|---|---|---|---|
| 1 | 20:14:52–20:15:26 | 0.0–0.6 | 0.6 | Fetch prompt, quest, three standards docs | `0.2m CALL mcp__dungeonmaster__get-agent-prompt(agent=codeweaver …)` → `result 33,707 bytes`; `0.3m CALL get-quest(… packageName=orchestrator)` → `result 22,223 bytes`; `0.5m` get-architecture / get-syntax-rules / get-testing-patterns |
| 2 | 20:15:26–20:21:35 | 0.6–6.7 | 6.1 | Explore the package: `git log`, 10 `discover`, 17 `Read` | `0.6m CALL Bash(command=git log --oneline -n 20)`; `3.7m` Read `packages/server/src/statics/api-routes/api-routes-statics.ts`; `6.7m say: "Design settled. Writing my map."` |
| 3 | 20:21:35–20:22:22 | 6.7–7.5 | 0.8 | Write the map; dispatch **group 1** (2 parallel agents) | `7.2m CALL Write(file_path=….quest-plans/8857ed98-…-map.md)` → `6,985 bytes`; `7.5m` + `7.8m` two `Agent` calls |
| 4 | 20:22:22–20:25:22 | 7.5–10.5 | 3.0 | **Idle** waiting on group 1 (2 reads at 7.8m/7.9m, then turn ended) | `7.8m say: "Group 1 is out — two agents running in parallel. Ending my turn while they work"`; gaps `56s` + `99s` |
| 5 | 20:25:22–20:25:52 | 10.5–11.0 | 0.5 | Dispatch **group 2** (1 agent) | `11.0m CALL Agent(description=Build image path to url transformer …)` |
| 6 | 20:25:52–20:30:22 | 11.0–15.5 | 4.5 | **Idle** waiting on group 2 | gap `272s` at `15.5m` |
| 7 | 20:30:22–20:31:16 | 15.5–16.4 | 0.9 | Dispatch **group 3a** (1 agent); sign 9 observables | `16.0m CALL Agent(description=Rewrite image paths in user parse …)`; `16.4m CALL modify-quest` |
| 8 | 20:31:16–20:36:26 | 16.4–21.6 | 5.2 | **Idle** waiting on group 3a | gap `312s` at `21.6m` |
| 9 | 20:36:26–20:37:10 | 21.6–22.3 | 0.7 | Dispatch **group 3b** (1 agent); sign observable 10 | `22.1m CALL Agent(description=Thread serverBaseUrl through line funnel …)`; `22.2m CALL modify-quest` |
| 10 | 20:37:10–20:58:04 | 22.3–43.2 | **20.9** | **Idle** waiting on ONE agent, `agent-a31d97da77c633655` | gap `1259s` at `43.2m`. That agent ran `20:36:57 +20.8m`, `turns=147 out=104,610 ctx-in=33,854,130` |
| 11 | 20:58:04–20:58:52 | 43.2–44.0 | 0.8 | Read the out-of-scope `eslint-plugin` diff and accept it | `43.3m say: "The passthrough wave passed, but it widened into packages/eslint-plugin — a package this quest never declared. Reading that diff before I accept it."`; `44.0m say: "The eslint-plugin change is a real rule bug, not an evasion"` |
| 12 | 20:58:52–21:00:00 | 44.0–45.1 | 1.1 | Dispatch **group 4** (3 parallel agents) | `44.3m`, `44.7m`, `45.1m` three `Agent` calls in consecutive turns |
| 13 | 21:00:00–21:00:41 | 45.1–45.8 | 0.7 | Locate `quest.json` on disk (2 blocked calls), write `packagesAffected` + tooling note | `45.3m` `Error: This Bash command contains multiple operations…require approval`; `45.3m` `PreToolUse:Bash hook error … BLOCKED: Native search tools are disabled`; `45.7m CALL modify-quest` |
| 14 | 21:00:41–21:11:59 | 45.8–57.1 | 11.3 | **Idle** waiting on group 4 (3 in parallel; longest 12.3m) | gaps `186s` + `163s` + `331s` |
| 15 | 21:11:59–21:12:23 | 57.1–57.5 | 0.4 | Dispatch **group 5** (1 agent) | `57.5m CALL Agent(description=Prove chat output payload carries urls …)` |
| 16 | 21:12:23–21:33:58 | 57.5–79.1 | **21.6** | **Idle** waiting on ONE agent, `agent-abfedef11259e5533` | gap `1294s` at `79.1m`. That agent ran `21:12:22 +21.5m`, `turns=67 out=77,409`, and spawned 6 children |
| 17 | 21:33:58–21:35:00 | 79.1–80.1 | 1.0 | Sign last 2 observables; `git status`; read the whole diff; read the 2 new files | `79.4m CALL Bash(command=git diff -- …)` → `result 26,473 bytes`; `79.5m say: "The production diff matches my map exactly."` |
| 18 | 21:35:00–21:35:04 | 80.1–80.1 | 0.05 | Dispatch the reviewer | `80.1m CALL Agent(description=Review orchestrator transcript images cell …)`, prompt length 252 chars |
| 19 | 21:35:04–21:42:29 | 80.1–87.6 | 7.5 | **Idle** waiting on the reviewer | gap `446s` at `87.6m`. Reviewer ran `21:34:58 +7.1m`, `turns=92` |
| 20 | 21:42:29–21:43:03 | 87.6–88.2 | 0.6 | Verify clean tree, read the contract entry, amend one spec description, `signal-back` | `87.9m say: "The route property already pins /api/images in the server's statics …"`; `88.2m CALL signal-back` |
| 21 | 21:43:03–21:43:18 | 88.2–88.4 | 0.2 | Handoff prose | `88.4m say: "Signalled done. Here's what this cell built …"` |

Sum: 0.6+6.1+0.8+3.0+0.5+4.5+0.9+5.2+0.7+20.9+0.8+1.1+0.7+11.3+0.4+21.6+1.0+0.05+7.5+0.6+0.2 = **88.45 min**.

### The overrun, stated directly

The ten `gap` values on the timeline lines that immediately follow a `### INJECTED PROMPT: <task-notification>`
are the operator's idle time:

```
56, 99, 272, 312, 1259, 186, 163, 331, 1294, 446   (seconds)
sum = 4418 s = 73.6 min  of 88.4 min wall clock (83.3%)
active main-session time = 88.4 - 73.6 = 14.8 min
```

Two of those ten gaps — phases 10 and 16 — are single-agent waves:

```
1259 + 1294 = 2553 s = 42.5 min = 48.1% of the whole work item
```

**Nothing in this work item was slow because the operator was slow.** It spent 14.8 minutes working and
73.6 minutes blocked, and half the wall clock came from two sub-agents it dispatched alone and then had
nothing to do behind. §5 findings 1, 2 and 6 are the three reasons those two waves ran as long as they did.

### Time by category

| Category | Minutes | % of 88.4 | Phases |
|---|---|---|---|
| Orientation / reading (package explore, eslint diff, final diff) | 8.3 | 9.4% | 1, 2, 11, part of 17 |
| Planning (writing the map) | 0.5 | 0.6% | part of 3 |
| Sub-agent dispatch — writing the 10 briefs | 3.35 | 3.8% | 3, 5, 7, 9, 12, 15, 18 |
| **Sub-agent dispatch — WAITING on code-writing agents** | **66.5** | **75.2%** | 4, 6, 8, 10, 14, 16 |
| Review cycles — waiting on the reviewer | 7.5 | 8.5% | 19 |
| Verification / ward | 0.0 | 0.0% | none — `[BUILD]` forbids the operator from running either |
| Quest ledger writes (6 × `modify-quest`, `signal-back`) | 2.1 | 2.4% | 7, 9, 13, 17, 20 |
| Handoff prose | 0.2 | 0.2% | 21 |
| Idle-or-stall not attributable to a running helper | 0.0 | 0.0% | — |

There is **no dead time in this session**. Every minute the operator was not working, a helper was running.
The overrun is entirely a *shape-of-fan-out* problem, not a stalling problem.

---

## 2. Chronological token buckets

`python3 tmp/transcript-digest.py buckets bd7e40a1-9281-4cb5-95a2-613b86bd3ef5 --minutes 5`, verbatim:

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/bd7e40a1-9281-4cb5-95a2-613b86bd3ef5.jsonl
LINES     477
START     2026-09-01T20:14:52.553000+00:00
END       2026-09-01T21:43:18.442000+00:00
WALL      1:28:25.889000  (88.4 min)

BUCKETS of 5 min
WINDOW              APIs  CALLS   OUT-TOK    CTX-IN-TOK  RESULT-BYTES  TOP TOOLS
09-01 20:14-20:19    57     29    39,587     8,713,095       314,639  Readx12, mcp__dungeonmaster__discoverx8, Bashx3, ToolSearchx1
09-01 20:19-20:24    23     10    31,511     5,558,362        29,858  Readx5, mcp__dungeonmaster__discoverx2, Agentx2, Writex1
09-01 20:24-20:29     4      1    10,578     1,020,695         7,350  Agentx1
09-01 20:29-20:34     7      3    16,809     1,981,718         6,186  Agentx1, ToolSearchx1, mcp__dungeonmaster__modify-questx1
09-01 20:34-20:39     5      2     9,889     1,586,876         6,728  Agentx1, mcp__dungeonmaster__modify-questx1
09-01 20:54-20:59     8      4    20,950     2,597,999        14,989  Bashx2, Agentx2
09-01 20:59-21:04    13      6     9,268     4,392,990         8,524  Bashx4, Agentx1, mcp__dungeonmaster__modify-questx1
09-01 21:04-21:09     2      0       930       687,236             0  
09-01 21:09-21:14     4      1     7,149     1,384,900         5,709  Agentx1
09-01 21:29-21:34    14      7     7,537     5,001,406        32,067  Bashx3, mcp__dungeonmaster__modify-questx2, Readx2
09-01 21:34-21:39     4      1     2,224     1,472,191           694  Agentx1
09-01 21:39-21:44    12      5    11,759     4,478,363         3,654  Bashx3, mcp__dungeonmaster__modify-questx1, mcp__dungeonmaster__signal-backx1
```

**Three 5-minute windows are absent from that table because the operator made zero API calls in them:**
`20:39-20:44`, `20:44-20:49`, `20:49-20:54` (inside phase 10's 20.9-min wait) and `21:14-21:19`,
`21:19-21:24`, `21:24-21:29` (inside phase 16's 21.6-min wait). Six missing rows out of eighteen.

### Sub-agent spend attributed to the 5-minute bucket each sub-agent STARTED in

Computed from each sub-agent's own `.jsonl` usage records; `cache_read` and `cache_creation` kept separate.

| Bucket (start) | Agent | uncached in | cache_read | cache_creation | output | of which thinking |
|---|---|---|---|---|---|---|
| 20:19 | agent-a5d49c9cbb0542e12 | 36 | 507,175 | 145,115 | 4,200 | 746 |
| 20:19 | agent-aa4973b1fc659ce10 | 76 | 3,480,270 | 349,118 | 6,785 | 744 |
| 20:24 | agent-a949d012d4547b094 | 116 | 6,772,903 | 322,737 | 20,260 | 10,814 |
| 20:29 | agent-aa62ec49f7f1a348d | 68 | 3,471,222 | 471,293 | 14,671 | 6,207 |
| 20:29 | agent-aa482853400244900 | 10 | 87,543 | 66,360 | 2,463 | 42 |
| 20:34 | **agent-a31d97da77c633655** | 294 | **33,089,816** | 764,020 | **104,610** | 82,936 |
| 20:34 | agent-a7edb510690a9b4c0 | 282 | 1,300,549 | 215,826 | 3,817 | 1,243 |
| 20:54 | agent-ab3ab63d4816335b3 | 90 | 6,410,076 | 559,943 | 24,587 | 15,660 |
| 20:54 | agent-a33f417b97445b6e6 | 224 | 19,158,967 | 604,717 | 66,086 | 48,571 |
| 20:59 | agent-aef5f7dbf9161f789 | 128 | 9,912,612 | 558,254 | 27,962 | 15,891 |
| 21:09 | **agent-abfedef11259e5533** | 134 | 11,105,716 | 836,435 | **77,409** | 61,730 |
| 21:09 | agent-ac290f4cc696830fc | 48 | 591,573 | 177,190 | 2,692 | 740 |
| 21:09 | agent-a79f57219d028e74c | 10 | 73,314 | 80,919 | 1,466 | 9 |
| 21:14 | agent-adef2f040b06c0e76 | 54 | 1,110,053 | 336,684 | 16,748 | 11,798 |
| 21:19 | agent-a0a4350ddc360380e | 50 | 1,158,801 | 252,331 | 3,983 | 429 |
| 21:24 | agent-a382451a6aeb80795 | 16 | 133,789 | 22,147 | 1,095 | 411 |
| 21:24 | agent-a97b66b668a059038 | 46 | 1,661,008 | 213,418 | 6,106 | 2,474 |
| 21:34 | agent-a32f6fad31c4ce7ce (reviewer) | 184 | 14,285,733 | 610,118 | 24,937 | 15,169 |

Rolled up per bucket:

| Bucket (start) | agents started | sub-agent output | sub-agent context-in |
|---|---|---|---|
| 20:19 | 2 | 10,985 | 4,481,790 |
| 20:24 | 1 | 20,260 | 7,095,756 |
| 20:29 | 2 | 17,134 | 4,096,496 |
| **20:34** | 2 | **108,427** | **35,370,787** |
| 20:54 | 2 | 90,673 | 26,734,017 |
| 20:59 | 1 | 27,962 | 10,470,994 |
| 21:09 | 3 | 81,567 | 12,865,339 |
| 21:14 | 1 | 16,748 | 1,446,791 |
| 21:19 | 1 | 3,983 | 1,411,182 |
| 21:24 | 2 | 7,201 | 2,030,424 |
| 21:34 | 1 | 24,937 | 14,896,035 |

The `20:34` bucket — one 5-minute window in which the operator made **5 API calls and 2 tool calls** — is
the bucket that launched **35.4M of context-in and 108K of output tokens**. The operator's own token
footprint is nearly uncorrelated with where the cost went.

### Totals

| | uncached input | cache_read | cache_creation | **total context-in** | output | of which thinking |
|---|---|---|---|---|---|---|
| Main session | 306 | 38,126,486 | 749,039 | **38,875,831** | 168,191 | 85,852 |
| 18 sub-agents | 1,866 | 114,311,120 | 6,586,625 | **120,899,611** | 409,877 | 275,614 |
| **Grand total** | **2,172** | **152,437,606** | **7,335,664** | **159,775,442** | **578,068** | **361,466** |

Arithmetic: `38,126,486 + 114,311,120 = 152,437,606`; `749,039 + 6,586,625 = 7,335,664`;
`306 + 1,866 = 2,172`; `152,437,606 + 7,335,664 + 2,172 = 159,775,442`.
`168,191 + 409,877 = 578,068`.

`cache_read` is **95.4%** of all context-in (`152,437,606 / 159,775,442`). `cache_creation` is 4.6%.
The sub-agents carry **75.7%** of the context-in and **70.9%** of the output — the operator is a thin
dispatcher over a very heavy fan-out.

Tool-result bytes fed back into the main session, by originating tool:

```
  10     92,831  mcp__dungeonmaster__discover
  15     69,157  Bash
  19     58,237  Read
   1     51,401  mcp__dungeonmaster__get-testing-patterns
  10     50,886  Agent
   1     33,707  mcp__dungeonmaster__get-agent-prompt
   1     24,528  mcp__dungeonmaster__get-syntax-rules
   1     22,223  mcp__dungeonmaster__get-quest
   1     19,056  mcp__dungeonmaster__get-architecture
   1      6,985  Write
   2        722  ToolSearch
   1        335  mcp__dungeonmaster__signal-back
   6        330  mcp__dungeonmaster__modify-quest
TOTAL 430,398
```

---

## 3. Was the prompt fit for the work?

The rendered prompt was recovered with
`python3 tmp/transcript-digest.py result bd7e40a1-9281-4cb5-95a2-613b86bd3ef5 get-agent-prompt --max-chars 40000`
(`33,717 chars`, `model: "opus"`). **It is byte-identical to `codeweaverPromptStatics.prompt.template`
with `$ARGUMENTS` substituted** — no truncation, no spill, comfortably under
`mcpToolResultStatics.maxVerbatimChars` (50,000).

### 3.1 The step script matched the work almost exactly

**Quote (step 3):**
> `**A map, not an essay.** One line per file. It is what you cut briefs out of at step 4 and check against at step 5`

**What the agent did:** wrote an 89-line map at `7.2m` with five groups, a `PROVES` block mapping all 12
observables to test files, and a six-line `TRAPS` block. At `79.5m` it checked the diff against it and
said `"The production diff matches my map exactly."` The map is the single best artifact this session
produced, and every one of its `TRAPS` lines shows up verbatim in a sub-agent brief:

```
  - `chatLineProcessTransformer()` is called with no arguments at ~60 test sites; the new factory
    param must default so those keep compiling.
```
→ reappears in the `22.0m` brief as `The `= {}` default is load-bearing: about sixty existing call sites write
`chatLineProcessTransformer()` with no arguments and must keep compiling.`

**Quote (Briefing a sub-agent):**
> `Write a FILE MAP and terse instructions. Never prose.` … `Dispatch with `subagent_type: "general-purpose"` and `model: "sonnet"`.`

All 10 briefs used the prescribed `FILES / DO / MUST BE TRUE / TRAPS / DO NOT TOUCH / READ FIRST / PROVE /
RETURN` shape, all with `model: 'sonnet'` and `subagent_type: 'general-purpose'`. Brief lengths ran
2,298–6,683 chars. Both `[GIT FORMS]` refusals were pasted into every code-writing brief's `TRAPS`, as the
prompt demands. This is the most faithful brief-shape adherence in the item.

**Quote (Reading a sub-agent's return):**
> `| nothing starting `NEXT:` | treat it as `rework`, and say so when you signal |`

Every one of the 10 direct children ended with a `NEXT:` line. I checked the largest one specifically
(`grep agent-a31d97da77c633655 "NEXT:"`) because a deep-dive sub-agent of mine claimed it had none —
it does: `20.8m assistant … NEXT: pass`. No return was mis-routed.

### 3.2 The scope block was accurate, but the transformer built to enrich it is DEAD CODE

The rendered `## Operation Context` is exactly four lines:

```
Quest ID: 1be07040-b9ec-476c-a439-0b4fbb0123cd
Work Item ID: 0bd22bc6-f1af-4f6f-9205-e977f2dbe274
Operation Item ID: 8857ed98-9679-424d-ba7e-ef800ad76d9b
Your operation item: [codeweaver] Codeweaver: build this slice — package: orchestrator · flow: render-images-in-transcript
```

Searching the whole 33,717-char rendered prompt for the strings `Seams`, `Shared homes`, `shared-home`
and `library-kind` returns **0 hits each**. A repo-wide scan for the symbol confirms why:

```
packages/orchestrator/src/transformers/codeweaver-scope-block/codeweaver-scope-block-transformer.test.ts  19
packages/orchestrator/src/transformers/codeweaver-scope-block/codeweaver-scope-block-transformer.ts        2
```

`codeweaverScopeBlockTransformer` is imported by **nothing but its own test**.
`workItemToPromptTransformer` — the function that actually renders `$ARGUMENTS` — builds `parts` from four
`contentTextContract.parse(...)` lines and then appends role-specific extras for `siegemaster`, `warpgate`
and `spiritmender` only. There is no `codeweaver` branch and no call to the scope-block transformer.

**This mattered here.** Two of this cell's three owned nodes are glue nodes:
`#replay-user-line {server, orchestrator}` and `#deliver-entry {orchestrator, server, web}`. The
transformer would have rendered, for free:

```
  - #replay-user-line with server — NOT BUILT YET: a later session owns these — build your half to the shape they need, and do NOT build theirs
  - #deliver-entry with server — NOT BUILT YET: …
  - #deliver-entry with web — NOT BUILT YET: …
Shared homes — the library-kind packages this quest declares…
  - shared — orchestrator already depends on it
```

The agent derived all of that by hand instead. Phase 2 (`0.6m–6.7m`, **6.1 minutes**) is almost entirely
that derivation — `0.6m git log --oneline -n 20`, `0.6m git log --name-only -n 3`, `1.5m` read
`pasted-image-statics.ts`, `3.6m` read `packages/server/src/statics/api-routes/api-routes-statics.ts` —
and it wrote the conclusion into its map at lines 23–26:

> ``/api/images` lands in `pastedImageStatics` (shared) rather than in the orchestrator, because the
> server's own route (`apiRoutesStatics`, the contract's `source`) has to read the same value and the
> server's cell has NOT committed yet — so this side adds the shared key and reads it; it does NOT
> touch `apiRoutesStatics`.`

That paragraph is the seam-and-shared-home block, re-derived by an opus session at ~4 minutes of
exploration. It got it right — but the code to hand it over already exists and is not wired in.

Partial mitigation: `get-quest`'s render *does* carry `Packages affected (whole quest): web (edit,
frontend-react), server (edit, http-backend), orchestrator (edit, programmatic-service), shared (edit,
library)` and per-node package tags like `{server ● 1, orchestrator ● 1}`. What it does **not** carry is
the ledger disposition (has the sibling cell run yet?) or the dependency reachability — precisely the two
things the dead transformer computes.

### 3.3 The `get-quest` flow render was well-shaped and correctly sized

`22,223 bytes` for a flow of `19 nodes / 22 edges` of which this cell tags 3. The render's `◀ YOURS`
markers and its collapse of other packages' observables to a count (`{web ● 3, server}`) did their job:
the agent's first substantive statement, at `0.5m`, is

> `My cell is the orchestrator's half of #render-images-in-transcript: three nodes (#replay-user-line, #rewrite-paths-to-urls, #deliver-entry), 12 observables, and one contract naming packages/orchestrator/src/transformers/image-path-to-url/image-path-to-url-transformer.ts.`

That is exactly right and cost one call. No complaint here.

### 3.4 What the prompt made the agent load and never use

**Quote (step 2):**
> `Load the repo's standards before you read anything else: `get-architecture`, `get-syntax-rules` and `get-testing-patterns`. None takes an argument. They override your training defaults`

The operator loaded all three at `0.5m`: `19,056 + 24,528 + 51,401 = 94,985 bytes` (~24k tokens).
**But the operator writes no code** — `**You read code. You never write it.**` is the second line of the
prompt's own "What you do, and what you never do". Every one of those standards is a rule about how to
*type* something. And every code-writing brief the operator wrote ends with:

```
READ FIRST
  get-architecture, get-syntax-rules, get-testing-patterns
```

so the sub-agents fetch them again. From the `subagents` roster: `get-architecture` was called by 7
sub-agents, `get-syntax-rules` by 8, `get-testing-patterns` by 7 — **22 additional fetches of the same
~95KB**, plus the operator's own 3. The operator needs `get-architecture` (folder types, to place a new
contract and transformer correctly) and arguably nothing else.

### 3.5 What was missing and the agent had to invent

**No way to read `packagesAffected` before rewriting it.** Step 3 says:

> `**Add the package to `packagesAffected` with `modify-quest` before you plan against it.** … **It is REPLACED WHOLE on write.** Send back every entry already there plus your new one, or the write drops the rest.`

There is no tool that returns that array. The agent spent phase 13 (`45.1m–45.8m`) hunting `quest.json`
on disk and ate two refusals doing it:

```
45.3m  Error: This Bash command contains multiple operations. The following parts require approval: ls …/.dungeonmaster/, ls …/.dungeonmaster/guilds
45.3m  Error: PreToolUse:Bash hook error: [dungeonmaster-pre-bash]: BLOCKED: Native search tools are disabled.
```

It recovered per `[WALL]` ("`Read` with an offset, `discover` and `python3 -c` do what `grep`, `find` and
`sed` would") — a `python3` `os.walk` at `45.4m` found the file and a second `python3` at `45.5m` printed
the array. Correct behaviour, ~30 seconds and 4 tool calls to do something an MCP field could have handed
over.

**No guidance on what to do when the repo's own tooling blocks a briefed change.** The single largest
event in this work item — `agent-a31d97da77c633655` spending 12.6 of 20.8 minutes fixing
`packages/eslint-plugin` — happened because the operator's own prescribed signature tripped a false
positive in the repo's `ban-primitives` pre-edit-lint hook. The prompt has a `[WALL]` rule for "the
environment blocks you", but it points at `signal blocked`, which would have been wrong here. There is no
rule that says *a repo tooling bug that blocks your briefed change is a fix you may make, but report it and
stop there.* The sub-agent invented the right policy on its own and the operator ratified it at `44.0m`.

### 3.6 One prompt instruction the operator deviated from, with evidence

**Quote (step 4):**
> `**Every change in ONE group goes out in a SINGLE message**, one `Agent` call each, so they run at the same time.` … `**Two changes touching the same file never go out together**`

The map's `GROUP 3` lists three disjoint file-pairs:

```
GROUP 3  (needs group 2 — two agents, different files)
  …/parse-user-stream-entry/parse-user-stream-entry-transformer.ts       edit
  …/stream-json-to-chat-entry/stream-json-to-chat-entry-transformer.ts   edit
  …/chat-line-process/chat-line-process-transformer.ts                   edit
```

(The group header even says "two agents".) They went out as **two serial waves**: one agent at `16.0m`
(parse-user-stream), one agent at `22.1m` carrying the other two bundled together. Set intersection of the
two waves' file lists is empty — nothing forced the split. Cost: `312s + 1259s = 26.2 min` of wall clock
for work the map itself said could go in one wave. This is finding 1 in §5.

---

## 4. What went well

1. **The map is the mechanism that made this a one-pass item.** Written at `7.2m` (`6,985 bytes`), it
   pre-registered all 12 observables against the test file that would prove each, and pre-registered six
   traps. The reviewer returned `NEXT: pass` on the first try, `BUILD: green`, `WARD: green`, one commit
   `022d408cb`. **Zero rework rounds** in a role whose prompt says `There is no cap. Keep going until your
   reviewer says pass.` Cost of the map: `0.5 min`, ~2,979 output tokens.

2. **Trap propagation prevented a whole class of failure before it happened.** Map trap:
   > `The three broker test suites mock fs with throw-on-unmatched, so each of those three proxies MUST stage a port in its CONSTRUCTOR or every existing test in those files goes red.`

   All three group-4 briefs (`44.3m`, `44.7m`, `45.1m`) carry that instruction with the exact
   `serverConfigProxy.setPort({ value: '3737' })` snippet. All three broker agents returned `NEXT: pass`;
   `agent-ab3ab63d4816335b3` (4.5m, 45 turns) ran with **zero errors of any kind** —
   `TOOL RESULT BYTES fed back: 0`, no lint blocks, no failed tests, no retries.

3. **Real red/green discipline in the sub-agents, unprompted by anything but the `PROVED` line format.**
   Three separate agents deliberately broke their own code to watch the test fail:
   - `agent-a5d49c9cbb0542e12` at `0.8m` — removed `serveRoutePath` and watched `FAIL "pastedImageStatics VALID: exported value => matches expected shape"`, then restored it.
   - `agent-aa4973b1fc659ce10` at `2.0m` — added `.min(1)` temporarily and watched the empty-string case ZodError, then reverted.
   - `agent-a33f417b97445b6e6` at `11.0–11.3m` — reverted the broker fix and confirmed the received value was `"A![Pasted Image 1](/p/x.png)B"` before restoring.

   The mechanism is the `RETURN` block's demand for `<the red I watched before the code made it pass>`.
   It cost each agent one extra ward run and it is why the reviewer found nothing to reject.

4. **One genuine bug caught by a scoped ward, not by a human.** `agent-a949d012d4547b094` at `3.3m` hit
   `FAIL "…non-ASCII path VALID:… round-trips back to the original path"` because the markdown wrapper's
   trailing `)` was leaking into the captured query value. Fixed and re-run green inside the same 4.1-min
   agent. That is `check-non-ascii-encoded` — an observable that would have shipped silently wrong.

5. **The operator read the out-of-scope diff before accepting it, instead of rubber-stamping it.** At
   `43.3m` it noticed the widening, ran two scoped `git diff` calls, and at `44.0m` produced a correct
   root-cause statement:
   > `for `({x}: T = {})` the ObjectPattern's parent is an `AssignmentPattern`, so the walker never classified it as a parameter and flagged a legitimate input. The fix walks one level up. `portResolveBroker` in shared already uses that exact shape but with a branded type`

   It then recorded the whole thing as a `tooling-error` quest note
   (`ban-primitives-assignment-pattern-blind-spot`, `at: 2026-09-01T21:00:37.011Z`) and added
   `eslint-plugin` to `packagesAffected`. Cost: `0.8 + 0.7 = 1.5 min`. That note is the only durable record
   of a real repo bug fix that had nothing to do with this quest.

6. **A spec correction found by reading the artifact, not the plan.** At `87.7m`, after the reviewer had
   already passed, the operator read the `#image-serve-endpoint` contract's `route` property out of
   `quest.json` and found it still pinned the literal `/api/images` in the server's statics — which would
   have re-typed the string it had just centralised in `shared`. It amended that one description at
   `88.0m` so the server cell (work item [6], still unrun) reads the shared key. Cost: `0.4 min`. This is
   the step-8 spec-change path working as designed.

---

## 5. What agents did that they should not have

### Finding 1 — The operator serialized a group its own map said was parallel

**What happened.** Map `GROUP 3` lists three disjoint file-pairs under a header reading
`(needs group 2 — two agents, different files)`. They went out as two serial waves instead:
`16.0m CALL Agent(description=Rewrite image paths in user parse …)` and, after that returned,
`22.1m CALL Agent(description=Thread serverBaseUrl through line funnel …)` — the second carrying
`stream-json-to-chat-entry` **and** `chat-line-process` bundled into one agent. The second brief opens
`` `parseUserStreamEntryTransformer` ALREADY accepts `serverBaseUrl?: string` — it landed on this branch
minutes ago. Read it first; do not modify it.`` — an ordering dependency the operator introduced at
dispatch time that its own map did not contain.

**Cost.** `312s + 1259s = 1571s = 26.2 min`, 39% of the run's idle time. Had all three gone out together,
the wave would have cost roughly the longest of the three. The parse agent took 5.5m; the bundled agent's
*briefed* work (excluding the eslint detour, finding 2) was ~8.2m. A three-way parallel wave would
plausibly have cost 8–10 min. **Estimated waste: 16–18 min.** Tokens are unchanged — the same work was
done, just not concurrently.

**Prompt disposition: FORBIDDEN.** `**Every change in ONE group goes out in a SINGLE message**, one `Agent`
call each, so they run at the same time. Wait for all of them to return and route each return, then send
the next group.`

### Finding 2 — A sub-agent spent 61% of its life fixing a package outside the quest

**What happened.** `agent-a31d97da77c633655` was briefed on four orchestrator files. Its first attempt at
the operator-prescribed signature was rejected by the repo's own pre-edit-lint hook at **1.4m**:

> `PreToolUse:Edit hook error: [dungeonmaster-pre-edit-lint]: New code quality violations detected: ❌ Code Quality Issue: 1 violation … Line 54:19 - Raw string type is not allowed. … Your edit was NOT applied — the file is unchanged.`

It then investigated the rule (`3.7m`), searched for an escape hatch at `5.8m`
(`CALL mcp__dungeonmaster__discover(grep=eslint-disable.*ban-primitives)` — found nothing reusable and did
**not** reach for a suppression), built a scratch repro in `tmp/ban-primitives-repro.ts`, fixed the walker
at `14.2m`, added regression tests at `14.7m`/`15.0m`, and only landed its briefed edit at `15.5m`. It ran
a second scoped ward for the three eslint-plugin files at `20.0–20.3m`.

**Cost.** Detour range ≈ `3.7m → 15.7m` plus `20.0–20.3m` = **≈12.6 of its 20.8 minutes (61%)**. Its own
token spend was `output 104,610 / ctx-in 33,854,130` — the largest of any agent in the item, and 61% of it
is attributable to a package the quest never declared. It also blocked the operator for the whole 20.9-min
phase 10.

**Prompt disposition: NEITHER PERMITTED NOR FORBIDDEN — the gap is the finding.** The brief's `FILES` block
named four orchestrator files and nothing else; the codeweaver prompt has no rule for "the repo's own
tooling rejects the change I was briefed to make". The `[WALL]` rule points at `signal blocked`, which
would have been strictly worse. The fix was correct (verified independently by the operator at `44.0m` and
by the reviewer, and `portResolveBroker` in `shared` uses the identical shape), but it should have been
reported up and dispatched as its own change, not absorbed inside a briefed wave whose parent was blocked
behind it.

### Finding 3 — The same blocked edit was resubmitted unchanged before being diagnosed

**What happened.** In `agent-a31d97da77c633655`, the identical `chatLineProcessTransformer` signature edit
was submitted at `1.2m` (blocked `1.4m`), resubmitted after a `discover` detour at `2.0m` (blocked again at
`2.8m`, byte-identical error, same `Line 54:19`), and only succeeded at `15.5m` after the rule was fixed.
Two of three submissions were pure retries of a known-blocked payload. The same agent then had its scratch
repro file blocked twice more while iterating (`9.0m` "Raw string type is not allowed"; `9.2m` "Function
parameters must use object destructuring pattern").

**Cost.** ~1.4 min of wall clock and the tokens of one full `discover` + edit round-trip. Small in absolute
terms; notable because it is the classic "retry the refusal" pattern.

**Prompt disposition: FORBIDDEN in spirit.** `[HELPERS]`: `**Never `sleep`. Never poll. Never re-run
something to find out whether it finished.**` — written about async helpers, not about blocked edits. No
rule covers "do not resubmit a deterministic refusal unchanged."

### Finding 4 — A sub-agent dispatched a child and then did the child's job itself, in parallel

**What happened.** `agent-a31d97da77c633655` dispatched `agent-a7edb510690a9b4c0` (Explore/haiku) at
`0.3m` to fetch `UserTextStringStreamLineStub` and `imagePathToUrlTransformer`. While that child was still
running (child wall `20:37:18 → 20:38:14`), the parent ran
`discover(grep=UserTextStringStreamLineStub)` at `0.6m` and `Read` the stub source directly at `0.7m`,
saying `"Now let me check the stub source itself."` The child's own run included path-fumbling — it guessed
a wrong path and needed `ls` to find `packages/shared`.

**Cost.** The child burned `out=3,817 / ctx-in=1,516,657` for an answer the parent had already obtained.
~57 seconds of round-trip, fully wasted.

**Prompt disposition: PERMITTED but pointless.** Step 2 permits explorer sub-agents
(`**Dispatch explorer sub-agents where the package is too large to read yourself.**`); nothing forbids
duplicating one. The parent never consumed the child's report.

### Finding 5 — A sub-agent delegated a single `Read` whose exact path it already knew

**What happened.** `agent-aa62ec49f7f1a348d` spawned `agent-aa482853400244900` ("Locate pastedImageStatics
definition"), and the dispatch prompt already contained the answer:
`packages/shared/src/statics/pasted-image/pasted-image-statics.ts`. The child made **2 tool calls total**
(1 Bash, 1 Read) in `0.4m`.

**Cost.** `out=2,463 / ctx-in=153,913` and ~27 seconds of round-trip to replace one `Read`.

**Prompt disposition: PERMITTED.** Nothing in the codeweaver prompt reaches a grandchild's dispatch
decisions — a code-writing sub-agent is briefed in the operator's own words and inherits no discipline
about when delegation is worth it.

### Finding 6 — One sub-agent spent 54% of a 21.5-minute run idle behind six SEQUENTIALLY dispatched children

**What happened.** `agent-abfedef11259e5533` was briefed on **two files** (`chat-replay-responder.proxy.ts`,
2 lines; `chat-replay-responder.test.ts`, 2 added cases) to prove **two observables**. It dispatched six
Explore children one at a time, each immediately after the previous returned:

```
0.5m  Agent(Find ChatEntry narrowing pattern in tests)          -> returns 1.6m   (gap  66s)
1.9m  Agent(Find pasted-image test in stream-process-handle)     -> returns 2.5m   (gap  38s)
6.4m  Agent(Find payload.entries typed-narrowing patterns)       -> returns 10.4m  (gap 242s)
10.5m Agent(Inspect chat-output-emit-payload-contract shape)     -> returns 13.3m  (gap 167s)
13.4m Agent(Check zod .array() method usage precedent)           -> returns 14.0m  (gap  38s)
14.1m Agent(Inspect chat-line-process-transformer user handling) -> returns 16.6m  (gap 146s)
```

Sum of those gaps: `66+38+242+167+38+146 = 697s = 11.6 min`, **54% of its 21.5-minute wall clock**, idle
behind its own children. Actual editing, ward, fix and verification occupied only the last ~4.9 minutes
(`16.6m → 21.5m`). Its `buckets --minutes 2` output contains a `21:20-21:22` row reading
`0 0 0 0 0` — a full two minutes with zero API calls.

**Cost.** It blocked the operator for the whole 21.6-min phase 16 — 24% of the entire work item.
Its own spend was `out=77,409` (of which `thinking=61,730`, **80%**) and `ctx-in=11,942,285`; the six
children added `out=32,090 / ctx-in=7,811,641`.

**Prompt disposition: the operator's brief PERMITTED it and made it necessary.** The brief forbade every
shortcut — no `as` cast, no contract-type import, no conditional, no helper function — for narrowing a
7-member discriminated union out of a `Record<PropertyKey, unknown>` payload, so the agent researched
rather than attempted. It never hit a single TypeScript error: the only red ward run (`19.1m`,
`Received: undefined`) was a test-mock setup bug (`setupQuestWorktree` unstaged, so `questCwdResolveBroker`
threw unmatched-call and the responder's own catch swallowed it, firing no `chat-output` frame at all).
Exactly **one** edit→fail→fix→pass cycle occurred.

### Finding 7 — Three of those six children read the same file for overlapping questions

**What happened.** `packages/shared/src/contracts/chat-entry/chat-entry-contract.ts` was independently read
by `agent-ac290f4cc696830fc` (full 7-variant schema), `agent-adef2f040b06c0e76` (its self-test file) and
`agent-a0a4350ddc360380e` (its barrel export line). `chat-stream-process-handle-broker.test.ts` was read by
two of them (`ac290f4c` lines 27-34, `a79f5721` in full).

**Cost.** ~`ctx-in 2,000,000` of duplicated reading across the three, plus three separate round-trips the
parent waited on serially.

**Prompt disposition: PERMITTED.** No rule governs a grandchild fan-out.

### Finding 8 — One child researched a design path that was never used

**What happened.** `agent-a382451a6aeb80795` was asked whether `.array()` method-chaining on a Zod contract
had precedent. It found one (`quest-list-result-contract.ts:15-16`) and recommended it. The final
implementation used a `.find((entry): entry is ChatOutputUserEntry => entry.role === 'user')` type
predicate and never called `.array()` or `.parse()` at all.

**Cost.** `out=1,095 / ctx-in=155,952`, `0.3m` of the child plus 38s of parent wait — entirely discarded.

### Finding 9 — A sub-agent briefed its child with two false premises

**What happened.** `agent-abfedef11259e5533`'s brief to `agent-ac290f4cc696830fc` asserted:
> `the `discover` MCP tool is blocked for you as a sub-agent — you have full tool access including Bash, so you can use plain grep/find/rg directly since you're not under the parent's repo-search restriction`

Both halves are wrong. The child hit three consecutive
`BLOCKED: Native search tools are disabled` errors at `0.1m`, `0.1m` and `0.6m` before pivoting to
`discover` (8 calls). Separately, its brief to `agent-a0a4350ddc360380e` gave a wrong file path
(`packages/shared/src/contracts/chat-output-emit-payload/…`; the file is in `packages/orchestrator/…`),
costing that child two `File does not exist` errors, one failed `ls` (`Exit code 2`) and two blocked
searches — **five failed attempts** — before it self-corrected and reported the parent's error back.

**Cost.** ~8 wasted tool calls across two children; roughly 30–60 seconds of the parent's serial wait.

### Finding 10 — Blocked native-search attempts are endemic across the fan-out

Counted from the `errors` output of each transcript: the operator hit 2 at `45.3m`; and at minimum
`a31d97da` 1 (`13.8m`), `aa4973b1` 1 (`0.1m`), `a949d012` 1 (`0.4m`), `a33f417b` 1 (`4.5m`) plus one
`Permission to use Read has been denied` and one `Permission to use Bash has been denied`, `ac290f4c` 3,
`a79f5721` 1, `adef2f04` 1 (`1.5m`), `a0a4350d` 2, `a382451a` 1, `a97b66b6` 4, `a32f6fad` 1 (`0.7m`) —
**at least 20 blocked native-search attempts across the 18 sub-agents**, every one of them followed by a
correct fallback to `discover` or `python3`. Every agent pays this tax once or more.

**Prompt disposition: the `<dungeonmaster-discover>` session snippet already says this.** The snippet is
injected into every sub-agent (it is visible in this analysis session's own context). Agents read it and
still reach for `grep` first.

### Finding 11 — Three sibling agents rediscovered the same file layout independently

`agent-ab3ab63d4816335b3` (history-replay), `agent-a33f417b97445b6e6` (stream-process-handle) and
`agent-aef5f7dbf9161f789` (jsonl-watcher) received briefs that are near-identical in shape — same import,
same one-line construction change, same proxy `setPort` staging, same one added test. Their costs diverged
sharply:

| Agent | Wall | Turns | Output | ctx-in | Reads | discover |
|---|---|---|---|---|---|---|
| ab3ab63d (history-replay) | 4.5m | 45 | 24,587 | 6,970,109 | 9 | 5 |
| a33f417b (stream-handle) | 12.3m | 112 | 66,086 | 19,763,908 | 24 | 12 |
| aef5f7db (jsonl-watcher) | 6.4m | 64 | 27,962 | 10,470,994 | 15 | 9 |

`aef5f7db` additionally hit `5.1m Error: EISDIR: illegal operation on a directory, read '…/brokers/quest/monitor-watcher-start'`
— it had the wrong mental model of the broker's folder shape and had to re-orient. Nothing carried
`ab3ab63d`'s hard-won layout knowledge to its two siblings; each paid full price.

**Cost.** Roughly `13M` of context-in and `50K` of output above the cheapest sibling's cost, for the same
shape of change three times.

### Finding 12 — The reviewer edited the artifact it was reviewing

**What happened.** `agent-a32f6fad31c4ce7ce` made one `Edit` at `3.8m` to
`chat-stream-process-handle-broker.test.ts` — a file `agent-a33f417b97445b6e6` had authored — replacing
`const userEntry = entry as EmittedUserChatEntry;` with
`.find((entry): entry is EmittedUserChatEntry => entry.role === 'user')`, per its own report
"unlike its sibling test in `chat-replay-responder.test.ts`". It folded the change into the same commit
without reporting it as a `rework`.

**Prompt disposition: PERMITTED.** `[FIX] Fix what is small and clearly yours. Hand up the rest.` This
is a legitimate use. It is listed here because it reveals that `a33f417b` shipped an `as` cast its own
brief's `TRAPS` had banned, and only the last reader in the chain caught it. Had the reviewer been less
thorough, an unsafe cast would have landed.

**A note on attribution.** The reviewer's own report claims the `eslint-plugin` fix as part of what it
reviewed. Its `Edit` count is 1 and its only contact with that file was read-only `git diff HEAD` at
`0.6m`/`2.1m` — the fix was already sitting uncommitted from `agent-a31d97da77c633655`. The reviewer
verified and swept it into `022d408cb`; it did not author it.

---

## 6. Suggested fixes

Ranked by estimated wall-clock or token saving.

### Fix 1 — Make the operator enforce its own group boundaries at dispatch (≈16–18 min/item)

**File:** `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, step 4.

The current text (`**Every change in ONE group goes out in a SINGLE message**`) states the rule but gives
the agent no forcing function; it was overridden by an ordering intuition invented at dispatch time.
Add immediately after it:

```
**Before you send a group, count its lines and count your `Agent` calls. They must match.** A group of
three lines is three `Agent` calls in one message, never two, never one carrying two changes. If you
believe two lines in a group must land in order, the group was wrong — go back and split it on your MAP,
in writing, before you dispatch. Serialising at dispatch time costs a whole extra wave and leaves no
record of why.
```

**Evidence:** map `GROUP 3` (three lines, header "two agents") dispatched as `16.0m` (1 change) then
`22.1m` (2 changes bundled), costing `1571s` where one wave would have cost ~500–600s.
**Estimated saving: 16–18 min per item with a multi-change group.**

### Fix 2 — Give sub-agents a rule for repo tooling that blocks a briefed change (≈12 min/occurrence)

**File:** `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, the
`Briefing a sub-agent` template's `TRAPS` boilerplate (the same place the two `[GIT FORMS]` refusals
already live).

Add a third standing trap line the operator pastes into every brief:

```
  - If a pre-edit-lint hook or an eslint rule refuses the EXACT code this brief prescribes, do not fix
    the rule and do not suppress it. Try the alternatives the brief allows, then stop and return
    `NEXT: rework — <the rule, the file, the exact refusal text, and the one-line repair it needs>`.
    A tooling repair is its own change and gets its own wave.
```

**Evidence:** `agent-a31d97da77c633655` at `1.4m` hit
`Line 54:19 - Raw string type is not allowed`, and spent `3.7m → 15.7m` (12.0 min) plus a `20.0–20.3m`
ward run fixing `packages/eslint-plugin` inside a wave that blocked the operator for 20.9 min. The fix was
correct; the wave was the wrong container for it. Returning `rework` would have let the operator dispatch
the tooling repair **in parallel** with the remaining group-3 work.
**Estimated saving: ~12 min per occurrence.** Occurrences are not rare — `ban-primitives` also blocked
`a949d012` (`1.0m`) and `a31d97da`'s scratch file twice more (`9.0m`, `9.2m`).

### Fix 3 — Cap grandchild fan-out and require it to be parallel (≈11 min/occurrence)

**File:** `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, the
`Briefing a sub-agent` template. Add to the standing `TRAPS` boilerplate:

```
  - You may start helper agents to READ, never to write. Send every one you need in ONE message so they
    run together, and never more than three. A helper you dispatch after reading the last one's answer is
    a helper you waited for twice.
```

**Evidence:** `agent-abfedef11259e5533` dispatched six children serially and spent
`66+38+242+167+38+146 = 697s = 11.6 min` (54% of its life) idle behind them, to prove two observables in
two files. Three of the six read `chat-entry-contract.ts` for overlapping questions (finding 7); one
researched an approach never used (finding 8). A single parallel wave of three would have cost ~4 min.
**Estimated saving: ~11 min per occurrence, plus ~2M ctx-in of duplicated reading.**

### Fix 4 — Wire `codeweaverScopeBlockTransformer` into the prompt renderer (≈4–6 min/item)

**File:** `packages/orchestrator/src/transformers/work-item-to-prompt/work-item-to-prompt-transformer.ts`.

The transformer is fully built and tested (19 assertions in its colocated test) and is imported by nothing
but that test. Add a `codeweaver` branch alongside the existing `siegemaster` / `warpgate` / `spiritmender`
ones:

```ts
if (workItem.role === 'codeweaver') {
  parts.push(...codeweaverScopeBlockTransformer({ quest, operationItem: linkedOperation }));
}
```

The transformer's own header already justifies its budget (`Rendering the scope inline measured 43,660
characters … Two tool results are two separate budgets`) — the seams + shared-homes block is a few hundred
characters, not the whole scope, so it does not reopen the spill risk. This prompt rendered at
`33,717 chars` against a 50,000 ceiling; there is 16KB of headroom.

**Evidence:** the rendered `## Operation Context` is four lines; `Seams`, `Shared homes`, `shared-home` and
`library-kind` each return **0 hits** in the 33,717-char prompt. This cell tags two glue nodes
(`#replay-user-line {server, orchestrator}`, `#deliver-entry {orchestrator, server, web}`) and the block
would have said, per node, that the sibling cells had not run. Phase 2 (`0.6m–6.7m`) re-derived exactly
that conclusion by hand and wrote it into map lines 23–26.
**Estimated saving: 4–6 min of opus exploration per codeweaver item** on any cell with a seam — which is
most of them.

### Fix 5 — Return `packagesAffected` from a tool the agent already calls (≈0.5 min/item, removes 2 refusals)

**File:** the `get-quest` MCP responder in `packages/mcp` (the render already prints
`Packages affected (whole quest): web (edit, frontend-react), server (edit, http-backend), …` — it just
prints it as prose, not as a payload the agent can echo back).

Either (a) have `modify-quest` accept an additive `packagesAffectedAdd: [...]` alongside the
replace-whole form, or (b) state in the codeweaver prompt's step 3 that the exact array is on the
`Packages affected (whole quest):` line of the `get-quest` render, so no disk hunt is needed.

**Evidence:** phase 13 (`45.1m–45.8m`) — two refusals
(`This Bash command contains multiple operations… require approval`, `BLOCKED: Native search tools are
disabled`) and four tool calls to locate and read `quest.json` purely to satisfy
`**It is REPLACED WHOLE on write.** Send back every entry already there plus your new one`.
**Estimated saving: ~0.5 min and 4 tool calls per item that touches `packagesAffected`.**

### Fix 6 — Stop the operator loading two standards docs it cannot act on (≈19k tokens/item)

**File:** `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, step 2.

Change:
> `Load the repo's standards before you read anything else: `get-architecture`, `get-syntax-rules` and `get-testing-patterns`.`

to:
```
Load `get-architecture` before you read anything else — it is how you know where a new file goes.
`get-syntax-rules` and `get-testing-patterns` are about how code is TYPED, and you type none: leave
them to the sub-agents, whose briefs already say `READ FIRST`.
```

**Evidence:** the operator fetched `get-syntax-rules` (`24,528 bytes`) and `get-testing-patterns`
(`51,401 bytes`) at `0.5m` — `75,929 bytes` ≈ 19k tokens — and then, per its own prompt, never wrote a line
of code. The `subagents` roster shows `get-syntax-rules` fetched by 8 sub-agents and
`get-testing-patterns` by 7, so the content reaches the sessions that need it regardless.
**Estimated saving: ~19k tokens of context-in per codeweaver item**, and one fewer thing between the
prompt and the first `discover`.

### Fix 7 — Add a "do not resubmit a refusal unchanged" line (≈1.5 min/occurrence)

**File:** `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, `[WALL]`.

`[WALL]` currently says a denied command is `only a wall when the JOB has no other route. … Swap the tool
first.` It says nothing about a *deterministic* refusal on an edit. Add:

```
A hook refusal on an EDIT is deterministic. The same bytes come back refused every time. Change the code
or change your approach before you submit again — a second identical submission buys nothing but a second
refusal.
```

**Evidence:** `agent-a31d97da77c633655` submitted the identical signature edit at `1.2m` (blocked `1.4m`)
and again at `2.0m` (blocked `2.8m`, byte-identical `Line 54:19` error).
**Estimated saving: ~1.5 min per occurrence.**

### Fix 8 — Correct the false premise operators paste into explorer briefs

**File:** `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, step 2's
`**Dispatch explorer sub-agents where the package is too large to read yourself.**` paragraph.

Add one sentence:
```
A helper inherits every hook you are under. It cannot use `grep`, `find` or `rg` either — tell it to use
`discover` and `Read`, and give it a path only if you have verified the path.
```

**Evidence:** `agent-abfedef11259e5533`'s brief to `agent-ac290f4cc696830fc` claimed
`the `discover` MCP tool is blocked for you as a sub-agent … you can use plain grep/find/rg directly since
you're not under the parent's repo-search restriction`. The child hit three
`BLOCKED: Native search tools are disabled` errors before pivoting. A second brief handed
`agent-a0a4350ddc360380e` a path in the wrong package, costing five failed attempts.
**Estimated saving: ~8 wasted tool calls per fan-out, plus the serial waits behind them.**

### Fix 9 — Let sibling waves share layout findings (≈13M ctx-in/item)

**File:** `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, step 4.

Where a group's changes are the same shape applied to N sites, the operator should brief the first one,
read its return, and paste the layout facts into the other N-1 briefs. Add after
`**Every change in ONE group goes out in a SINGLE message**`:

```
**Where a group is the SAME change at several sites, put what the sites have in common into every brief.**
The proxy shape, the mock's staging requirement, the folder layout — you already know them from your map.
An agent that has to rediscover them pays for the discovery once per site.
```

**Evidence:** three brokers, near-identical briefs, costs `4.5m/45 turns/6.97M` vs `12.3m/112/19.76M` vs
`6.4m/64/10.47M`, with `aef5f7db` hitting `EISDIR … read '…/brokers/quest/monitor-watcher-start'` at `5.1m`
from a wrong folder-shape assumption.
**Estimated saving: ~13M ctx-in and ~50K output tokens per multi-site group.**

---

## 7. Raw figures appendix

### `python3 tmp/transcript-digest.py summary bd7e40a1-9281-4cb5-95a2-613b86bd3ef5`

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/bd7e40a1-9281-4cb5-95a2-613b86bd3ef5.jsonl
LINES     477
START     2026-09-01T20:14:52.553000+00:00
END       2026-09-01T21:43:18.442000+00:00
WALL      1:28:25.889000  (88.4 min)
TYPES     {'queue-operation': 24, 'attachment': 155, 'user': 80, 'last-prompt': 33, 'atis-latch': 32, 'assistant': 153}
MODELS    {'claude-opus-5': 153}

TOKENS (this transcript only, excludes subagents)
  assistant API responses : 153
  input (uncached)        : 306
  cache_read              : 38,126,486
  cache_creation          : 749,039
  output                  : 168,191
  of which thinking       : 85,852
  TOTAL context-in        : 38,875,831

TOOL CALLS (69 total)
     19  Read
     15  Bash
     10  mcp__dungeonmaster__discover
     10  Agent
      6  mcp__dungeonmaster__modify-quest
      2  ToolSearch
      1  mcp__dungeonmaster__get-agent-prompt
      1  mcp__dungeonmaster__get-quest
      1  mcp__dungeonmaster__get-architecture
      1  mcp__dungeonmaster__get-syntax-rules
      1  mcp__dungeonmaster__get-testing-patterns
      1  Write
      1  mcp__dungeonmaster__signal-back

TOOL RESULT BYTES fed back: 430,398

SUBAGENTS 18  (run `subagents` subcommand for the roster)
```

### `python3 tmp/transcript-digest.py subagents bd7e40a1-9281-4cb5-95a2-613b86bd3ef5`

```
09-01 20:22:21  +   1.3m  agent-a5d49c9cbb0542e12  general-purpose/sonnet  turns= 18 out=4,200 ctx-in=652,326
           desc: Add shared image serve route key
           tools: {'ToolSearch': 1, 'Read': 2, 'Edit': 4, 'Bash': 4}
09-01 20:22:38  +   2.6m  agent-aa4973b1fc659ce10  general-purpose/sonnet  turns= 38 out=6,785 ctx-in=3,829,464
           desc: Add chat entry content contract
           tools: {'Bash': 11, 'ToolSearch': 1, 'Read': 4, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Write': 3}
09-01 20:25:51  +   4.1m  agent-a949d012d4547b094  general-purpose/sonnet  turns= 58 out=20,260 ctx-in=7,095,756
           desc: Build image path to url transformer
           tools: {'ToolSearch': 2, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 8, 'mcp__dungeonmaster__discover': 10, 'Bash': 6, 'Write': 4, 'Edit': 1}
09-01 20:30:50  +   5.5m  agent-aa62ec49f7f1a348d  general-purpose/sonnet  turns= 34 out=14,671 ctx-in=3,942,583
           desc: Rewrite image paths in user parse
           tools: {'ToolSearch': 1, 'Read': 5, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Agent': 1, 'Edit': 5, 'Bash': 4}
09-01 20:31:14  +   0.4m  agent-aa482853400244900  general-purpose/None  turns=  5 out=2,463 ctx-in=153,913
           desc: Locate pastedImageStatics definition
           tools: {'Bash': 1, 'Read': 1}
09-01 20:36:57  +  20.8m  agent-a31d97da77c633655  general-purpose/sonnet  turns=147 out=104,610 ctx-in=33,854,130
           desc: Thread serverBaseUrl through line funnel
           tools: {'ToolSearch': 3, 'Read': 19, 'Agent': 1, 'mcp__dungeonmaster__discover': 18, 'Edit': 15, 'Bash': 19, 'Write': 4, 'mcp__dungeonmaster__get-syntax-rules': 1}
09-01 20:37:18  +   0.9m  agent-a7edb510690a9b4c0  Explore/haiku  turns= 32 out=3,817 ctx-in=1,516,657
           desc: Find stream line stub and image transformer defs
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 4, 'Read': 5, 'Bash': 6}
09-01 20:59:13  +   4.5m  agent-ab3ab63d4816335b3  general-purpose/sonnet  turns= 45 out=24,587 ctx-in=6,970,109
           desc: Wire base url into history replay
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 9, 'mcp__dungeonmaster__discover': 5, 'Edit': 7, 'Bash': 2}
09-01 20:59:35  +  12.3m  agent-a33f417b97445b6e6  general-purpose/sonnet  turns=112 out=66,086 ctx-in=19,763,908
           desc: Wire base url into stream handle
           tools: {'ToolSearch': 2, 'Read': 24, 'Bash': 9, 'mcp__dungeonmaster__discover': 12, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Edit': 13}
09-01 20:59:59  +   6.4m  agent-aef5f7dbf9161f789  general-purpose/sonnet  turns= 64 out=27,962 ctx-in=10,470,994
           desc: Wire base url into jsonl watcher
           tools: {'ToolSearch': 2, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'Read': 15, 'mcp__dungeonmaster__discover': 9, 'Edit': 7, 'Bash': 1}
09-01 21:12:22  +  21.5m  agent-abfedef11259e5533  general-purpose/sonnet  turns= 67 out=77,409 ctx-in=11,942,285
           desc: Prove chat output payload carries urls
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 10, 'Agent': 6, 'Edit': 6, 'Bash': 7}
09-01 21:12:49  +   0.9m  agent-ac290f4cc696830fc  Explore/None  turns= 24 out=2,692 ctx-in=768,811
           desc: Find ChatEntry narrowing pattern in tests
           tools: {'Bash': 3, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 8, 'Read': 2}
09-01 21:14:17  +   0.3m  agent-a79f57219d028e74c  Explore/None  turns=  5 out=1,466 ctx-in=154,243
           desc: Find pasted-image test in stream-process-handle test
           tools: {'Bash': 1, 'Read': 1}
09-01 21:18:47  +   3.2m  agent-adef2f040b06c0e76  Explore/None  turns= 27 out=16,748 ctx-in=1,446,791
           desc: Find payload.entries typed-narrowing patterns in orchestrator tests
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 13, 'Bash': 2, 'Read': 2}
09-01 21:22:54  +   0.8m  agent-a0a4350ddc360380e  Explore/None  turns= 25 out=3,983 ctx-in=1,411,182
           desc: Inspect chat-output-emit-payload-contract shape
           tools: {'Read': 5, 'Bash': 7, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 4}
09-01 21:25:45  +   0.3m  agent-a382451a6aeb80795  Explore/None  turns=  8 out=1,095 ctx-in=155,952
           desc: Check zod .array() method usage precedent
           tools: {'Bash': 2, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 1}
09-01 21:26:30  +   1.2m  agent-a97b66b668a059038  Explore/None  turns= 23 out=6,106 ctx-in=1,874,472
           desc: Inspect chat-line-process-transformer user handling
           tools: {'Read': 5, 'Bash': 5, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 4}
09-01 21:34:58  +   7.1m  agent-a32f6fad31c4ce7ce  general-purpose/sonnet  turns= 92 out=24,937 ctx-in=14,896,035
           desc: Review orchestrator transcript images cell
           tools: {'ToolSearch': 3, 'mcp__dungeonmaster__get-agent-prompt': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__get-quest': 1, 'Bash': 29, 'mcp__dungeonmaster__discover': 8, 'Read': 12, 'Edit': 1}

SUBAGENT TOTALS  agents=18 turns=824 output=409,877 context-in=120,899,611
```

### `agent-a31d97da77c633655` — `buckets --minutes 2` (the 20.9-minute stall)

```
WINDOW              APIs  CALLS   OUT-TOK    CTX-IN-TOK  RESULT-BYTES  TOP TOOLS
09-01 20:36-20:38    29     18     5,914     3,374,488           832  Readx8, Editx6, ToolSearchx2, Agentx1
09-01 20:38-20:40    10      6    11,388     1,641,008           832  mcp__dungeonmaster__discoverx5, Editx1
09-01 20:40-20:42    18     10     9,681     3,539,137             0  mcp__dungeonmaster__discoverx7, Readx3
09-01 20:42-20:44     7      4     6,982     1,531,834             0  Readx3, mcp__dungeonmaster__discoverx1
09-01 20:44-20:46    14      7    17,581     3,302,238         1,769  Writex3, mcp__dungeonmaster__discoverx2, Bashx2
09-01 20:46-20:48     5      3    12,419     1,245,905             0  Bashx1, ToolSearchx1, mcp__dungeonmaster__get-syntax-rulesx1
09-01 20:48-20:50    13      7    20,480     3,593,363           816  Readx4, mcp__dungeonmaster__discoverx2, Bashx1
09-01 20:50-20:52    16      8     6,672     4,701,406             0  Editx4, Bashx3, Writex1
09-01 20:52-20:54    12      6     4,951     3,611,960             0  Editx4, Bashx2
09-01 20:54-20:56    15      7     5,313     4,710,440             0  Bashx7
09-01 20:56-20:58     8      4     3,229     2,602,351             0  Bashx3, Readx1
```

### `agent-abfedef11259e5533` — `buckets --minutes 2` (the 21.6-minute stall)

```
WINDOW              APIs  CALLS   OUT-TOK    CTX-IN-TOK  RESULT-BYTES  TOP TOOLS
21:12-21:14    19     11     5,052     1,743,344             0  Readx5, Agentx2, ToolSearchx1, get-architecturex1
21:14-21:16     6      3     5,257       919,138             0  Readx3
21:18-21:20     2      1    15,599       327,340             0  Agentx1
21:20-21:22     0      0         0             0             0  
21:22-21:24     2      1     5,025       363,632             0  Agentx1
21:24-21:26     2      1    12,010       375,582             0  Agentx1
21:26-21:28     2      1     2,605       400,072             0  Agentx1
21:28-21:30     6      3    10,164     1,251,216         1,111  Editx3
21:30-21:32    13      6    11,656     2,933,103         3,081  Bashx4, Editx2
21:32-21:34    15      6    10,041     3,628,858             0  Bashx3, Readx2, Editx1
```

### The commit this work item produced

```
022d408cb 2026-09-01 14:41:50 -0700 codeweaver-reviewer: orchestrator's half of render-images-in-transcript — image-path-to-url transformer, threaded serverBaseUrl, ban-primitives default-param fix
 29 files changed, 965 insertions(+), 17 deletions(-)
```

The immediately preceding commit is `f48bbc660` (work item [3]'s reviewer commit) — confirming **one
reviewer pass and zero rework rounds** for this item.

### Sign-off state (read from `quest.json`)

All 12 observables on this cell's three nodes carry
`codeweaverSignoff.verdict: 'confirmed'`, `workItemId: 0bd22bc6…`:
`#replay-user-line` → `check-user-line-yields-one-entry`;
`#rewrite-paths-to-urls` → `check-path-becomes-query-url`, `check-non-image-link-untouched`,
`check-rewrite-applies-to-session-without-quest`, `check-space-encoded`, `check-ampersand-encoded`,
`check-hash-encoded`, `check-question-mark-encoded`, `check-percent-encoded`, `check-plus-encoded`,
`check-non-ascii-encoded`; `#deliver-entry` → `check-payload-carries-http-url`.
Zero `unconfirmable`, zero unsigned.

### Provenance of every number above

| Figure | Command |
|---|---|
| Wall clock, token totals, tool histogram, result bytes | `summary bd7e40a1-…` (pasted above) |
| Sub-agent roster, per-agent turns/output/ctx-in/tools | `subagents bd7e40a1-…` (pasted above) |
| 5-min main-session buckets | `buckets bd7e40a1-… --minutes 5` (§2) |
| Per-phase elapsed, gaps, quoted agent speech | `timeline bd7e40a1-… --max-chars 320` |
| Blocked/denied Bash results | `result bd7e40a1-… "^Bash$" --max-chars 500`, filtered to 43–45m |
| Rendered prompt and its `## Operation Context` | `result bd7e40a1-… get-agent-prompt --max-chars 40000` |
| Dispatch briefs, verbatim | direct `json.loads` walk of the session `.jsonl`, filtering `tool_use` where `name == "Agent"` |
| Per-agent `cache_read` / `cache_creation` split | direct `json.loads` walk of each `subagents/*.jsonl`, summing `message.usage` on `type == "assistant"` |
| `codeweaverScopeBlockTransformer` usage count | `python3` `os.walk` over `packages/` counting the symbol |
| Work item, operation item, `packagesAffected`, observables, quest note | `python3` `json.load` of the quest file |
| Commit SHA, stat, log ordering | `git show --stat` / `git log` in the worktree |
| `agent-a31d97da77c633655` and `agent-abfedef11259e5533` internals | `buckets` / `timeline` / `errors` / `text` / `prompts` on each agent id with `--parent bd7e40a1-…` |

**One correction made during this analysis.** A deep-dive sub-agent reported that
`agent-a31d97da77c633655` "never emits a `NEXT:` line at all". Verified against the transcript with
`grep agent-a31d97da77c633655 "NEXT:" --parent bd7e40a1-…`, which returns
`--- 20.8m assistant --- … NEXT: pass`. The claim was wrong; §3.1 states the corrected fact.

# Work item 03 — codeweaver — orchestrator / send-message-with-images

## 0. Identity

| Field | Value |
|---|---|
| Work item id | `59f457a9-8c1e-4b10-aabd-28aa238e4c67` |
| Operation item id | `6cc646e2-d81a-4887-907d-8037147f47a3` |
| Session id | `751a242b-3691-4aa0-9469-31cbe019d784` |
| Role | codeweaver |
| Model | `claude-opus-5` (126/126 assistant records; `roleToModelStatics.codeweaver = 'opus'`) |
| Operation text | `Codeweaver: build this slice — package: orchestrator · flow: send-message-with-images` |
| flowIds / packageNames | `['send-message-with-images']` / `['orchestrator']` |
| dependsOn | not carried in the rendered prompt or the work-item index; the ledger predecessor is item `[2]` codeweaver `shared · send-message-with-images` (session `b3d97d99-…`), which committed `bebca45c3` at 19:32:52Z — 41 seconds before this session's first record |
| Status | `complete`, signalled `operationStatus: 'done'` |

**Window.** Ledger: `2026-09-01T19:33:20.935Z -> 2026-09-01T20:14:38.783Z` = **41.30 min**.
Transcript: `2026-09-01T19:33:33.123Z -> 2026-09-01T20:14:51.925Z` = **41.3 min** (`0:41:18.802`). The
ledger window opens 12.2 s before the first transcript record and closes 13.1 s before the last one.

**Sub-agents: 16.** Seven depth-1 builders and one depth-1 reviewer, all `general-purpose` dispatched
with `model: "sonnet"` (meta `model: sonnet`); eight depth-2 lookup agents spawned by the builders,
whose meta records `model: None` (one of them carries `agentType: Explore`, the rest
`general-purpose`). Per-agent depth and model:

```
start        el    dur depth agent                model    turns      out  thinking      in   cache_read cache_creation
19:39:33    6.0    4.3     1 agent-a60df5389c57c49fe sonnet      41   18,885    11,777      82    3,948,362        395,201
19:39:49    6.3    3.5     1 agent-a663d057f395a7bc9 sonnet      36   14,613     8,222      72    3,725,565        372,124
19:40:17    6.7    1.3     2 agent-a95c7635d27ad80ff None        27    6,519     2,320      54    1,019,293        149,806
19:44:25   10.9    7.5     1 agent-a94191fdacdae4717 sonnet      79   23,012     9,494     158   10,320,050        570,222
19:52:43   19.2   12.1     1 agent-ab2a819ad007dcef5 sonnet      63   33,923    22,957     126    9,419,996        538,380
19:53:00   19.5    0.3     2 agent-a7a7b3c1853511570 None         6    1,033         0      12      157,700         44,480
19:53:02   19.5    6.0     1 agent-a29d7c24ce877685c sonnet      54   25,210    17,571     108    7,512,377        515,980
19:53:29   19.9    9.0     1 agent-acccbfc93e8e66fdd sonnet      56   25,813    14,816     112    7,636,308        386,125
19:53:33   20.0    0.7     2 agent-acc361dca69bac3b4 None        15    3,176       729      30      531,139        186,916
19:53:55   20.4    0.3     2 agent-a26dbe0f7ddcf23f2 None         8      970        58      16      213,642         46,839
19:54:38   21.1    2.7     2 agent-a4b63f5b3cf004acb None        42   13,680     8,027      84    4,638,765        387,182
19:54:46   21.2    1.3     2 agent-a5e929e0b41fee146 None        24    5,247     2,318      48    1,059,364        207,087
19:57:11   23.6    0.5     2 agent-ae0a85580a52a9cf0 None        13      976       142      26      373,824        180,129
19:58:19   24.8    0.3     2 agent-ac448235152fa6075 None         8    1,068       312      16      432,386        149,868
20:05:59   32.4    1.8     1 agent-ac8f8759f2167ab9a sonnet      30    6,452     2,323      60    3,434,291        494,684
20:08:10   34.6    6.1     1 agent-a2cdff0296b0a4f41 sonnet      75   24,457    15,771     150   10,197,149        542,336
```

**Parent → child map** (from `Agent` tool_use `description` args in each transcript):

```
751a242b (codeweaver)
 ├─ a60df5389c57c49fe  Build image prompt trailer transformer
 ├─ a663d057f395a7bc9  Prove argv carries image path
 │    └─ a95c7635d27ad80ff  Find quest images dir statics key
 ├─ a94191fdacdae4717  Wire trailer into chat prompt builder
 ├─ ab2a819ad007dcef5  Prove new-quest first message argv
 │    ├─ a7a7b3c1853511570  Find pastedImageStatics definition
 │    ├─ acc361dca69bac3b4  Find getSpawnedArgs usage patterns in tests
 │    └─ a4b63f5b3cf004acb  Find TS pattern for indexing unknown spawned args
 ├─ a29d7c24ce877685c  Prove followup message carries path
 ├─ acccbfc93e8e66fdd  Prove responder sees absolute path
 │    ├─ a26dbe0f7ddcf23f2  Locate pastedImageStatics export
 │    ├─ a5e929e0b41fee146  Find getSpawnedArgs usage pattern in tests
 │    ├─ ae0a85580a52a9cf0  Check indexed getSpawnedArgs reads in sibling tests
 │    └─ ac448235152fa6075  Get ChatStartResponder return type shape
 ├─ ac8f8759f2167ab9a  Replace as-never argv narrowing
 └─ a2cdff0296b0a4f41  Review the codeweaver pass
```

**What the item produced.** One commit, `f48bbc660`, authored by the reviewer:
`11 files changed, 425 insertions(+), 5 deletions(-)`.

---

## 1. Chronological breakdown — where the time went

Elapsed is minutes from the transcript's first record (19:33:33.123Z). "Waiting" rows are turns the
codeweaver deliberately ended with no tool call, per the prompt's `[HELPERS]` rule — a live sub-agent
was out in every one of them, so none is idle-through-inattention.

| # | Clock (UTC) | Elapsed | Min | What happened | Evidence |
|---|---|---|---|---|---|
| 1 | 19:33:33–19:33:53 | 0.0–0.3 | 0.3 | Fetched its own prompt, then the flow slice | `0.1m CALL ToolSearch(query=select:mcp__dungeonmaster__get-agent-prompt,…)` · `0.3m CALL mcp__dungeonmaster__get-quest(questId=… packageName=orchestrator)` |
| 2 | 19:33:53–19:38:33 | 0.3–5.0 | 4.7 | Standards load + package exploration: 3 standards calls, 2 `git log`, `get-project-map`, 10 `discover`, 13 distinct `Read`s | `0.6m CALL get-architecture / get-syntax-rules / get-testing-patterns` (one message) · `4.9m CALL Read(…chat-start-responder.ts)` |
| 3 | 19:38:33–19:39:09 | 5.0–5.6 | 0.6 | Wrote the map (6,155 bytes, 3 groups + PROVES + TRAPS) | `5.5m CALL Write(file_path=…/.quest-plans/6cc646e2-…-map.md)` |
| 4 | 19:39:09–19:39:57 | 5.6–6.4 | 0.8 | Authored and dispatched **group 1** — two `Agent` calls in ONE API response (identical `OUT 4089 / CTX-IN 237,728`) | `6.0m CALL Agent(description=Build image prompt trailer transformer…)` · `6.3m CALL Agent(description=Prove argv carries image path…)` |
| 5 | 19:39:57–19:40:39 | 6.4–7.1 | 0.7 | Recovered the two labelled-edge **ids** the flow render never printed (two whole-quest `get-quest` calls, second spilled to a file, then a `python3` parse), then two `discover` calls to line up group-3 targets | `6.4m CALL get-quest(questId=…)` args `{format:'json', stage:'planning'}` · `6.7m` args `{format:'json', stage:'spec'}` → `Error: result (135,813 characters across 3,137 lines) exceeds maximum allowed tokens` · `7.0m say: "Edge ids in hand: forward-to-prompt and forward-to-accepted."` |
| 6 | 19:40:39–19:43:22 | 7.1–9.8 | 2.7 | **Waiting** on group 1 (turn ended on a plain message) | `7.1m say: "Group 1 is running… Waiting on the two sub-agents before sending group 2"` |
| 7 | 19:43:22–19:43:41 | 9.8–10.1 | 0.3 | Signed `#check-argv-carries-image-path` from `a663d057f395a7bc9`'s return | `10.0m CALL mcp__dungeonmaster__modify-quest(questId=…)` |
| 8 | 19:43:41–19:43:53 | 10.1–10.3 | 0.2 | **Waiting** on the trailer agent | `10.1m say: "Signed. Waiting on the trailer-transformer agent before group 2 goes out"` |
| 9 | 19:43:53–19:44:27 | 10.3–10.9 | 0.6 | Dispatched **group 2** (one agent, `chat-prompt-build-transformer`) | `10.9m CALL Agent(description=Wire trailer into chat prompt builder…)` |
| 10 | 19:44:27–19:51:51 | 10.9–18.3 | 7.4 | **Waiting** on group 2 — a single-agent wave, so this is a serialised bottleneck | `10.9m say: "Group 2 is out. Group 3 waits on it"` |
| 11 | 19:51:51–19:53:33 | 18.3–20.0 | 1.7 | Signed the two `#build-prompt` observables, then dispatched **group 3** — three `Agent` calls in ONE API response (identical `OUT 9036 / CTX-IN 315,201`) | `18.7m CALL modify-quest` · `19.2m / 19.5m / 19.9m CALL Agent(…)` |
| 12 | 19:53:33–19:59:03 | 20.0–25.5 | 5.5 | **Waiting** on group 3 | `20.0m say: "Group 3's three agents are out. Four of my eight observables are signed."` |
| 13 | 19:59:03–19:59:15 | 25.5–25.7 | 0.2 | Signed `#check-followup-message-carries-path` | `25.7m CALL modify-quest` |
| 14 | 19:59:15–20:02:33 | 25.7–29.0 | 3.3 | **Waiting** | `25.7m say: "Five of eight signed. Two group-3 agents still running"` |
| 15 | 20:02:33–20:02:51 | 29.0–29.3 | 0.3 | Signed `#check-orchestrator-sees-absolute-path` plus both labelled edges `forward-to-prompt` and `forward-to-accepted` | `29.2m CALL modify-quest` |
| 16 | 20:02:51–20:04:51 | 29.3–31.3 | 2.0 | **Waiting** on the last group-3 agent | `29.3m say: "Seven units signed. One agent left"` |
| 17 | 20:04:51–20:06:21 | 31.3–32.8 | 1.5 | Signed `#check-new-quest-first-message`; read the whole diff (`git diff --stat`, `git diff` = 20,297 bytes, `git status --porcelain`); spotted the `as never`; dispatched the fixer; signed the two `unconfirmable` units | `32.0m say: "chat-spawn-broker.test.ts:83 narrows the argv with as never, while the two sibling test files solved the identical unknown problem with a real Array.isArray helper."` · `32.4m CALL Agent(description=Replace as-never argv narrowing…)` |
| 18 | 20:06:21–20:07:51 | 32.8–34.3 | 1.5 | **Waiting** on the fixer | `32.8m say: "Nine of ten units carry a verdict… Waiting on the fixer before I run the reviewer."` |
| 19 | 20:07:51–20:08:15 | 34.3–34.7 | 0.4 | Re-read the fixed file's diff, **re-signed** `#check-new-quest-first-message` because the fix moved its line numbers, dispatched the reviewer alone | `34.3m CALL Bash(git diff …chat-spawn-broker.test.ts)` · `34.5m CALL modify-quest` · `34.6m CALL Agent(description=Review the codeweaver pass…)` |
| 20 | 20:08:15–20:14:23 | 34.7–40.8 | 6.1 | **Waiting** on the reviewer (which builds, wards, commits and pushes) | `34.7m say: "The reviewer is running… Waiting on its NEXT: line and its read-check report."` |
| 21 | 20:14:23–20:14:52 | 40.8–41.3 | 0.5 | Signed the read-check from the reviewer's report, confirmed a clean tree, signalled `done`, wrote its closing report | `40.9m CALL modify-quest` · `41.0m CALL Bash(git status --porcelain)` · `41.1m CALL signal-back(… operationStatus: done)` |

Rows sum: 0.3+4.7+0.6+0.8+0.7+2.7+0.3+0.2+0.6+7.4+1.7+5.5+0.2+3.3+0.3+2.0+1.5+1.5+0.4+6.1+0.5 =
**41.3 min**. ✅

### Time by category

| Category | Minutes | Share | Which rows |
|---|---|---|---|
| Orientation / reading | 5.0 | 12.1% | 1, 2 |
| Planning (writing the map) | 0.6 | 1.5% | 3 |
| Sub-agent dispatch — brief authoring | 3.2 | 7.7% | 4, 9, 11 (dispatch half), 17 (fixer half), 19 (reviewer half) |
| Sub-agent dispatch — **waiting** | 28.7 | 69.5% | 6, 8, 10, 12, 14, 16, 18, 20 |
| Sign-off bookkeeping (`modify-quest` ×8) | 2.3 | 5.6% | 7, 11 (sign half), 13, 15, 17 (sign half), 19 (re-sign) |
| Diff review (step 5) | 0.6 | 1.5% | 17, 19 |
| Scope-metadata recovery (edge ids the render omitted) | 0.7 | 1.7% | 5 |
| Signal + closing report | 0.3 | 0.7% | 21 |
| Verification / ward | **0.0** | 0% | forbidden by `[BUILD]`; the reviewer ran build+ward inside row 20 |
| Idle-or-stall | **0.0** | 0% | every wait row had a live sub-agent |
| **Total** | **41.3** | 100% | |

**The critical path is five sequential waves.** Longest sub-agent per wave:
4.3 (`a60df53`) + 7.5 (`a94191f`) + 12.1 (`ab2a819`) + 1.8 (`ac8f875`) + 6.1 (`a2cdff0`) = **31.8 min
of the 41.3**. Wave 2 was a *single* agent for 7.5 minutes with nothing running beside it.

---

## 2. Chronological token buckets

`python3 tmp/transcript-digest.py buckets 751a242b-3691-4aa0-9469-31cbe019d784 --minutes 3`, verbatim:

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/751a242b-3691-4aa0-9469-31cbe019d784.jsonl
LINES     363
START     2026-09-01T19:33:33.123000+00:00
END       2026-09-01T20:14:51.925000+00:00
WALL      0:41:18.802000  (41.3 min)

BUCKETS of 3 min
WINDOW              APIs  CALLS   OUT-TOK    CTX-IN-TOK  RESULT-BYTES  TOP TOOLS
09-01 19:33-19:36    43     27    36,918     5,797,531       315,509  Readx10, mcp__dungeonmaster__discoverx7, Bashx3, ToolSearchx1
09-01 19:36-19:39    15      8    41,329     3,419,073        14,044  Bashx3, Readx3, mcp__dungeonmaster__discoverx1, Writex1
09-01 19:39-19:42    15      7    16,364     3,761,358        46,891  Agentx2, mcp__dungeonmaster__get-questx2, mcp__dungeonmaster__discoverx2, Bashx1
09-01 19:42-19:45    10      3    11,253     2,948,120         7,209  ToolSearchx1, mcp__dungeonmaster__modify-questx1, Agentx1
09-01 19:51-19:54     7      4    54,258     2,216,855        18,977  Agentx3, mcp__dungeonmaster__modify-questx1
09-01 19:57-20:00     3      1     1,334       982,094            55  mcp__dungeonmaster__modify-questx1
09-01 20:00-20:03     3      1     2,504       989,576            55  mcp__dungeonmaster__modify-questx1
09-01 20:03-20:06    14      6    19,247     4,751,520        27,386  Bashx3, mcp__dungeonmaster__modify-questx2, Agentx1
09-01 20:06-20:09     8      3     3,489     2,810,719         3,649  Bashx1, mcp__dungeonmaster__modify-questx1, Agentx1
09-01 20:12-20:15     8      3     6,011     2,839,282           485  mcp__dungeonmaster__modify-questx1, Bashx1, mcp__dungeonmaster__signal-backx1
```

Buckets `19:45-19:48`, `19:48-19:51`, `19:54-19:57` and `20:09-20:12` are absent because the main
session made no API call in them — those are wait rows 10, 12 and 20.

### Sub-agent spend attributed to the bucket each sub-agent STARTED in

| Bucket | Agents started | Sub OUT-TOK | Sub CTX-IN-TOK | Agent ids |
|---|---|---|---|---|
| 19:39-19:42 | 3 | 40,017 | 9,610,559 | `a60df53` `a663d05` `a95c763` |
| 19:42-19:45 | 1 | 23,012 | 10,890,430 | `a94191f` |
| 19:51-19:54 | 6 | 90,125 | 27,190,286 | `a26dbe0` `a29d7c2` `a7a7b3c` `ab2a819` `acc361d` `acccbfc` |
| 19:54-19:57 | 3 | 19,903 | 6,846,509 | `a4b63f5` `a5e929e` `ae0a855` |
| 19:57-20:00 | 1 | 1,068 | 582,270 | `ac44823` |
| 20:03-20:06 | 1 | 6,452 | 3,929,035 | `ac8f875` |
| 20:06-20:09 | 1 | 24,457 | 10,739,635 | `a2cdff0` |
| **Total** | **16** | **205,034** | **69,788,724** | |

The `19:51-19:57` pair of buckets is where the item's cost lives: **9 of the 16 sub-agents started
inside six minutes**, carrying `27,190,286 + 6,846,509 = 34,036,795` context-in tokens — 48.8% of all
sub-agent context-in, for one wave of three planned briefs plus six unplanned lookups those briefs
spawned on their own.

### Totals, cache_read and cache_creation kept separate

| Layer | input (uncached) | cache_read | cache_creation | **context-in total** | output | of which thinking |
|---|---|---|---|---|---|---|
| Main session (opus) | 252 | 29,588,009 | 927,867 | **30,516,128** | 192,707 | 77,742 |
| Sub-agents, depth 1 (8 sonnet) | 868 | 56,194,098 | 3,815,052 | **60,010,018** | 172,365 | — |
| Sub-agents, depth 2 (8 lookups) | 286 | 8,426,113 | 1,352,307 | **9,778,706** | 32,669 | — |
| **Sub-agents, all 16** | **1,154** | **64,620,211** | **5,167,359** | **69,788,724** | **205,034** | **116,837** |
| **GRAND TOTAL** | **1,406** | **94,208,220** | **6,095,226** | **100,304,852** | **397,741** | **194,579** |

Depth-2 `cache_read` long-hand:
`1,019,293 + 157,700 + 531,139 + 213,642 + 4,638,765 + 1,059,364 + 373,824 + 432,386 = 8,426,113`;
depth-2 `cache_creation`:
`149,806 + 44,480 + 186,916 + 46,839 + 387,182 + 207,087 + 180,129 + 149,868 = 1,352,307`;
depth-2 uncached input: `54 + 12 + 30 + 16 + 84 + 48 + 26 + 16 = 286`
(and `8,426,113 + 1,352,307 + 286 = 9,778,706` ✅).
Depth-1 is the all-16 total minus depth-2: `64,620,211 − 8,426,113 = 56,194,098`,
`5,167,359 − 1,352,307 = 3,815,052`, `1,154 − 286 = 868`.
Depth-1 context-in = 69,788,724 − 9,778,706 = **60,010,018**;
depth-1 output = 205,034 − 32,669 = **172,365**. Depth-2 context-in and output, long-hand:
`1,169,153 + 202,192 + 718,085 + 260,497 + 5,026,031 + 1,266,499 + 553,979 + 582,270 = 9,778,706`
and `6,519 + 1,033 + 3,176 + 970 + 13,680 + 5,247 + 976 + 1,068 = 32,669`.

Grand-total arithmetic: context-in `30,516,128 + 69,788,724 = 100,304,852`; output
`192,707 + 205,034 = 397,741`.

**Unit cost.** 100,304,852 context-in tokens and 397,741 output tokens across 17 sessions produced a
commit of 425 inserted lines — **236,011 context-in tokens per line landed**.

Main-session tool-result bytes, by tool:

```
     86,475  x13  Read
     55,285  x3   mcp__dungeonmaster__get-quest
     51,401  x1   mcp__dungeonmaster__get-testing-patterns
     49,949  x12  Bash
     44,830  x1   mcp__dungeonmaster__get-project-map
     42,757  x8   Agent
     33,704  x1   mcp__dungeonmaster__get-agent-prompt
     24,528  x1   mcp__dungeonmaster__get-syntax-rules
     19,056  x1   mcp__dungeonmaster__get-architecture
     18,485  x10  mcp__dungeonmaster__discover
      6,155  x1   Write
        860  x2   ToolSearch
        440  x8   mcp__dungeonmaster__modify-quest
        335  x1   mcp__dungeonmaster__signal-back
    434,260  TOTAL
```

---

## 3. Was the prompt fit for the work?

### 3.0 The rendered prompt is the static template, byte for byte

`python3 tmp/transcript-digest.py result 751a242b-… get-agent-prompt` returns
`{"name":"codeweaver","model":"opus","prompt": …}` with `prompt` **31,946 characters**. Diffing it
against the template in `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`
(30,882 chars after unescaping) yields exactly **two** hunks — both intended interpolations:

```
@@ -136,5 +136,14 @@
-${spilledToolResultStatics.markdown}
+**A tool result too large to return inline is READ IN FULL — never skimmed, never summarised.**
+ … (9 lines)
@@ -579,3 +588,6 @@
-$ARGUMENTS
+Quest ID: 1be07040-b9ec-476c-a439-0b4fbb0123cd
+Work Item ID: 59f457a9-8c1e-4b10-aabd-28aa238e4c67
+Operation Item ID: 6cc646e2-d81a-4887-907d-8037147f47a3
+Your operation item: [codeweaver] Codeweaver: build this slice — package: orchestrator · flow: send-message-with-images
```

No placeholder rendered empty and no block came out oversized. The template has not changed in the
repo since the run.

### 3.1 The step script matched the work — mostly

**What the prompt asked for, and what happened:**

> **"Load the repo's standards before you read anything else: `get-architecture`, `get-syntax-rules`
> and `get-testing-patterns`."**

Done first, at `0.6m`, all three in one message, before any package file was opened. The map's
`TRAPS` block is a direct product of them ("no toEqual / toMatchObject / toContain…", "No beforeEach
/ afterEach", "No jest.mock / jest.mocked / jest.spyOn — registerMock / registerSpyOn"). This is the
prompt earning its keep.

> **"Read what the cells before you already landed, before you decide anything is missing:
> `git log --oneline -n 20` / `git log --name-only -n 10`"**

Ran at `0.6m` as two separate calls (`-n 20` and `--name-only -n 6`). It surfaced `bebca45c3`
("codeweaver: shared's half of send-message-with-images"), committed 41 seconds before this session
opened, and the codeweaver's very next `Read` at `0.7m` was
`packages/shared/src/statics/pasted-image/pasted-image-statics.ts` — the file that cell had just
landed. Every downstream brief and every test then keyed off `pastedImageStatics.promptSentinel` /
`.promptInstruction` rather than an inlined literal. Without this step the pass would have
re-invented the sentinel and failed its own read-check.

> **"Every change in ONE group goes out in a SINGLE message"** and **"Dispatch with
> `subagent_type: "general-purpose"` and `model: "sonnet"`."**

Both honoured exactly. Group 1's two `Agent` calls at `6.0m`/`6.3m` share `OUT 4089 / CTX-IN 237,728`;
group 3's three at `19.2m`/`19.5m`/`19.9m` share `OUT 9036 / CTX-IN 315,201` — identical usage stamps
mean one API response each. All eight dispatches used `general-purpose` + `sonnet`, and the reviewer
went out alone at `34.6m`.

> The verbatim brief shape (`FILES / DO / MUST BE TRUE / TRAPS / DO NOT TOUCH / READ FIRST / PROVE / RETURN`)

All **7** code briefs carry all **8** headings, and all 7 carry both `[GIT FORMS]` refusals in
`TRAPS` (`git -C` and the `&&`/pipe ban) as the prompt demands. Brief lengths 3,806–7,107 chars.
One deliberate deviation: the template's `PROVE` line reads `npm run ward -- --only lint,test`, and
the codeweaver wrote `--only lint,unit` in 5 of 7 briefs — narrower than the template, and the
better choice, since `test` expands to `unit,integration,e2e`.

The reviewer brief was the prescribed short form, verbatim including the optional line:

```
Call get-agent-prompt({ agent: 'codeweaver-reviewer', questId: '1be07040-b9ec-476c-a439-0b4fbb0123cd' }) FIRST, then follow what it returns exactly.
OPERATION: 6cc646e2-d81a-4887-907d-8037147f47a3
FLOW: send-message-with-images
PACKAGE: orchestrator
READ-CHECKS: check-sentinel-from-shared-statics
```

### 3.2 The scope block was accurate — and the part meant to widen it never ran

The flow slice (`get-quest({ questId, flowId, packageName })`, 22,894 chars at `0.3m`) named exactly
**11 units**: 8 observables across 4 `◀ YOURS` nodes, 1 terminal (`#agent-reads-images`) and 2
labelled edges leaving `#forward-to-orchestrator`. The codeweaver read that off correctly at `0.6m`
— *"My cell has no `## Contracts` heading, so no contracts route to `orchestrator` on this flow.
Eleven units are mine: eight observables, one terminal, two labelled edges."* All 11 ended the
session with a verdict.

But: **`codeweaverScopeBlockTransformer` has no production caller.** A repo-wide scan for the symbol
returns only its own file and its own test:

```
packages/orchestrator/src/transformers/codeweaver-scope-block/codeweaver-scope-block-transformer.test.ts
packages/orchestrator/src/transformers/codeweaver-scope-block/codeweaver-scope-block-transformer.ts
```

`workItemToPromptTransformer` — the one function that builds this prompt — never imports it; its
`parts` array is the four id lines plus role-specific extras for siegemaster, warpgate and
spiritmender only. The rendered Operation Context confirms it: four lines, no `Seams —` block, no
`Shared homes —` block. The transformer's own PURPOSE says it renders *"the two facts about a
codeweaver cell that only the QUEST holds, and no flow slice answers"* — and the codeweaver had to
derive both by hand: it wrote its own seam note into the map (*"Seam: the SERVER writes the image
files and rewrites each `[Pasted Image N]` token … BEFORE it calls this package"*) and it spent a
`get-project-map` call (44,830 bytes, the third-largest result of the session) plus a `Read` of
`pasted-image-statics.ts` working out the shared-home question the block would have answered in one
line. The seam answer it invented was also *incomplete in the way the block would have fixed*: the
block would have printed `NOT BUILT YET` against the server's half, and the codeweaver only worked
that out at `41.3m`, in prose, at the very end (*"The server's own cell has not run yet, so that
rewrite is still owed"*).

### 3.3 Structural defect 1 — the render demands an id it does not print

The prompt requires signing a branch unit **by id**:

> ```
> { id: '<your flow id>',
>   nodes: [ { id: '<the terminal node id>', codeweaverSignoff: { … } } ],
>   edges: [ { id: '<the labelled edge id>',  codeweaverSignoff: { … } } ] }
> ```

The flow render prints edge **labels** and never edge **ids**. Counted against the 0.3m render text:

```
'forward-to-prompt' -> 0
'forward-to-accepted' -> 0
'spawns in the background' -> 1
'answers the HTTP request' -> 1
```

`flowGraphToTextTransformer` (`packages/shared/src/transformers/flow-graph-to-text/…`) emits
`` `${indent}${SYM.indent}${SYM.rightArrow}${labelPart}[#${String(toId)}]${edgeSignoffMarker}` `` —
the *target node* id, never `edge.id`. So the agent had no compliant route to the value the prompt
tells it to write. It took the non-compliant one, twice, against an explicit prohibition in the same
prompt:

> **"`get-quest` takes `flowId` and `packageName`, never `stage`.** `stage: 'spec'` returns the whole
> quest, every flow on it, and that render grows as the quest does — past the tool-result ceiling on
> any quest of real size."

`6.4m get-quest({questId, format:'json', stage:'planning'})` (30,867 bytes into context) and
`6.7m get-quest({questId, format:'json', stage:'spec'})`, which produced precisely the failure the
prompt predicted:

```
Error: result (135,813 characters across 3,137 lines) exceeds maximum allowed tokens. Output has been
saved to …/751a242b-…/tool-results/mcp-dungeonmaster-get-quest-1788291619121.txt.
```

It then parsed the spill with `python3` and narrated the breach as a considered decision at `7.0m`:
*"(I read only that flow's edges out of the spilled dump — it was a whole-quest JSON fetched for two
id values, not my scope render.)"*

### 3.4 Structural defect 2 — step 7 orders a write the tool refuses

> **`pass`** → *"go to step 8, and copy its `FINDINGS:` into your signal — anything it named for
> someone else survives nowhere else"*

`signalBackInputContract` (`packages/mcp/src/contracts/signal-back-input/…`) is `z.object({…}).strict()`
over `questId`, `workItemId`, `signal`, `operationItemId`, `operationStatus`, `blockedReason` — and
its own comment says so: *"There is NO note field — the next-session handoff is the git commit
message, not the ledger."* A `.strict()` schema **rejects** an unknown key, so a codeweaver that
obeyed step 7 literally would get a validation error on its one terminal call. Here it was moot
(`FINDINGS: none`), and the actual `signal-back` payload at `41.1m` carries only the five legal
fields. The instruction is unfulfillable as written.

The same gap swallowed the one genuinely useful thing this session found for somebody else. At
`41.3m`:

> *"**No contracts route to this cell.** The flow render showed no `## Contracts` heading. One
> contract property does name an orchestrator file — `imagePathToUrl` at
> `transformers/image-path-to-url/` — but its node sits on `render-images-in-transcript`, which has
> its own orchestrator operation item (`8857ed98`). That session gets it, not this one."*

That is a cross-cell routing observation written into a terminal transcript nobody reads. It is not
in `quest.json`, not in `f48bbc660`'s body (the reviewer wrote that, and it says `FINDINGS: none`),
and not in the signal.

### 3.5 The `[BUILD]` ban reaches the operator but not the sub-agents

The `[BUILD]` rule binds the codeweaver session, and the codeweaver honoured it perfectly: **zero**
build, ward or test calls in 41 minutes. But the rule lives in the *operator's* prompt, and a
code-writing sub-agent gets no prompt at all — only the brief. The brief template carries the ban as
four words at the end of a `PROVE` block:

```
PROVE
  npm run ward -- --only lint,test -- <this brief's own paths>
  no npm run build · no run-ward MCP tool · no commit · never widen the ward
```

All 7 briefs carried that line verbatim. **5 of 7 builders ran `npm run build` anyway, 9 times
between them** (section 5, finding 1). Meanwhile the session-start `<dungeonmaster-wardDiscipline>`
snippet every sub-agent receives opens with *"**Build first, unpiped.** … Run `npm run build` as its
OWN command and confirm it exits 0"* — and nothing in a sub-agent's context overrides it, because
the sentence that does the overriding (*"This rule overrides the `<dungeonmaster-ward>` and
`<dungeonmaster-wardDiscipline>` snippets"*) appears only in the codeweaver's and the reviewer's
prompts, which the sub-agent never sees. The sub-agents obeyed the snippet they were handed over the
one line in a brief that contradicted it.

### 3.6 The template's own `PROVE` command is wrong for a `.test.ts` file

The template hard-codes `--only lint,test`. `test` is the alias for `unit,integration,e2e`, so on a
brief whose only path is a `*.test.ts`, ward's integration check has nothing to do. Agent 2 hit it
head-on at its `1.2m`:

> `integration: DISCOVERY MISMATCH` — *"ward discovered files that were not processed (or vice
> versa)… This run is FAILING until each mismatch below is investigated"*

It recovered correctly in one turn (*"Per the ward-discipline rule, I narrow rather than widen"* →
`--only lint,unit`), at ~0.6 min. Agent 1's `lint,test` run happened not to mismatch — integration
ran and passed on 36 discovered files, i.e. it graded 36 files that had nothing to do with the
brief. The codeweaver had already noticed and written `--only lint,unit` into 5 of its 7 briefs; the
template it copied from still says `lint,test`.

### 3.7 What the prompt did not warn about, and the agents had to invent

- **No brief-template line forbids a code-writing sub-agent from spawning its own helpers.** The
  `TRAPS` and `DO NOT TOUCH` slots exist; neither the template nor the surrounding prose mentions
  grandchildren. Three of the seven builders spawned eight of them, at 9,778,706 context-in tokens
  (section 5, finding 2).
- **Nothing tells a builder how to narrow a proxy getter typed `(): unknown`, and a lint rule blocks
  the obvious answer.** Agent `ab2a819ad007dcef5` tried to annotate the cast and was refused by the
  pre-edit hook at its `6.6m`: *"❌ Code Quality Issue: 3 violations … Line 85:56/64/75 - Raw string
  type is not allowed. Use the discover endpoint to search for existing contracts…"* — the
  `@dungeonmaster/ban-primitives` rule rejecting `as string[]`. Fifty seconds later it wrote
  `as never` instead, which the rule does allow. Three lookups had already told it no better pattern
  existed. See section 5, finding 3.
- **`Bash` `grep`/`find` blocked by hook** — the prompt mentions the substitution only as an aside
  inside `[WALL]` (*"In this repo `Read` with an offset, `discover` and `python3 -c` do what `grep`,
  `find` and `sed` would"*), not as a `NOT YOURS` line, and no brief carried it in `TRAPS`. The
  codeweaver hit it once at `2.2m` and recovered in 3 s; builders `a663d05` (its `3.2m`), `a94191f`
  (twice, `0.2m` and `2.0m`), `ab2a819` (`6.0m`) and `acccbfc` (`7.5m`) hit it five more times; the
  reviewer hit it three times (Bash calls #4, #14, #15), losing ~50 s of a 6.1-minute run. A second,
  different refusal class hit `ab2a819` (`10.9m`) and `a29d7c24` (`5.0m`): `sed -n '190,225p' …` →
  *"Permission to use Bash with command sed … has been denied"*, which no hook message explains.
  **Nine blocked calls across the item, none of them mentioned in any brief.**

---

## 4. What went well

1. **Zero orientation rework.** The 13 `Read` calls between `0.7m` and `4.9m` hit 13 *distinct*
   files — no path was read twice in the whole 41 minutes. 86,475 bytes, once each. The mechanism is
   step 2's ordering: `get-project-map` for shape (`0.7m`, 44,830 bytes) and `discover` for names
   (10 calls, 18,485 bytes total) *before* any `Read`, so every `Read` was already known to be the
   right file.

2. **The predecessor-commit read paid for itself in one turn.** `git log` at `0.6m` → `Read` of
   `pasted-image-statics.ts` at `0.7m` → the read-check `#check-sentinel-from-shared-statics` came
   back `HOLDS` at `image-prompt-trailer-transformer.ts:12,22-26` without a single rework round.
   Cost of the mechanism: two `git log` calls, 19,891 bytes.

3. **Every wait was a real end-of-turn.** Eight wait rows, 28.7 minutes, and not one `sleep`, poll,
   `ListAgents` or re-dispatch-to-check. Each ended on a plain sentence, exactly as `[HELPERS]`
   prescribes — e.g. `20.0m "Group 3's three agents are out. Four of my eight observables are signed.
   Waiting on their returns before I read the whole diff."` The prompt's rule is what produced this;
   the equivalent measured cost of getting it wrong is 815 seconds on quest a7520e60 (per this
   repo's own CLAUDE.md).

4. **Wave-by-wave signing, exactly as step 4 demands.** Eight `modify-quest` calls at 10.0, 18.7,
   25.7, 29.2, 31.5, 32.7, 34.5 and 40.9 minutes — never a batch at the end. The evidence strings are
   transcriptions with the failing value named, e.g.
   *"Replacing the path segment of the expected string with `WRONG-PATH-TO-PROVE-RED` turned it red on
   a deep-equality failure before it was reverted, so the path is load-bearing rather than incidental
   to the match."* That is what step 4's "copy each return's evidence WORD FOR WORD" is for.

5. **The two untestable units were called untestable, not signed.** `#agent-reads-images` (terminal)
   and `#check-agent-issues-read` both got `verdict: 'unconfirmable'` at `32.7m`, each with a
   `toSettle` naming a concrete action (*"Send a chat message carrying two pasted images through a
   live quest, then open that session's JSONL … confirm a Read tool_use for each written image
   path"*). The prompt's "Never sign one your test proves against a MOCK" is the mechanism; the
   evidence line names the specific reason (*"The orchestrator mocks `child_process.spawn` in every
   unit test, so no CLI ever runs"*).

6. **The operator caught a real inconsistency the reviewer would not have.** At `32.0m`, from the
   diff alone: *"`chat-spawn-broker.test.ts:83` narrows the argv with `as never`, while the two
   sibling test files solved the identical `unknown` problem with a real `Array.isArray` helper."*
   That is step 5 question 3 ("do the pieces fit each other?") doing exactly its job — and the
   reviewer, two minutes later, reported `FIXES: none — no defects found`.

7. **The `RETURN` block's "red I watched" clause produced real red-first evidence in all seven
   builders.** The brief template makes each builder report *"the wrong value that turns it red · the
   red I watched before the code made it pass"*, and every builder actually did it. Examples with the
   exact mutation:
   - `a94191fdacdae4717` at its `5.3m` reverted the implementation and watched **3** tests go red,
     then at `6.3m` applied *a naive fix that only touches the bottom return* and watched **2** stay
     red — proving the brief's `TRAPS` warning about the `if (sessionId)` early return was itself
     load-bearing.
   - `ab2a819ad007dcef5` at its `11.2m` mutated `toBe(2)` → `toBe(3)` and pulled the detail
     (`npm run ward -- detail 1788293033542-f130`) to confirm `Expected: 3, Received: 2`.
   - `acccbfc93e8e66fdd` at its `6.4m` found a *real* bug this way: it had mirrored the neighbouring
     test's partial `toStrictEqual({ chatProcessId })` and ward reported
     `+ "questId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"` unexpectedly present. It asserted the full
     real shape instead. That is the difference between the edge sign-off `forward-to-accepted` being
     true and being a half-truth.

   Those mutations are what the codeweaver then transcribed into the sign-offs verbatim; the chain
   from brief clause → builder action → quest evidence is unbroken.

8. **One reviewer round, green first time.** `a2cdff0296b0a4f41` ran `npm run build` at its own
   elapsed 232.8 s and `npm run ward -- --staged` at 261.0 s — **one** ward invocation, in the
   foreground, correctly scoped by `--staged`, never re-run:

   ```
   lint:      PASS  1 packages (7 files passed/0 files failed, 7 discovered)  6.8s
   typecheck: PASS  12 packages (6128 files passed/0 files failed, 6128 discovered)
   unit:      PASS  1 packages (13 files passed/0 files failed, 515 discovered)  18.0s
   integration: PASS  1 packages (30 files passed/0 files failed, 36 discovered)  36.8s
   ```

   Then `git add -A`, one commit carrying its whole return block in the body, and a bare `git push`.
   `NEXT: pass`. Ward wall time ~65 s inside a 6.1-minute review.

---

## 5. What agents did that they should not have

### Finding 1 — Five of seven builders ran the forbidden `npm run build`, nine times, and one of those builds collided with a live sibling

**What happened.** Every brief carried
`no npm run build · no run-ward MCP tool · no commit · never widen the ward`. Nine builds ran anyway:

| Builder | Builds | Elapsed (own clock) and form |
|---|---|---|
| `a60df5389c57c49fe` | 1 | `1.5m npm run build 2>&1 \| tail -40` — *"Build the repo to confirm exit code before running ward"* |
| `a663d057f395a7bc9` | **0** | compliant |
| `a94191fdacdae4717` | 1 | `2.6m npm run build 2>&1 \| tail -n 60` — *"Build the repo to ensure fresh dist before ward run"* |
| `ab2a819ad007dcef5` | **5** | `7.7m` full · `9.3m --workspace=@dungeonmaster/orchestrator` · `9.4m` full · `10.5m` workspace · `11.5m` workspace |
| `a29d7c24ce877685c` | 1 | `4.2m npm run build 2>&1 \| tail -30` |
| `acccbfc93e8e66fdd` | 1 | `5.8m npm run build` → **exit code 2** |
| `ac8f8759f2167ab9a` | **0** | compliant |

`acccbfc93e8e66fdd`'s build is the one that proves the rule. It ran at wall-clock **19:59:11**, while
`ab2a819ad007dcef5` was still mid-edit under `packages/orchestrator/src/brokers/**`
(`ab2a819` did not finish until 20:04:48). The build failed, and the agent worked out why one turn
later:

> *"The task explicitly said 'no npm run build' — I shouldn't have run that (the failure is in a
> sibling agent's in-flight file under `brokers/**`, which is out of my scope)."*

That is the exact failure the `[BUILD]` rule predicts — *"a second builder hands every sibling
session type errors on correct code"* — observed, in this item, in the transcript.

**Cost.** Nine full or workspace builds of a 13-workspace monorepo. `a2cdff0296b0a4f41`'s single
legitimate build sat between Bash calls #16 and #18 with a 68.4 s gap, so ~60 s is a fair per-build
figure: **≈ 9 minutes of sub-agent wall clock**, none of it on the codeweaver's critical path but all
of it inside builder runs the codeweaver was waiting on. `ab2a819`'s five builds are a visible chunk
of why it took 12.1 minutes — the longest run in the item and the thing that held wave 3 open from
`20.0m` to `31.3m`.

**Prompt disposition: FORBIDDEN by the brief, REQUIRED by the snippet.** See section 3.5 — the
`<dungeonmaster-wardDiscipline>` snippet every sub-agent receives at session start says *"Build
first, unpiped"*, and the sentence that overrides it exists only in prompts sub-agents never read.
Note also that 4 of the 9 were piped into `tail`, which the same snippet explicitly calls out as
discarding the exit code.

### Finding 2 — Builders spawned 8 unbriefed grandchildren that burned 9.78M context-in tokens

**What happened.** Three of the seven builders opened their own sub-agents. `ab2a819ad007dcef5` spawned
three (`Find pastedImageStatics definition`, `Find getSpawnedArgs usage patterns in tests`,
`Find TS pattern for indexing unknown spawned args`); `acccbfc93e8e66fdd` spawned four
(`Locate pastedImageStatics export`, `Find getSpawnedArgs usage pattern in tests`,
`Check indexed getSpawnedArgs reads in sibling tests`, `Get ChatStartResponder return type shape`);
`a663d057f395a7bc9` spawned one (`Find quest images dir statics key`).

**Cost.** Output `6,519 + 1,033 + 3,176 + 970 + 13,680 + 5,247 + 976 + 1,068 = 32,669`.
Context-in `1,169,153 + 202,192 + 718,085 + 260,497 + 5,026,031 + 1,266,499 + 553,979 + 582,270 =
9,778,706` — 14.0% of all sub-agent context-in, for lookups the codeweaver had already done itself
(it read `pasted-image-statics.ts` at `0.7m` and `chat-start-responder.ts` at `4.9m`).
Wall clock: mostly hidden inside the builders' own runs, but `a4b63f5b3cf004acb` alone held
`ab2a819` for 2.7 minutes of its 12.1.

**Prompt disposition: PERMITTED by omission.** The brief template has no line forbidding it, and the
`codeweaver-reviewer` prompt's `[TURN END]` ban on sub-agents applies only to the reviewer.

For reference, the harness's own `subagent_tokens` footer on each nested dispatch (a different,
smaller metric than the `cache_read`-inclusive context-in above): `ab2a819`'s three cost
`39,439 + 99,535 + 184,889 = 323,863`; `acccbfc`'s four cost
`37,566 + 111,606 + 100,505 + 88,413 = 338,090`. `a663d05`'s single `Explore`-type dispatch carries
no footer. Quote the context-in figures as authoritative; these are given only because they are what
the dispatching builder saw.

### Finding 3 — Four lookups asked the same `getSpawnedArgs` question; three returned the wrong answer, a lint rule blocked the right one, and `as never` got written

**What happened.** `acc361dca69bac3b4` (20.0m), `a4b63f5b3cf004acb` (21.1m), `a5e929e0b41fee146`
(21.2m) and `ae0a85580a52a9cf0` (23.6m) all asked how a test narrows a proxy getter typed
`(): unknown` before indexing it. Three said the pattern does not exist:

- `acc361dca69bac3b4`: *"No test indexes into or narrows the `unknown` value at all — every single one
  passes it directly to `expect().toStrictEqual([...])`"* — despite its own file list naming
  `followup-chat-start-responder.test.ts`.
- `a4b63f5b3cf004acb`: *"Zero instances of indexing or string-method calls on a spawned-argv value
  anywhere"*, and then recommended the alternative: *"The convention that DOES exist: `as never`, not
  `as string[]`/`as any` … `as never` shows up ~100 times."*
- `a5e929e0b41fee146`: *"no test ever indexes into the raw `unknown` value … no `Array.isArray` guard,
  `as`, or helper type is used at all."*

Only `ae0a85580a52a9cf0` read the two named files in full instead of grepping, and found the truth:

> *"This file DOES index into specific positions of the unknown-typed array. It defines a top-level,
> non-test-body narrowing helper (lines 29–35): `const spawnedArgvValueAt = ({ args, index }: { args:
> unknown; index: number }): unknown => Array.isArray(args) ? args[index] : undefined;`"*

The direct consequence, and the second half of the cause: `ab2a819ad007dcef5` first tried to type
the cast properly, and the pre-edit hook refused it at its `6.6m`:

> *"❌ Code Quality Issue: 3 violations … Line 85:56/64/75 - Raw string type is not allowed. Use the
> discover endpoint to search for existing contracts…"*

That is `@dungeonmaster/ban-primitives` rejecting `as string[]`. Fifty seconds later, at `7.6m`, it
wrote `const args = proxy.getSpawnedArgs() as never;` — a form the rule permits, that its own lookup
had recommended (*"`as never` shows up ~100 times"*), and that disables every check on the two index
reads after it. Its two sibling builders, working the identical problem at the identical moment,
landed on `Array.isArray` instead.

**Cost.** The three wrong lookups: output `3,176 + 13,680 + 5,247 = 22,103`, context-in
`718,085 + 5,026,031 + 1,266,499 = 7,010,615`. Downstream: the fixer `ac8f8759f2167ab9a` (6,452 out,
3,929,035 ctx-in, 1.8 min), plus 2.2 min of the codeweaver's own wall clock (32.4m dispatch → 34.6m
clear) and a duplicate `modify-quest`. **Total ≈ 4.0 minutes and ~10.9M context-in tokens.**

**Prompt disposition: PERMITTED.** Nothing forbids a builder from re-asking a question a sibling
already asked, and no brief carried the narrowing pattern in `TRAPS` — which is precisely what the
fixer's brief then had to spell out in full, three minutes later, quoting the helper line by line.

### Finding 4 — The "convention" the pass converged on was four minutes old and written by a concurrent sibling

**What happened.** `a29d7c24ce877685c` **invented** `spawnedArgvValueAt` at `19:56:52`, writing it
into `followup-chat-start-responder.test.ts` — it had reached the shape itself, through 11 direct
`discover` calls between its `0.2m` and `2.3m`, and justified it in a comment citing
`quest-modify-broker.test.ts`'s `parseLatestPersisted` as precedent. Nineteen seconds later, at
`19:57:11`, `acccbfc93e8e66fdd` dispatched `ae0a85580a52a9cf0` to *"read these two files in full"* —
one of them that very file, **uncommitted, and not yet ward-verified** (`a29d7c24` did not run its
own scoped ward until `19:57:14+` and did not finish until `19:59:02.675`). The lookup came back at
`19:57:42` reporting the helper as an established pattern (*"Narrowing technique: `Array.isArray(args)`
as a type guard inside a helper function"*), and `acccbfc93e8e66fdd` copied it into
`chat-start-responder.test.ts` at `19:58:55`. The fixer copied it a third time at ~`20:06:30`.

The convergence was correct but accidental: a sibling's 4-minute-old, unverified working-tree edit
was read back by a grandchild as repo convention.

**Cost.** Three verbatim copies of the same 2-line helper shipped in `f48bbc660` — confirmed by
counting `const spawnedArgvValueAt` in the committed blobs: 1 in
`followup-chat-start-responder.test.ts`, 1 in `chat-start-responder.test.ts`, 1 in
`chat-spawn-broker.test.ts`. The reviewer's `dedup` standing concern did not catch it:
*"No dedup, perf, or integrity findings."* That is a genuine reviewer miss on the one concern
written for exactly this.

**Prompt disposition: FORBIDDEN in spirit** — the codeweaver prompt's own table says of copying code
between places, *"no. The two copies drift, and your reviewer reports it as duplication."*

### Finding 5 — Two prohibited `stage:` `get-quest` calls, one of which spilled

**What happened.** Section 3.3. `6.4m get-quest({questId, format:'json', stage:'planning'})` and
`6.7m get-quest({questId, format:'json', stage:'spec'})`, the second returning
`Error: result (135,813 characters across 3,137 lines) exceeds maximum allowed tokens`.

**Cost.** 30,867 bytes of quest JSON into context that nothing but two id strings was wanted from,
one spilled 135,813-char file, one `python3` parse, and ~0.6 min of turn time (overlapped with group
1, so no wall-clock loss).

**Prompt disposition: EXPLICITLY FORBIDDEN** (*"never `stage`"*), but the prompt left no compliant
alternative — the render carries no edge ids. Root cause is the renderer, not the agent.

### Finding 6 — 25 ward invocations across the seven builders, against a snippet that says "run it once"

**What happened.** Per-builder ward runs: `a60df53` 1, `a663d05` 4, `a94191f` 6, `ab2a819` 4 (+1
`ward -- detail`), `a29d7c24` 3, `acccbfc` 5 (+1 `ward -- detail`), `ac8f875` 2. **25 runs and 2
detail fetches.**

Most of that is legitimate: the brief's `RETURN` block demands *"the red I watched before the code
made it pass"*, which costs a minimum of two runs (red, then green) and three whenever there is also
a real failure to fix. Measured against that floor of 2–3, the excess is:

- `a94191f`'s **6** — of which one (`5.0m`) was wasted entirely on a self-inflicted `TS6133:
  'imagePromptTrailerTransformer' is declared but its value is never read`, because it had reverted 2
  of the 3 places it needed to revert before running the red check. One wasted ward cycle inside a
  2.2-minute revert/restore dance.
- `a663d05`'s **4** — one lost to the `--only lint,test` DISCOVERY MISMATCH of section 3.6.
- `acccbfc`'s **5** — one lost to a genuine assertion bug (worth it, finding in section 4 item 7).

**Cost.** Ward runs on these scopes measured 9.3–11.5 s each (`a663d05` 10.1s, `ab2a819` 10.2s and
9.3s, `a60df53` 11.5s). ~25 × 10 s ≈ **4 minutes of sub-agent wall clock**, of which roughly 3 runs
(~30 s) were avoidable. The bigger cost is the *contradiction* it sits on: the
`<dungeonmaster-wardDiscipline>` snippet the sub-agents get says **"Run it ONCE. Choose the right
flags the first time; never re-run the same checks a second way"**, and the brief they get requires a
watched red. Nothing tells them which wins.

**Prompt disposition: REQUIRED by the brief, FORBIDDEN by the snippet.**

### Finding 7 — Wave 2 was a single agent, serialising 7.4 minutes

**What happened.** The map's GROUP 2 held one file pair (`chat-prompt-build-transformer.ts` + its
test) and went out as one `Agent` at `10.9m`. `a94191fdacdae4717` ran 7.5 minutes with nothing beside
it, and the codeweaver waited `10.9m → 18.3m`.

**Cost.** 7.4 minutes of the 41.3 (17.9%) with one sonnet agent running. Nothing on the map could
have joined it (group 3 genuinely needs the builder change on disk) — but GROUP 1's second item, the
`child-process-spawn-stream-json-adapter.test.ts` addition, was a pure test add with no dependency on
anything and returned in 3.5 min at `10.3m`; and `a663d057f395a7bc9`'s slot sat empty from `10.3m`
onward.

**Prompt disposition: REQUIRED.** Step 4's *"a group never goes out before the group it needs has
landed"* is what produced the serialisation, correctly. The prompt has no notion of a change that
belongs to no group.

### Finding 8 — 8 `modify-quest` calls for 11 units, one of them a correction

**What happened.** `#check-new-quest-first-message` was signed at `31.5m` with evidence citing
`chat-spawn-broker.test.ts:90 … line 95`, then re-signed at `34.5m` with `:96 … line 100 … line 95`
because the `as never` fix moved the lines.

**Cost.** One extra `modify-quest` round trip (~0.2 min) plus the re-read at `34.3m`. Small in
itself; it is the tail of finding 3.

**Prompt disposition: REQUIRED** — step 4 says sign each wave immediately, and "Left to step 8 you
would be transcribing dozens of units from returns that scrolled past long ago". Signing early and
correcting is the intended trade.

### Finding 9 — Nine blocked or denied shell calls across the item, none of them warned about in a brief

**What happened.** Two distinct refusal classes, neither mentioned in any brief's `TRAPS`:

| Class | Where | Message |
|---|---|---|
| `PreToolUse` hook | codeweaver `2.2m`; `a663d05` `3.2m`; `a94191f` `0.2m` + `2.0m`; `ab2a819` `6.0m`; `acccbfc` `7.5m`; reviewer Bash #4, #14, #15 | `PreToolUse:Bash hook error: [dungeonmaster-pre-bash]: BLOCKED: Native search tools are disabled` |
| Permission layer | `ab2a819` `10.9m`; `a29d7c24` `5.0m` | `Permission to use Bash with command sed -n '190,225p' … has been denied` |

Also two `PreToolUse:Write`/`Edit` hook refusals on quality rules: `a60df53` at `0.9m`
(*"Metadata comment must appear before all import statements. Your edit was NOT applied"*) and
`ab2a819` at `6.6m` (the `ban-primitives` block of finding 3).

**Cost.** The reviewer's three cost ~50 s of a 6.1-minute run (recovery gaps 19.4 s and 30.5 s). The
builders' six each cost one turn. `ab2a819`'s `ban-primitives` block cost ~50 s *and* set off
finding 3. Across the item, roughly **3–4 minutes of sub-agent time and one wrong design decision.**

**Prompt disposition: NOT ADDRESSED.** The codeweaver prompt buries the substitution inside `[WALL]`;
the `codeweaver-reviewer` prompt's `[GIT]` rule enumerates the two refused *git* forms in full detail
and says nothing about `grep`/`find`/`sed`; and the brief template's `TRAPS` slot is where the
codeweaver dutifully copied both git refusals — but not the search refusals, because its own prompt
never told it those were a category.

### Finding 10 — Nothing durable records what this session learned for the next one

**What happened.** Section 3.4. The `imagePathToUrl` cross-cell routing note, the seam status ("the
server's own cell has not run yet, so that rewrite is still owed"), and the assertion-strategy note
("the `-p` value is pinned whole only on resume paths") all exist only in the final assistant message.

**Cost.** Not measurable in this item's minutes; it is a cost paid by items [4]–[9], which each
re-derive the same seam.

**Prompt disposition: REQUIRED but IMPOSSIBLE** — step 7 says copy `FINDINGS:` into the signal, and
the signal has no field for it.

---

## 6. Suggested fixes

Ranked by minutes-or-tokens saved per codeweaver item.

**1. Put the build/ward/search prohibitions where the sub-agent actually reads them.**
*(fixes findings 1, 6 and 9, and sections 3.5–3.7)*
File: `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, the
verbatim brief block. A sub-agent has no prompt; the brief is its whole rulebook, and it currently
loses a four-word `PROVE` footnote to a session-start snippet that says the opposite. Replace the
`PROVE` block with an explicit override, and add the search line to `TRAPS`:

```
PROVE
  npm run ward -- --only <checks for these files> -- <this brief's own paths>
  Watch it red first (mutate the expected value, run, revert) — that red is what you report.
  THIS OVERRIDES the <dungeonmaster-wardDiscipline> snippet you were handed at session start.
  Its "build first" line and its "run it ONCE" line are both written for a session that owns the
  whole repo. You own three files and no build: sibling sessions are editing this worktree right
  now, `tsc -b` writes one shared dist/, and a build of yours hands them type errors on correct
  code. NO npm run build, in any form, scoped or full. No run-ward MCP tool. No commit.

TRAPS
  Bash grep, find, rg and the native Grep/Glob/Search tools are refused by a hook, and `sed` is
    refused by the permission layer. Use `discover`, `Read` with an offset, or `python3 -c`. `ls`
    and `nl -ba` are fine.
  <the git -C and && / pipe refusals, as now>
```

Nine forbidden builds ran under the current wording; the one that failed did so because a sibling
was mid-edit — the precise scenario the ban exists for.
**Saved: ~9 min of builder wall clock per item of this size, the sibling-collision failure class
entirely, and ~3 min of blocked-call recovery.**

**2. Fix the template's `PROVE` check list.** *(fixes section 3.6 and part of finding 6)*
Same file, same block. `--only lint,test` expands `test` to `unit,integration,e2e`, so on a brief
whose paths are all `*.test.ts` the integration check either mismatches (`a663d057f395a7bc9`, one
lost ward run) or grades 36 unrelated files (`a60df5389c57c49fe`). Change the template line to
`npm run ward -- --only lint,unit -- <paths>` with a one-line note: *"add `integration` only when a
path is a `*.integration.test.ts`; never `test`."* The codeweaver had already worked this out and
wrote `lint,unit` into 5 of its 7 briefs — the template is what is stale.
**Saved: ~1 ward cycle (~10 s) plus one DISCOVERY-MISMATCH diagnosis turn (~0.6 min) per affected
brief.**

**3. Print the edge id in the flow render.** *(fixes finding 5 and section 3.3)*
File: `packages/shared/src/transformers/flow-graph-to-text/flow-graph-to-text-transformer.ts`.
Change the two labelled-edge lines from `` `…${labelPart}[#${String(toId)}]…` `` to
`` `…${labelPart}{#${String(edge.id)}} [#${String(toId)}]…` `` and add the form to the render's KEY
block (`→"label" {#edgeId}   labeled edge (decision branch — each one is a unit)`). Every operator
role that signs an edge reads this render, so the fix lands for flowrider and siegemaster too.
**Saved: ~0.6 min and ~40,000 context tokens per codeweaver item with a labelled edge, plus it stops
a prompt-forbidden call the prompt currently forces.**

**4. Ban grandchild sub-agents in the brief template.** *(fixes finding 2)*
File: `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, inside the
verbatim brief block. Add one line under `TRAPS`, as fixed text the operator copies:
`no Agent tool — you are the last session on this change; ask me if you need something you cannot find`.
Same edit in `flowrider-prompt-statics.ts` and `siegemaster-prompt-statics.ts` if they carry the same
template.
**Saved: 9,778,706 context-in and 32,669 output tokens on this item alone; ~2.7 min off the longest
builder's run.**

**5. Wire `codeweaverScopeBlockTransformer` into the prompt, or delete it.** *(fixes section 3.2)*
File: `packages/orchestrator/src/transformers/work-item-to-prompt/work-item-to-prompt-transformer.ts`.
Add, beside the existing role-specific branches:
`if (workItem.role === 'codeweaver') { parts.push(...codeweaverScopeBlockTransformer({ quest, operationItem: linkedOperation })); }`.
The transformer already returns `ContentText[]` and already returns `[]` when it has nothing to say,
so the four-id block is unchanged for cells with no seam. It would have printed
`- #forward-to-orchestrator with server — NOT BUILT YET: a later session owns these` and
`- shared — orchestrator already depends on it`, which is exactly the seam note the codeweaver spent
a 44,830-byte `get-project-map` call reconstructing. If the block is not wanted, delete the
transformer and its test rather than leaving 174 lines of documented dead code.
**Saved: ~45,000 context tokens (the `get-project-map` call) and ~0.5 min of step-2 exploration per
codeweaver item; removes the "seam status discovered at 41.3m" failure mode.**

**6. Put the `unknown`-narrowing pattern in the standards, not in a lookup.** *(fixes findings 3 and 4)*
File: the `get-testing-patterns` MCP payload (the statics behind
`packages/mcp/src/responders/architecture/…` — same source the three standards tools serve). Add one
worked example under the proxy section:

> A proxy getter typed `(): unknown` is narrowed with a top-level `Array.isArray` helper, never
> `as never`, `as string[]` or `any`:
> `const spawnedArgvValueAt = ({ args, index }: { args: unknown; index: number }): unknown => Array.isArray(args) ? args[index] : undefined;`

Every builder already calls `get-testing-patterns` first (the brief's `READ FIRST` line makes it
mandatory), so this reaches all of them for free and the four lookups never happen. The
`@dungeonmaster/ban-primitives` rule that refused `as string[]` should name this helper in its own
error text, since that refusal is what pushed `ab2a819ad007dcef5` onto `as never` — file
`packages/eslint-plugin/…/ban-primitives`, message: *"…Use the discover endpoint to search for
existing contracts. In a test narrowing a proxy getter typed `unknown`, use a module-level
`Array.isArray` helper returning `unknown`."*
**Saved: ~10.9M context-in tokens and ~4.0 min per item that indexes a spawned argv; also removes the
three-copy duplication in finding 4.**

**7. Give `signal-back` a `findings` field, or change step 7 to say where findings go.**
*(fixes finding 10 and section 3.4)*
Files: `packages/mcp/src/contracts/signal-back-input/signal-back-input-contract.ts` and
`packages/server/src/contracts/signal-back-input/signal-back-input-contract.ts` — add
`findings: contentTextContract.optional()` to both `.strict()` objects and persist it on the
operation item; **or**, if the "no note field" decision stands, change
`codeweaver-prompt-statics.ts` step 7 from *"copy its `FINDINGS:` into your signal"* to *"copy its
`FINDINGS:` into the quest with `modify-quest` before you signal — the signal has no field for
them."* Today the prompt orders a write a `.strict()` schema would reject.
**Saved: no minutes on this item; it is the difference between items [4]–[9] each re-deriving the
seam and reading it once.**

**8. Add a `NOT YOURS` tool line to the reviewer prompt.** *(fixes finding 9)*
File: `packages/orchestrator/src/statics/codeweaver-reviewer/codeweaver-reviewer-statics.ts`, in the
`## Rules` block beside `[GIT]`:
`**[SEARCH] Bash grep, find, rg and the native Grep/Glob/Search tools are refused by a hook.** Use `discover`, `Read` with an offset, or `python3 -c` (os.walk + re). `ls` is not blocked.`
The codeweaver prompt buries the same fact inside `[WALL]`; promote it there too.
**Saved: ~50 s per review, ~3 s per codeweaver.**

**9. Let the map declare a group with no dependency.** *(fixes finding 7)*
File: `codeweaver-prompt-statics.ts`, step 3's map template. Add a `GROUP 0 (depends on nothing —
goes out with GROUP 1 and never blocks anything)` line to the sketch, and in step 4 add: *"Anything
in GROUP 0 goes out in the first message and its return is routed whenever it lands; a later group
never waits on it."* Group 1's adapter-test item was exactly this shape.
**Saved: nothing on this item's critical path (wave 2's 7.4 min was a real dependency), but it stops
the reverse error — a genuinely independent change parked behind a wave it does not need.**

**10. Finding 8 needs no fix — record that deliberately.** *(closes finding 8)*
The `#check-new-quest-first-message` re-sign is the intended cost of step 4's wave-by-wave signing,
and the prompt already argues the trade (*"Left to step 8 you would be transcribing dozens of units
from returns that scrolled past long ago, and everything you had to guess at would be wrong in the
same direction"*). Fix 6 removes the fix-round that moved the lines in the first place; nothing in
`codeweaver-prompt-statics.ts` should change for this.
**Saved: 0 — listed so the finding is not left implying a change is wanted.**

---

## 7. Raw figures appendix

### `python3 tmp/transcript-digest.py summary 751a242b-3691-4aa0-9469-31cbe019d784`

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/751a242b-3691-4aa0-9469-31cbe019d784.jsonl
LINES     363
START     2026-09-01T19:33:33.123000+00:00
END       2026-09-01T20:14:51.925000+00:00
WALL      0:41:18.802000  (41.3 min)
TYPES     {'queue-operation': 20, 'attachment': 98, 'user': 72, 'last-prompt': 24, 'atis-latch': 23, 'assistant': 126}
MODELS    {'claude-opus-5': 126}

TOKENS (this transcript only, excludes subagents)
  assistant API responses : 126
  input (uncached)        : 252
  cache_read              : 29,588,009
  cache_creation          : 927,867
  output                  : 192,707
  of which thinking       : 77,742
  TOTAL context-in        : 30,516,128

TOOL CALLS (63 total)
     13  Read
     12  Bash
     10  mcp__dungeonmaster__discover
      8  Agent
      8  mcp__dungeonmaster__modify-quest
      3  mcp__dungeonmaster__get-quest
      2  ToolSearch
      1  mcp__dungeonmaster__get-agent-prompt
      1  mcp__dungeonmaster__get-architecture
      1  mcp__dungeonmaster__get-syntax-rules
      1  mcp__dungeonmaster__get-testing-patterns
      1  mcp__dungeonmaster__get-project-map
      1  Write
      1  mcp__dungeonmaster__signal-back

TOOL RESULT BYTES fed back: 434,260

SUBAGENTS 16  (run `subagents` subcommand for the roster)
```

### `python3 tmp/transcript-digest.py subagents 751a242b-3691-4aa0-9469-31cbe019d784`

```
09-01 19:39:33  +   4.3m  agent-a60df5389c57c49fe  general-purpose/sonnet  turns= 41 out=18,885 ctx-in=4,343,645
           desc: Build image prompt trailer transformer
           tools: {'ToolSearch': 2, 'Read': 7, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 3, 'Write': 4, 'Bash': 4}
09-01 19:39:49  +   3.5m  agent-a663d057f395a7bc9  general-purpose/sonnet  turns= 36 out=14,613 ctx-in=4,097,761
           desc: Prove argv carries image path
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 5, 'Agent': 1, 'Edit': 3, 'Bash': 6}
09-01 19:40:17  +   1.3m  agent-a95c7635d27ad80ff  Explore/None  turns= 27 out=6,519 ctx-in=1,169,153
           desc: Find quest images dir statics key
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 10, 'Bash': 2, 'Read': 4}
09-01 19:44:25  +   7.5m  agent-a94191fdacdae4717  general-purpose/sonnet  turns= 79 out=23,012 ctx-in=10,890,430
           desc: Wire trailer into chat prompt builder
           tools: {'ToolSearch': 2, 'Read': 9, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Bash': 13, 'mcp__dungeonmaster__discover': 3, 'Edit': 18}
09-01 19:52:43  +  12.1m  agent-ab2a819ad007dcef5  general-purpose/sonnet  turns= 63 out=33,923 ctx-in=9,958,502
           desc: Prove new-quest first message argv
           tools: {'ToolSearch': 1, 'Read': 6, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Agent': 3, 'Bash': 13, 'Edit': 7}
09-01 19:53:00  +   0.3m  agent-a7a7b3c1853511570  general-purpose/None  turns=  6 out=1,033 ctx-in=202,192
           desc: Find pastedImageStatics definition
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 2, 'Read': 1}
09-01 19:53:02  +   6.0m  agent-a29d7c24ce877685c  general-purpose/sonnet  turns= 54 out=25,210 ctx-in=8,028,465
           desc: Prove followup message carries path
           tools: {'ToolSearch': 2, 'Read': 4, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 11, 'Edit': 5, 'Bash': 7}
09-01 19:53:29  +   9.0m  agent-acccbfc93e8e66fdd  general-purpose/sonnet  turns= 56 out=25,813 ctx-in=8,022,545
           desc: Prove responder sees absolute path
           tools: {'ToolSearch': 2, 'Read': 3, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Agent': 4, 'Edit': 9, 'Bash': 10}
09-01 19:53:33  +   0.7m  agent-acc361dca69bac3b4  general-purpose/None  turns= 15 out=3,176 ctx-in=718,085
           desc: Find getSpawnedArgs usage patterns in tests
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 4, 'Read': 4}
09-01 19:53:55  +   0.3m  agent-a26dbe0f7ddcf23f2  general-purpose/None  turns=  8 out=970 ctx-in=260,497
           desc: Locate pastedImageStatics export
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 2, 'Read': 1}
09-01 19:54:38  +   2.7m  agent-a4b63f5b3cf004acb  general-purpose/None  turns= 42 out=13,680 ctx-in=5,026,031
           desc: Find TS pattern for indexing unknown spawned args
           tools: {'Read': 7, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 16}
09-01 19:54:46  +   1.3m  agent-a5e929e0b41fee146  general-purpose/None  turns= 24 out=5,247 ctx-in=1,266,499
           desc: Find getSpawnedArgs usage pattern in tests
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 9, 'Read': 3}
09-01 19:57:11  +   0.5m  agent-ae0a85580a52a9cf0  general-purpose/None  turns= 13 out=976 ctx-in=553,979
           desc: Check indexed getSpawnedArgs reads in sibling tests
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 4, 'Read': 2}
09-01 19:58:19  +   0.3m  agent-ac448235152fa6075  general-purpose/None  turns=  8 out=1,068 ctx-in=582,270
           desc: Get ChatStartResponder return type shape
           tools: {'Read': 1, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 2}
09-01 20:05:59  +   1.8m  agent-ac8f8759f2167ab9a  general-purpose/sonnet  turns= 30 out=6,452 ctx-in=3,929,035
           desc: Replace as-never argv narrowing
           tools: {'ToolSearch': 1, 'Read': 5, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'Edit': 4, 'Bash': 4}
09-01 20:08:10  +   6.1m  agent-a2cdff0296b0a4f41  general-purpose/sonnet  turns= 75 out=24,457 ctx-in=10,739,635
           desc: Review the codeweaver pass
           tools: {'ToolSearch': 3, 'mcp__dungeonmaster__get-agent-prompt': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__get-quest': 1, 'Bash': 21, 'Read': 12, 'mcp__dungeonmaster__discover': 4}

SUBAGENT TOTALS  agents=16 turns=577 output=205,034 context-in=69,788,724
```

### Reviewer `summary` (agent-a2cdff0296b0a4f41)

```
LINES     131
START     2026-09-01T20:08:10.424000+00:00
END       2026-09-01T20:14:18.651000+00:00
WALL      0:06:08.227000  (6.1 min)
TYPES     {'user': 46, 'attachment': 10, 'assistant': 75}
MODELS    {'claude-sonnet-5': 75}

TOKENS (this transcript only, excludes subagents)
  assistant API responses : 75
  input (uncached)        : 150
  cache_read              : 10,197,149
  cache_creation          : 542,336
  output                  : 24,457
  of which thinking       : 15,771
  TOTAL context-in        : 10,739,635

TOOL CALLS (45 total)
     21  Bash
     12  Read
      4  mcp__dungeonmaster__discover
      3  ToolSearch
      1  mcp__dungeonmaster__get-agent-prompt
      1  mcp__dungeonmaster__get-architecture
      1  mcp__dungeonmaster__get-syntax-rules
      1  mcp__dungeonmaster__get-testing-patterns
      1  mcp__dungeonmaster__get-quest

TOOL RESULT BYTES fed back: 2,448
```

### The commit this item produced

```
$ git show --stat --format='' f48bbc660
 .../6cc646e2-d81a-4887-907d-8037147f47a3-map.md    | 81 ++++++++++++++++++++++
 ...child-process-spawn-stream-json-adapter.test.ts | 28 ++++++++
 .../brokers/chat/spawn/chat-spawn-broker.test.ts   | 38 ++++++++++
 .../chat/start/chat-start-responder.proxy.ts       |  2 +
 .../chat/start/chat-start-responder.test.ts        | 62 +++++++++++++++++
 .../start/followup-chat-start-responder.test.ts    | 51 +++++++++++++-
 .../chat-prompt-build-transformer.test.ts          | 76 ++++++++++++++++++
 .../chat-prompt-build-transformer.ts               | 10 +--
 .../image-prompt-trailer-transformer.proxy.ts      |  1 +
 .../image-prompt-trailer-transformer.test.ts       | 53 ++++++++++++
 .../image-prompt-trailer-transformer.ts            | 28 ++++++++
 11 files changed, 425 insertions(+), 5 deletions(-)
```

### Sign-off ledger written by this session (8 `modify-quest` calls)

| Elapsed | Unit | Verdict |
|---|---|---|
| 10.0m | `#check-argv-carries-image-path` (obs, `spawn-cli`) | confirmed |
| 18.7m | `#check-trailer-appended-once`, `#check-no-trailer-without-images` (obs, `build-prompt`) | confirmed ×2 |
| 25.7m | `#check-followup-message-carries-path` (obs, `spawn-cli`) | confirmed |
| 29.2m | `#check-orchestrator-sees-absolute-path` (obs) + edges `forward-to-prompt`, `forward-to-accepted` | confirmed ×3 |
| 31.5m | `#check-new-quest-first-message` (obs, `spawn-cli`) | confirmed |
| 32.7m | node `#agent-reads-images` (terminal) + `#check-agent-issues-read` (obs) | **unconfirmable ×2**, each with a `toSettle` |
| 34.5m | `#check-new-quest-first-message` **re-signed** — line numbers moved by the `as never` fix | confirmed |
| 40.9m | `#check-sentinel-from-shared-statics` (read-check) from the reviewer's report | confirmed |

11 units, 9 `confirmed`, 2 `unconfirmable`, 0 blank.

### Builder `summary` blocks (verbatim token lines and tool histograms)

```
agent-a60df5389c57c49fe  WALL 0:04:17.861 (4.3 min)  LINES 75   assistant 41
  input 82 · cache_read 3,948,362 · cache_creation 395,201 · output 18,885 (thinking 11,777)
  TOTAL context-in 4,343,645 · TOOL RESULT BYTES 714
  tools: Read 7, Write 4, Bash 4, discover 3, ToolSearch 2, get-architecture 1, get-syntax-rules 1, get-testing-patterns 1

agent-a663d057f395a7bc9  WALL 0:03:29.030 (3.5 min)  LINES 66   assistant 36
  input 72 · cache_read 3,725,565 · cache_creation 372,124 · output 14,613 (thinking 8,222)
  TOTAL context-in 4,097,761 · TOOL RESULT BYTES 3,490
  tools: Bash 6, Read 5, Edit 3, ToolSearch 1, get-architecture 1, get-syntax-rules 1, get-testing-patterns 1, Agent 1

agent-a94191fdacdae4717  WALL 0:07:28.405 (7.5 min)  LINES 138  assistant 79
  input 158 · cache_read 10,320,050 · cache_creation 570,222 · output 23,012 (thinking 9,494)
  TOTAL context-in 10,890,430 · TOOL RESULT BYTES 7,021
  tools: Edit 18, Bash 13, Read 9, discover 3, ToolSearch 2, get-architecture 1, get-syntax-rules 1, get-testing-patterns 1

agent-ab2a819ad007dcef5  WALL 0:12:05.306 (12.1 min) LINES 107  assistant 63
  input 126 · cache_read 9,419,996 · cache_creation 538,380 · output 33,923 (thinking 22,957)
  TOTAL context-in 9,958,502 · TOOL RESULT BYTES 4,077
  tools: Bash 13, Edit 7, Read 6, Agent 3, ToolSearch 1, get-architecture 1, get-syntax-rules 1, get-testing-patterns 1

agent-a29d7c24ce877685c  WALL 0:06:00.390 (6.0 min)  LINES 97   assistant 54
  input 108 · cache_read 7,512,377 · cache_creation 515,980 · output 25,210 (thinking 17,571)
  TOTAL context-in 8,028,465 · TOOL RESULT BYTES 174
  tools: discover 11, Bash 7, Edit 5, Read 4, ToolSearch 2, get-architecture 1, get-syntax-rules 1, get-testing-patterns 1

agent-acccbfc93e8e66fdd  WALL 0:09:01.300 (9.0 min)  LINES 98   assistant 56
  input 112 · cache_read 7,636,308 · cache_creation 386,125 · output 25,813 (thinking 14,816)
  TOTAL context-in 8,022,545 · TOOL RESULT BYTES 6,898
  tools: Bash 10, Edit 9, Agent 4, Read 3, ToolSearch 2, get-architecture 1, get-syntax-rules 1, get-testing-patterns 1

agent-ac8f8759f2167ab9a  WALL 0:01:50.421 (1.8 min)  LINES 58   assistant 30
  input 60 · cache_read 3,434,291 · cache_creation 494,684 · output 6,452 (thinking 2,323)
  TOTAL context-in 3,929,035 · TOOL RESULT BYTES 881
  tools: Read 5, Edit 4, Bash 4, ToolSearch 1, get-architecture 1, get-testing-patterns 1, get-syntax-rules 1
```

### Builder compliance tally

| Builder | Files edited | `npm run build` (banned) | ward runs | ward `detail` | hook/permission refusals | nested Agents |
|---|---|---|---|---|---|---|
| `a60df5389c57c49fe` | 3 (all new, all in FILES) | **1** | 1 | 0 | 1 (Write, metadata-comment order) | 0 |
| `a663d057f395a7bc9` | 1 | 0 | 4 | 0 | 1 (`grep`) | 1 |
| `a94191fdacdae4717` | 2 | **1** | 6 | 0 | 2 (`find` ×2) | 0 |
| `ab2a819ad007dcef5` | 1 | **5** | 4 | 1 | 3 (`grep`, `sed` denied, `ban-primitives` Edit) | 3 |
| `a29d7c24ce877685c` | 1 | **1** | 3 | 0 | 1 (`sed` denied) | 0 |
| `acccbfc93e8e66fdd` | 2 | **1** (exit 2, sibling collision) | 5 | 1 | 1 (`grep`) | 4 |
| `ac8f8759f2167ab9a` | 1 | 0 | 2 | 0 | 0 | 0 |
| **Total** | **11 distinct** | **9** | **25** | **2** | **9** | **8** |

Every builder edited only files named in its own `FILES` manifest — no `DO NOT TOUCH` path was
written by any of them, and no two concurrent builders wrote the same file.
`chat-spawn-broker.test.ts` was written by both `ab2a819ad007dcef5` (finished 20:04:48) and
`ac8f8759f2167ab9a` (started 20:05:59) — sequential, and the intended rework.

### Concurrency windows (each builder's own START/END)

```
a60df538...  19:39:33.949 → 19:43:51.810   ┐ concurrent, different files
a663d057...  19:39:49.969 → 19:43:18.999   ┘
a94191fd...  19:44:25.399 → 19:51:53.804     solo
ab2a819a...  19:52:43.288 → 20:04:48.594   ┐
a29d7c24...  19:53:02.285 → 19:59:02.675   ├ concurrent, different files
acccbfc9...  19:53:29.367 → 20:02:30.667   ┘
ac8f8759...  20:05:59.645 → 20:07:50.066     solo
a2cdff02...  20:08:10.424 → 20:14:18.651     solo (reviewer)
```

### Commands used to produce every number above

```
python3 tmp/transcript-digest.py summary   751a242b-3691-4aa0-9469-31cbe019d784
python3 tmp/transcript-digest.py subagents 751a242b-3691-4aa0-9469-31cbe019d784
python3 tmp/transcript-digest.py buckets   751a242b-3691-4aa0-9469-31cbe019d784 --minutes 3
python3 tmp/transcript-digest.py timeline  751a242b-3691-4aa0-9469-31cbe019d784 --max-chars 300
python3 tmp/transcript-digest.py text      751a242b-3691-4aa0-9469-31cbe019d784 --max-chars 3000
python3 tmp/transcript-digest.py errors    751a242b-3691-4aa0-9469-31cbe019d784 --max-chars 900
python3 tmp/transcript-digest.py result    751a242b-3691-4aa0-9469-31cbe019d784 get-agent-prompt --max-chars 40000
python3 tmp/transcript-digest.py result    751a242b-3691-4aa0-9469-31cbe019d784 'get-quest$'      --max-chars 26000
python3 tmp/transcript-digest.py grep      751a242b-3691-4aa0-9469-31cbe019d784 'too large|spilled|saved to' --ctx 400
python3 tmp/transcript-digest.py summary   agent-a2cdff0296b0a4f41 --parent 751a242b-3691-4aa0-9469-31cbe019d784
git show --stat --format='' f48bbc660
git log --format='%h %ad %s' --date=format:'%H:%M:%S' -n 8 f48bbc660
python3 tmp/transcript-digest.py summary   agent-<each of the 7 builders> --parent 751a242b-…
python3 tmp/transcript-digest.py prompts   agent-<each> --parent 751a242b-…  --max-chars 6000
python3 tmp/transcript-digest.py timeline  agent-<each> --parent 751a242b-…  --max-chars 220
python3 tmp/transcript-digest.py errors    agent-<each> --parent 751a242b-…  --max-chars 1500
python3 tmp/transcript-digest.py prompts   agent-<each of the 8 lookups> --parent 751a242b-… --max-chars 3000
python3 tmp/transcript-digest.py text      agent-<each of the 8 lookups> --parent 751a242b-… --max-chars 2500
# plus raw-JSONL python passes over the session and subagent transcripts for: per-tool result bytes,
# Read/Bash/Agent/modify-quest/signal-back tool_use args, sub-agent cache_read vs cache_creation
# split, sub-agent spend bucketed by start time, parent→child Agent maps, brief-shape adherence
# (regex per RETURN heading), and Edit-level tracing of `as never` / `spawnedArgvValueAt`.
git show f48bbc660:<each of the 3 test files>   # counting `const spawnedArgvValueAt` copies
```

**Tooling caveat found while doing this:** `transcript-digest.py result` cannot reach MCP tool
results in a *sub-agent* transcript — those records carry `toolUseResult: null` at the top level and
the payload sits in `message.content[].content[].text` as a JSON string, which `cmd_result` never
inspects. The reviewer's fetched prompt (20,189 chars) had to be extracted by parsing the raw JSONL.
The main-session transcript does not have this shape, which is why `result … get-agent-prompt` worked
there.

**Not measurable from the transcript:** the work item's `dependsOn` field (the prompt carries four
ids only, and `tmp/quest-analysis/workitem-index.txt` does not print the field); the per-record
thinking-token split for depth-2 sub-agents beyond the totals shown; and the exact wall-clock share
of the reviewer's `npm run build` (only its start gap of 68.4 s and its successor gap of 28.2 s are
observable).

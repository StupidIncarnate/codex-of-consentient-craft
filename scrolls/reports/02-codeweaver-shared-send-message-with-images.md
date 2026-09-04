# Work item 02 — codeweaver — shared / send-message-with-images

## 0. Identity

| Field | Value |
|---|---|
| Work item id | `ac2b5262-76de-454a-a2e9-db3956852052` |
| Session id | `b3d97d99-7007-4951-b58e-e6006b46f222` |
| Role | `codeweaver` |
| Model | `claude-opus-5` (transcript `MODELS {'claude-opus-5': 104}`; `roleToModelStatics.codeweaver` = `'opus'`) |
| Operation item id | `f21eacd1-3a1b-492e-83e1-aaf7581aa3b0` |
| Operation text | `Codeweaver: build this slice — package: shared · flow: send-message-with-images` |
| `dependsOn` | `['43262da2-04f1-485a-8b03-fb5c35ca7005']` (the riftcarver work item) |
| `spawnerType` | `agent` |
| `startRef` | `4297f226b8ed228cf675227ea51b051c02aba4b9` |
| Status | `complete`, `actualSignal: 'complete'`, `operationStatus: 'done'` |
| `attempt` / `retryCount` | `0` / `0` — no pt chain, no retry |

Window (ledger): `createdAt 2026-09-01T19:09:04.685Z` leads to `completedAt 2026-09-01T19:33:20.925Z` = **24 min 16 s**.
Window (transcript): `19:09:06.542Z` leads to `19:33:32.460Z` = **0:24:25.918 (24.4 min)**.

This was the FIRST codeweaver of the quest. Nothing quest-related had landed on the branch: at
0.6m the session ran `git log --oneline -n 20` and concluded, verbatim,
`"No quest work has landed yet, so `shared` is running first."`

**Six sub-agents**, all `claude-sonnet-5`:

| id | depth | type | duration | description |
|---|---|---|---|---|
| `agent-aae887e3fc69721ac` | 1 | general-purpose | 2.0 min | Add pasted-image statics |
| `agent-a48efcd3f5ddf7325` | 1 | general-purpose | 1.9 min | Add quest imagesDir location |
| `agent-a5c460d22fb3ee2fc` | 1 | general-purpose | 2.9 min | Add pasted-image media type contract |
| `agent-ab27b38f085122c04` | **2** | Explore | 0.7 min | Find import order convention example (spawned BY `a5c460d22fb3ee2fc`) |
| `agent-acafb4083d5b6bf67` | 1 | general-purpose | 5.2 min | Add pasted-image upload contract |
| `agent-a1a91a783b07cf132` | 1 | general-purpose (`codeweaver-reviewer` prompt) | 6.7 min | Review shared slice |

The session made 5 `Agent` calls; the sixth sub-agent is the depth-2 one a builder spawned for itself.

Deliverable: commit `bebca45c350e3fabe4edf812b03bbd68a6bf4c87` (`bebca45c3`) — **13 files changed, 354 insertions(+), 0 deletions**.

---

## 1. Chronological breakdown — where the time went

| Phase | Clock (UTC) | Elapsed | Min | What happened | Evidence |
|---|---|---|---|---|---|
| P1 Orientation | 19:09:06–19:09:54 | 0.0–0.8m | 0.8 | ToolSearch, `get-agent-prompt`, `get-quest(flowId, packageName)`, `get-architecture`, `get-syntax-rules`, `git log --oneline -n 20`, `get-testing-patterns`, `get-project-inventory` | `0.2m CALL mcp__dungeonmaster__get-agent-prompt(agent=codeweaver …)`; `0.7m say: "No quest work has landed yet, so shared is running first. Now the testing patterns and the shared package's inventory."` |
| P2 Explore the package | 19:09:54–19:13:00 | 0.8–3.9m | 3.1 | 22 `Read` calls + 10 `discover` calls across `packages/shared` and a five-file detour into `packages/local-eslint` to read the `no-bare-location-literals` rule | `2.1m say: "Found a lint rule keyed on this exact statics file. Reading it before I plan the change."` |
| P3 Write the map | 19:13:00–19:13:24 | 3.9–4.3m | 0.4 | `Write` on `.quest-plans/f21eacd1-…-map.md` (3,834 bytes, 53 lines) | `3.9m say: "I have what I need. Writing my map."` → `4.2m CALL Write(file_path=…/.quest-plans/f21eacd1-3a1b-492e-83e1-a…)` |
| P4 Dispatch group 1 | 19:13:24–19:14:00 | 4.3–4.9m | 0.6 | Two `Agent` calls in ONE API response (identical `OUT 3750 / CTX-IN 145,981`) | `4.7m CALL Agent(description=Add pasted-image statics …)`; `4.9m CALL Agent(description=Add quest imagesDir location …)` |
| P5 **Idle — group 1 out** | 19:14:00–19:15:50 | 4.9–6.7m | **1.8** | Turn ended on a plain message, no tool call | `4.9m say: "Group 1 is out … Ending my turn until they report."` → `6.7m ### INJECTED PROMPT: <task-notification> …aae887e3fc69721ac… <status>completed</status>` |
| P6 Route returns, sign, dispatch group 2 | 19:15:50–19:16:44 | 6.7–7.6m | 0.9 | Read two `NEXT: pass` returns, `modify-quest` signing the one observable, `Agent` for group 2 | `7.0m say: "Both group-1 sub-agents passed. Signing my observable now, and sending group 2 in the same message."`; `7.2m CALL mcp__dungeonmaster__modify-quest(...)`; `7.5m CALL Agent(description=Add pasted-image media type contract …)` |
| P7 **Idle — group 2 out** | 19:16:44–19:19:30 | 7.6–10.4m | **2.8** | Turn ended on a plain message | `7.6m say: "… Ending my turn until it reports."` → `10.4m ### INJECTED PROMPT … a5c460d22fb3ee2fc … completed` |
| P8 Route return, dispatch group 3 | 19:19:30–19:20:24 | 10.4–11.3m | 0.9 | `Agent` for group 3; noted the build violation | `11.3m say: "… One note to carry forward: the group-2 sub-agent ran `npm run build --workspace=@dungeonmaster/shared` despite the brief forbidding it."` |
| P9 **Idle — group 3 out** | 19:20:24–19:25:36 | 11.3–16.5m | **5.2** | Turn ended | `16.5m ### INJECTED PROMPT … acafb4083d5b6bf67 … completed` |
| P10 Read the diff, dispatch reviewer | 19:25:36–19:26:30 | 16.5–17.4m | 0.9 | `git status --porcelain`, `git diff --stat`, `git diff`, 5 `Read` calls on the new files, then the reviewer `Agent` | `16.5m say: "All three groups have landed. Reading the whole diff now."`; `17.4m CALL Agent(description=Review shared slice …)` |
| P11 **Idle — reviewer out** | 19:26:30–19:33:06 | 17.4–24.0m | **6.6** | Turn ended | `17.4m say: "The reviewer is out … Ending my turn until it reports."` → `24.0m ### INJECTED PROMPT … a1a91a783b07cf132 … completed` |
| P12 Verify clean tree, signal | 19:33:06–19:33:32 | 24.0–24.4m | 0.4 | `git status --porcelain`, `signal-back`, final report | `24.2m say: "Tree is clean… Signalling."`; `24.2m CALL mcp__dungeonmaster__signal-back(...)` |

Sum: 0.8 + 3.1 + 0.4 + 0.6 + 1.8 + 0.9 + 2.8 + 0.9 + 5.2 + 0.9 + 6.6 + 0.4 = **24.4 min** ✓

### Time by category

| Category | Minutes | % of 24.4 |
|---|---|---|
| Orientation / standards + quest loading | 0.8 | 3.3% |
| Reading the package (exploration) | 3.1 | 12.7% |
| Planning (writing the map) | 0.4 | 1.6% |
| Sub-agent dispatch + routing returns (own turns) | 2.4 | 9.8% |
| Diff review + reviewer dispatch | 0.9 | 3.7% |
| Review cycles (rework passes) | 0.0 | 0% — the reviewer returned `NEXT: pass` first time |
| Verification / ward run BY THIS SESSION | 0.0 | 0% — correct; `[BUILD]` forbids it, the reviewer's 43.2 s of build+ward sits inside P11 |
| **Idle, blocked on a sub-agent** | **16.4** | **67.2%** |
| Final verify + signal | 0.4 | 1.6% |

The session did 8.0 minutes of its own work and spent 16.4 minutes waiting. Every one of those
waits was a correctly-ended turn — not a `sleep`, not a poll.

---

## 2. Chronological token buckets

`python3 tmp/transcript-digest.py buckets b3d97d99-7007-4951-b58e-e6006b46f222 --minutes 1`

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/b3d97d99-7007-4951-b58e-e6006b46f222.jsonl
LINES     299
START     2026-09-01T19:09:06.542000+00:00
END       2026-09-01T19:33:32.460000+00:00
WALL      0:24:25.918000  (24.4 min)

BUCKETS of 1 min
WINDOW              APIs  CALLS   OUT-TOK    CTX-IN-TOK  RESULT-BYTES  TOP TOOLS
09-01 19:09-19:10    23     15    13,512     1,699,043       182,223  Readx5, mcp__dungeonmaster__discoverx2, ToolSearchx1, mcp__dungeonmaster__get-agent-promptx1
09-01 19:10-19:11    18     14    12,213     2,096,407        24,477  Readx9, mcp__dungeonmaster__discoverx4, Bashx1
09-01 19:11-19:12    15     10     6,713     1,991,187        26,353  Readx6, mcp__dungeonmaster__discoverx4
09-01 19:12-19:13     5      2    19,868       701,677         1,726  Readx2
09-01 19:13-19:14     5      3    13,152       732,607        14,909  Agentx2, Writex1
09-01 19:15-19:16     2      0     1,234       304,202             0  
09-01 19:16-19:17     7      3     9,906     1,274,560         5,534  ToolSearchx1, mcp__dungeonmaster__modify-questx1, Agentx1
09-01 19:19-19:20     2      0     8,948       414,124             0  
09-01 19:20-19:21     2      1     4,622       419,067         8,405  Agentx1
09-01 19:25-19:26    14      8     8,886     3,036,298        15,623  Readx5, Bashx3
09-01 19:26-19:27     4      1     5,199       894,911           662  Agentx1
09-01 19:33-19:34     7      2     3,346     1,591,652           430  Bashx1, mcp__dungeonmaster__signal-backx1
```

Buckets with no main-session API call at all (19:14-19:15, 19:17-19:19, 19:21-19:25, 19:27-19:33)
are omitted by the tool — those are the 16.4 idle minutes.

### Sub-agent spend attributed to its start bucket

| Bucket | Sub-agent(s) started | Sub-agent output | Sub-agent context-in |
|---|---|---|---|
| 19:13-19:14 | `aae887e3fc69721ac` + `a48efcd3f5ddf7325` | 7,103 + 3,869 = **10,972** | 1,508,461 + 1,152,024 = **2,660,485** |
| 19:16-19:17 | `a5c460d22fb3ee2fc` | **12,155** | **2,169,535** |
| 19:18-19:19 *(no main row — session idle)* | `ab27b38f085122c04` (depth 2) | **1,939** | **287,810** |
| 19:20-19:21 | `acafb4083d5b6bf67` | **20,715** | **4,249,967** |
| 19:26-19:27 | `a1a91a783b07cf132` (reviewer) | **22,142** | **7,007,077** |
| **Total** | 6 agents, 205 turns | **67,923** | **16,374,874** |

### Totals

| Measure | Main session | Sub-agents (6) | Grand total |
|---|---|---|---|
| API responses / turns | 104 | 205 | 309 |
| Output tokens | **107,599** | **67,923** | **175,522** |
| of which thinking | 51,539 | 33,978 | 85,517 |
| Input (uncached) | 208 | 410 | 618 |
| **cache_read** | **14,500,661** | **14,927,296** | **29,427,957** |
| **cache_creation** | **654,866** | **1,447,168** | **2,102,034** |
| **TOTAL context-in** | **15,155,735** | **16,374,874** | **31,530,609** |

`cache_read` and `cache_creation` are stated separately above and are never collapsed:
cache_read is 93.3% of all context-in (29,427,957 / 31,530,609); cache_creation is 6.7%.

Per-sub-agent cache split (`summary agent-<id>`):

| Agent | input | cache_read | cache_creation | output | thinking |
|---|---|---|---|---|---|
| `aae887e3fc69721ac` | 48 | 1,232,633 | 275,780 | 7,103 | 736 |
| `a48efcd3f5ddf7325` | 40 | 971,808 | 180,176 | 3,869 | 910 |
| `a5c460d22fb3ee2fc` | 66 | 1,903,206 | 266,263 | 12,155 | 5,943 |
| `ab27b38f085122c04` | 28 | 228,028 | 59,754 | 1,939 | 1,099 |
| `acafb4083d5b6bf67` | 98 | 3,874,563 | 375,306 | 20,715 | 10,610 |
| `a1a91a783b07cf132` | 130 | 6,717,058 | 289,889 | 22,142 | 14,680 |
| Sum | 410 | 14,927,296 | 1,447,168 | 67,923 | 33,978 |

Cost per line of product: 31,530,609 context-in tokens ÷ 354 inserted lines = **89,069 context-in
tokens per line**; 175,522 output tokens ÷ 354 = **496 output tokens per line**.

---

## 3. Was the prompt fit for the work?

The rendered prompt was recovered with
`python3 tmp/transcript-digest.py result b3d97d99-7007-4951-b58e-e6006b46f222 get-agent-prompt --max-chars 40000`.
It is **31,940 characters, 593 lines**, `"name": "codeweaver"`, `"model": "opus"`. Diffed
character-by-character against `codeweaver-prompt-statics.ts` at HEAD with `$ARGUMENTS` substituted,
it is **identical** — the only diff lines came from my own crude extraction of the interpolated
`spilledToolResultStatics.markdown` block, not from the prompt. `7092766f9` (the last commit to
touch that statics file) landed `2026-09-01 12:02:42 -0700` = `19:02:42Z`, **6 minutes 22 seconds
before this work item started**. So everything below is about the prompt as it stands today.

### 3.1 The rendered Operation Context is four lines, and the block that would have made it useful is dead code

Rendered, in full:

```
## Operation Context

Quest ID: 1be07040-b9ec-476c-a439-0b4fbb0123cd
Work Item ID: ac2b5262-76de-454a-a2e9-db3956852052
Operation Item ID: f21eacd1-3a1b-492e-83e1-aaf7581aa3b0
Your operation item: [codeweaver] Codeweaver: build this slice — package: shared · flow: send-message-with-images
```

Counts inside the rendered prompt: `Seams` **0**, `Shared homes` **0**, `Work item context` **0**,
`packageNames` **0**.

`codeweaverScopeBlockTransformer` exists at
`packages/orchestrator/src/transformers/codeweaver-scope-block/codeweaver-scope-block-transformer.ts`,
is documented at length, and has a colocated test. A repo-wide `os.walk` regex for
`codeweaverScopeBlockTransformer` returns **exactly two files: the transformer and its own test.**
`workItemToPromptTransformer` — read in full — never calls it. **No codeweaver session has ever
received a Seams or Shared-homes block.**

For this cell the block would have rendered real content. `#resolve-images-dir` tags
`['server', 'shared']`, and the `server`/`send-message-with-images` operation item was still
`pending` at 19:09, so the transformer's seam line would have read:

> `  - #resolve-images-dir with server — NOT BUILT YET: a later session owns these — build your half to the shape they need, and do NOT build theirs`

And `packagesAffected` carries a second `library`-kind package, `testing`, which would have appeared
under Shared homes.

**What the agent did instead:** it derived the seam itself from the flow render's `{server ● 5,
shared ● 1}` tag counts and wrote its own section on the map — a section the map template does not
contain:

```
SEAM ASSUMPTIONS (server's half of #resolve-images-dir, not built yet)
  The server resolves <questFolder>/images itself, either through a new
  `brokers/locations/quest-images-path-find/` resolver in shared mirroring
  locations-ward-results-path-find-broker, or by joining questFolderPath with
  locationsStatics.quest.imagesDir. Only 1 of that node's 6 observables is shared's, and it is the
  statics key — so I ship the key and leave the resolver to the server cell.
```

It got the right answer. It cost invention, and the "has that package's cell already run?" half —
which only the ledger answers and which the flow render does not carry — it could not get at all.

### 3.2 The step script matched the work almost exactly

| Prompt passage (rendered) | What the agent did | Citation |
|---|---|---|
| `**[BUILD] You run no build, no ward and no test of any kind.**` | 6 Bash calls, zero builds, zero wards, zero tests. All git plus one `wc -l … ; ls`. | histogram `6 Bash`; every command is git/`wc`/`ls` |
| `**Never `sleep`. Never poll. Never re-run something to find out whether it finished.** … **With everything you can do done and a helper still out, end your turn on a plain message and no tool call.**` | Four turns ended on a bare message, zero sleeps, zero polls, zero `ListAgents`. | `4.9m`, `7.6m`, `11.3m`, `17.4m` — each ends `"Ending my turn until it reports."` |
| `**Every change in ONE group goes out in a SINGLE message**, one `Agent` call each` | Group 1's two `Agent` calls carry identical `OUT 3750 / CTX-IN 145,981`, i.e. one API response. | timeline `4.7m` and `4.9m` |
| `**Sign this group's `PROVED` lines NOW, before you send the next group.**` | `modify-quest` at `7.2m`, group 2 dispatched at `7.5m`. | `7.0m say: "Both group-1 sub-agents passed. Signing my observable now, and sending group 2 in the same message."` |
| `Dispatch with `subagent_type: "general-purpose"` and `model: "sonnet"`` | All 5 dispatches `general-purpose`; roster shows `claude-sonnet-5` on every one. | `subagents` roster |
| `**Put both [GIT FORMS] refusals in every brief's `TRAPS`, substitute included.**` | Present in **4 of 4** briefs (`git -C` count 1, `&&` count 1 in each). | e.g. `a48efcd3f5ddf7325` TRAPS: `"git: never `git -C <path> …` … Never chain a git call with `&&` and never pipe its output; use git's own flags"` |
| `**Sign only observables printed in full**` | Signed exactly one — `#check-images-dir-name-is-shared`, the only observable the render printed with `{shared}`. The other five on that node carry `package: 'server'` and were signed by the server cell 41 minutes later. | `24.2m say: "My cell has exactly one verification unit and it carries a `confirmed` verdict"` |
| `**EVERY CONTRACT UNDER A `## Contracts` heading CARRIES WORK OF YOURS** … a contract whose `source` sits in ANOTHER package still renders here` | Handled all four contract groups, including `#user-entry` in `## Contracts you own that NO flow of yours anchors`, which is spec'd `"Unchanged"` on every property. Recorded it under a `NO CHANGE` heading rather than skipping it. | map lines 26–29 |

The one item ignored: step 2 lists two git reads,
```
git log --oneline -n 20
git log --name-only -n 10
```
Only the first ran (`0.6m`). Defensible on a cold start — the first came back with nothing
quest-related — but the prompt states both unconditionally and gives no skip rule.

### 3.3 The scope fetch was 57% design decisions the cell could not act on

`get-quest({ questId, flowId: 'send-message-with-images', packageName: 'shared' })` returned
**27,330 characters**. Measured by section:

| Section | Chars | % |
|---|---|---|
| Header, original request, other-flow ids, KEY legend | 2,919 | 10.7% |
| The flow graph (18 nodes, 19 edges) | 4,335 | 15.9% |
| `## Contracts on this flow` + `## Contracts you own that NO flow of yours anchors` | 4,627 | 16.9% |
| `## Design decisions governing these nodes` | **11,470** | **42.0%** |
| `## Design decisions for the whole quest` | **3,979** | **14.6%** |

**15,449 of 27,330 characters (56.5%) are design decisions.** Thirteen are rendered under "governing
these nodes"; **ten of the thirteen name no node this cell owns** (`#shift-enter-still-newlines`,
`#progress-bar-clears-on-both-outcomes`, `#two-live-send-surfaces`, `#http-response-and-agent-spawn-fork`,
`#images-served-by-path-not-by-quest`, `#prompt-tells-the-agent-to-read`, `#upload-as-json-base64`,
`#restored-draft-sends-like-any-other`, `#one-send-path-whatever-the-message-number`,
`#image-token-format`). The three that do name `#resolve-images-dir` are the three that mattered.
The filter is by FLOW, never by the cell's own nodes.

### 3.4 The largest single blob in the session is within 3% of the spill ceiling — and six sessions loaded it

`get-testing-patterns` measured **48,698 bytes** of tool-result text (raw `tool_result.content`),
against `mcpToolResultStatics.maxVerbatimChars: 50_000`. That is **97.4% of the ceiling** — the
ceiling whose failure mode the codeweaver prompt's own header comment describes:

> `Over that ceiling Claude Code spills the tool result to a file and hands the agent an error stub, so the session holds a path instead of its instructions and nothing reports a failure.`

Nothing spilled on this run (`<sessionId>/tool-results/` does not exist). But the prompt's brief
template mandates `READ FIRST get-architecture, get-syntax-rules, get-testing-patterns` in every
brief, and the reviewer prompt mandates all three at step 1 — so the trio was loaded **6 times**
(operator + 4 builders + reviewer) at 90,371 bytes a load = **542,226 bytes, about 135,557 tokens** for
three files that never change during a quest.

### 3.5 The prompt tells the agent to put findings somewhere the tool has no room for

Step 7, rendered:

> `| `pass` | go to step 8, and copy its `FINDINGS:` into your signal — anything it named for someone else survives nowhere else |`

`signalBackInputContract` is `.strict()` with exactly five fields: `questId`, `workItemId`, `signal`,
`operationItemId`, `operationStatus`, plus `blockedReason` — and its own comment says
`// There is NO note field — the next-session handoff is the git commit message, not the ledger.`
A `done` signal has nowhere to carry a finding.

Here the reviewer's `FINDINGS:` was `none`, so nothing was lost from that channel. But the operator's
own two carry-forwards, written in its final assistant message at `24.4m`, went nowhere the server
cell could read them:

> `**The server owns resolving the images directory, and it isn't built yet.** … The server cell either adds a `brokers/locations/quest-images-path-find/` resolver mirroring `locations-ward-results-path-find-broker`, or joins the quest folder path with `locationsStatics.quest.imagesDir` itself.`
>
> `**One sub-agent ran `npm run build --workspace=@dungeonmaster/shared` despite the brief forbidding it.**`

The first survived only because the agent had also written it onto its map and the reviewer's
`git add -A` happened to sweep the map file into the commit (`.quest-plans/f21eacd1-…-map.md | 53 +`).
That is luck, not design. The second survived nowhere at all.

### 3.6 Nothing in the prompt stops a code-writing sub-agent from spawning its own sub-agent

`agent-a5c460d22fb3ee2fc` dispatched `agent-ab27b38f085122c04` at depth 2. The codeweaver prompt's
`NOT YOURS` block, the brief template's `TRAPS` and `DO NOT TOUCH` sections, and the `PROVE` line
(`no npm run build · no run-ward MCP tool · no commit · never widen the ward`) say nothing about
sub-agents. Only the reviewer's own served prompt forbids it (`you start no sub-agent`). The
operator's briefs are its own words, and it did not think to add the rule.

### 3.7 The prompt has no guidance on when to MERGE dependent changes into one sub-agent

The map declared GROUP 1 (5 files, 2 agents), GROUP 2 (3 files, 1 agent), GROUP 3 (4 files, 1 agent).
Groups 2 and 3 are one agent each, run serially, because
`**a group never goes out before the group it needs has landed**`. That rule is about groups. There
is no rule about whether two dependent single-agent changes in the same folder tier should have been
ONE brief. The cost is in §5 finding 6.

---

## 4. What went well

1. **Zero sleeps, zero polls, zero wasted wake-ups across 16.4 idle minutes.** Four clean turn-ends
   (`4.9m`, `7.6m`, `11.3m`, `17.4m`), each on a plain message with no tool call, each re-entered by
   a `<task-notification>`. The mechanism is the `[HELPERS]` rule's explicit
   `**With everything you can do done and a helper still out, end your turn on a plain message and no tool call.**`
   Compare the 815 seconds of sleeps this repo's own `CLAUDE.md` records from quest `a7520e60`.
   Cost of the four idle turns to the main session: the `19:15-19:16` and `19:19-19:20` buckets —
   2 API calls each, 1,234 and 8,948 output tokens, **0 tool calls**.

2. **The exploration produced a lint trap that saved a whole rework cycle.** At `2.1m` the session
   said `"Found a lint rule keyed on this exact statics file. Reading it before I plan the change."`
   and spent 0.3 min reading five `packages/local-eslint` files. That became TRAP #1 on the map and
   the first TRAP in the `a48efcd3f5ddf7325` brief, verbatim:

   > `'images' is 6 characters with no '.' and no '/', so shouldRetainLocationLiteralGuard (minRetainedLiteralLength 8, packages/local-eslint/src/statics/location-literal/) drops it from the no-bare-location-literals banned set. Adding this key bans nothing repo-wide. Do NOT add 'images' to `excludedLiterals` and do NOT touch anything under packages/local-eslint.`

   The sub-agent touched nothing under `packages/local-eslint`. Mechanism: the prompt's step 2
   `Read the code. Find where your flow's nodes land, what already exists` with no cap on what
   counts as "the code".

3. **A genuine red-then-green on the one unit the cell owned.** The `a48efcd3f5ddf7325` brief's
   `MUST BE TRUE` block ended `Run it and watch it go red before you add the key to the statics
   file, then green after. Report both.` The sub-agent ran the failing ward at +42.8s
   (`ward run 1788290082935-c5f6`, `unit FAIL 1 files, 1 errors, 561 discovered`), pulled
   `npm run ward -- detail 1788290082935-c5f6 …` at +51.8s, then went green at +65.6s. Total cost:
   roughly 23 seconds of one sonnet agent. Mechanism: the prompt's
   `**`MUST BE TRUE` quotes the observable, never your paraphrase.**` plus the brief template's
   `PROVED: <unit-id> — <test file:line> · <the assertion, quoted> · <the wrong value that turns it
   red> · <the red I watched before the code made it pass>`.

4. **The transcription chain from sub-agent to sign-off to reviewer held.** The signed evidence reads
   `packages/shared/src/statics/locations/locations-statics.test.ts:5 — the whole-object
   expect(locationsStatics).toStrictEqual({...}) now carries quest.imagesDir: 'images' in its
   expected shape.` Line 5 is where the `toStrictEqual` opens; line 46 is where `imagesDir: 'images'`
   sits. Both cite the same assertion. Cost: one `modify-quest` call at `7.2m`, 65 bytes of result.

5. **The reviewer verdict was earned, not asserted.** `NEXT: pass` on the first pass, with
   `npm run build` (29.6 s, exit 0, all 13 workspaces) and `npm run ward -- --staged` (13.6 s:
   lint 4/4, typecheck 6125/6125 across 12 packages, unit 39/39, integration 39/39, e2e skip) run
   exactly once each — against a budget of "twice at most". Its `FINDINGS:` block records three
   things it considered and dismissed with reasons, including
   `pastedImageMediaTypeContract's 4-value enum overlaps imageBlockParamContract's inline media_type
   enum by coincidence … so this is not a dedup finding.`

6. **Zero rework passes, zero retries, zero errors in the main session.** `attempt: 0`,
   `retryCount: 0`, no `pt N` continuation. The `errors` subcommand on the main transcript returns
   only false positives from the word "error" inside the standards blobs.

---

## 5. What agents did that they should not have

### Finding 1 — Two builder sub-agents ran `npm run build`; the operator caught one

**What happened.** Every one of the four briefs ends its `PROVE` block with the identical line
`no npm run build · no run-ward MCP tool · no commit · never widen the ward`. Two agents ran it anyway:

- `agent-a5c460d22fb3ee2fc` at `2026-09-01T19:18:36.750Z` (+117.9 s into its run):
  `npm run build --workspace=@dungeonmaster/shared`, description `"Build shared package"`.
- `agent-acafb4083d5b6bf67` at `2026-09-01T19:23:58.207Z` (+217.0 s):
  `npm run build 2>&1 | tail -50`, description `"Build the monorepo to refresh dist output before ward"`
  — the **whole monorepo**, and **piped**, which additionally violates the `<dungeonmaster-wardDiscipline>`
  snippet's `Run `npm run build` as its OWN command and confirm it exits 0 — piping it … discards the exit code`.

**Cost.** The piped full build ran roughly 48 seconds (call at +217.0 s, `Build exited 0` at +264.8 s) —
the single largest identifiable time cost inside the 5.2-minute agent, and roughly 15% of the 5.2-minute
group-3 wait the operator sat through. The scoped one is not separately timed but sits inside a 6.5 s
gap. Nothing was corrupted here only because no sibling cell was building at 19:18 or 19:24.

**Prompt status: FORBIDDEN**, twice over — by the brief's own `PROVE` line and by the operator prompt's
`[BUILD]` rule (`Only one session runs those two at a time. `tsc` writes one shared `dist/` per
package and ward's typecheck is `tsc -b`, which builds — so a second builder hands every sibling
session type errors on correct code.`). The competing instruction is real: the SubagentStart
`<dungeonmaster-ward>` / `<dungeonmaster-wardDiscipline>` snippets, injected into every sub-agent
session, open with **`Build first, unpiped.`** The operator prompt overrides those snippets for
ITSELF (`This rule overrides the `<dungeonmaster-ward>` and `<dungeonmaster-wardDiscipline>` snippets
you were handed at session start`) and the reviewer prompt overrides them for ITSELF — **no such
override text reaches a code-writing sub-agent**, whose brief is the operator's own words.

**The operator reported one of the two.** At `11.3m` it flagged `a5c460d22fb3ee2fc`, and repeated it
in its final message. It never learned about `acafb4083d5b6bf67`'s, which fired at 19:23:58 while the
operator's turn was already over; the operator read that agent's `NEXT:` line, not its command list.

### Finding 2 — A depth-2 sub-agent burned 287,810 context-in tokens on a question ESLint answers for free, and the answer was discarded

**What happened.** `agent-a5c460d22fb3ee2fc` dispatched `agent-ab27b38f085122c04` (Explore) with:

> `"Find an existing *.test.ts file in packages/shared/src/contracts/**/ that imports from BOTH its own colocated contract/stub file (a `./`-relative import) AND a `../../statics/...` file, and tell me the exact order the import lines appear in"`

It returned an answer, and noted the convention is not even consistent
(`"other test files in this package don't follow this same order … so this isn't fully consistent
across the codebase"`). The parent then said, in its own transcript,
`"Since ward's lint check runs ESLint with `--fix`, import ordering will self-correct if needed"`,
and after its ward run concluded `"Ward left this file untouched (import order was already fine) …
so no changes needed there."`

**Cost.** 0.7 min wall (44.833 s), 14 turns, **1,939 output tokens, 287,810 context-in tokens**
(228,028 cache_read + 59,754 cache_creation), inside the 2.8-minute group-2 wait. The answer changed
nothing.

**Prompt status: PERMITTED BY OMISSION.** Nothing in the codeweaver prompt, the brief template, or
the four briefs forbids a code-writing sub-agent from starting its own. The reviewer's served prompt
does (`you start no sub-agent`); a generic builder has no served prompt to carry that rule.

### Finding 3 — The reviewer called `get-quest` twice, both times WITHOUT `flowId`, which its own prompt forbids in bold

**What happened.** The reviewer's own prompt, step 2, states the call as
`get-quest({ questId: 'QUEST_ID', flowId: '<the FLOW: line in your brief>' })` and then, in bold:

> `**Never call `get-quest` without `flowId`.** A whole-quest render carries every flow, and it grows with the quest — past the MCP result ceiling on any quest of real size. Over that ceiling the layer writes the result to a FILE and hands you an error stub, so you would grade this work holding a path instead of a spec, with nothing reporting a failure.`

Its parent's brief supplied the flow id explicitly:

```
Call get-agent-prompt({ agent: 'codeweaver-reviewer', questId: '1be07040-b9ec-476c-a439-0b4fbb0123cd' }) FIRST, then follow what it returns exactly.
OPERATION: f21eacd1-3a1b-492e-83e1-aaf7581aa3b0
FLOW: send-message-with-images
PACKAGE: shared
```

It nonetheless ran, at `0.4m`, `CALL mcp__dungeonmaster__get-quest(questId=1be07040-b9ec-476c-a439-0b4fbb0123cd)`
— bare — and then at `0.6m`, `CALL mcp__dungeonmaster__get-quest(questId=… packageName=shared)`.
Neither call carried `flowId`. The prescribed call was never made.

**Cost.** 35,631 + 26,058 = **61,689 bytes, about 15,422 tokens**, against roughly 27,000 chars for one correct
call. Context-in jumped from 73,692 to 95,716 across those two turns. It escaped the spill the prompt warns
about only because this quest's whole-quest render happened to be 35,631 bytes, 71% of the 50,000
ceiling.

**Prompt status: FORBIDDEN** — in bold, in the section the agent was reading at the time. The parent
did nothing wrong.

### Finding 4 — The reviewer read `git log` with `--oneline`, stripping the bodies its prompt sent it there for

**What happened.** Its prompt says:

> `Also read `git log` with bodies on this branch — bound it with `-n <count>`, never piped through `head` (see [GIT]). An earlier go round on this same operation item may have landed work you are now building on, and its commit body says what it did.`

It ran `git log -n 15 --oneline` at +59.1 s. `--oneline` suppresses bodies entirely.

**Cost.** Zero minutes and zero tokens on this run — it was the first codeweaver, so there was no
prior pass body to read. On any `pt N` continuation the same mistake makes the check silently vacuous.

**Prompt status: REQUIRED, and not done.** The prompt says "with bodies"; it does not name the flag
(`--format=%B`, or a bare `git log -n <count>`), and `--oneline` is one of the flags the same
paragraph lists as legitimate output bounds three sentences later.

### Finding 5 — The reviewer re-tested a search-tool block it had already been told about

**What happened.** The `<dungeonmaster-discover>` snippet reached this sub-agent at SubagentStart:
`Native Glob, Grep, Search, and Find tools — plus shell `grep`/`find`/`sed` — are blocked by hooks.`
It then ran a `find` at +66.9 s (blocked), and **158 seconds later** deliberately ran

```
grep -n "\"./contracts\"\|\"./statics\"" -A4 /home/.../packages/shared/package.json 2>/dev/null || true
```

with its own description reading `"Check package.json exports map for contracts and statics subpaths (grep not blocked in Bash? test)"`.
Both returned
`PreToolUse:Bash hook error: [dungeonmaster-pre-bash]: BLOCKED: Native search tools are disabled.`
It then said `"Right, grep via Bash is blocked. Let me just read the package.json directly."`

**Cost.** Two wasted turns and roughly 10 s inside the 6.6-minute reviewer wait. Small, but it is a
deliberate experiment against information already in context.

**Prompt status: NEITHER PERMITTED NOR FORBIDDEN by the reviewer prompt** — the `[WALL]`-equivalent
guidance lives in the operator prompt (`In this repo `Read` with an offset, `discover` and
`python3 -c` do what `grep`, `find` and `sed` would. Swap the tool first.`) and has no counterpart in
`codeweaver-reviewer-statics.ts`.

### Finding 6 — Groups 2 and 3 were serialised into two single-agent waves for two contracts one agent could have written together

**What happened.** GROUP 2 = `pasted-image-media-type/` (contract + stub + test). GROUP 3 =
`pasted-image-upload/` (contract + stub + test) plus the 4 barrel lines in `packages/shared/contracts.ts`.
They touch **disjoint files**; the only coupling is that the upload contract imports the media-type
contract. Group 3's brief even names the dependency as read-only context:

> `DO NOT TOUCH … packages/shared/src/contracts/pasted-image-media-type/**   (already landed and green — read it, do not edit it)`

**Cost.** Group 2 (2.9 min) + the operator's routing turn (0.9 min) + group 3 (5.2 min) = **9.0
minutes** of the 24.4. One brief covering both contracts, both stubs, both tests and all four barrel
lines would have been roughly the size of the group-3 brief and would plausibly have run in 5.5–6
minutes — a saving of **roughly 3 minutes, 37% of the session's post-map wall clock**, plus one whole sonnet
session's orientation load (roughly 90,371 bytes of standards) and one operator routing turn.

**Prompt status: PERMITTED, and arguably steered toward.** The prompt's grouping rules are about
FILES (`Two changes go in one group only when they touch different files`) and about ORDER
(`a group never goes out before the group it needs has landed`). Nothing says "one sub-agent may
carry several dependent files in one pass", and the map template's `GROUP N` shape invites one agent
per line.

### Finding 7 — 18 loads of the same three standards blobs

**What happened.** `get-architecture` (18,025 B), `get-syntax-rules` (23,648 B) and
`get-testing-patterns` (48,698 B) were fetched by the operator, by each of the four builder
sub-agents, and by the reviewer. Byte-identical every time.

**Cost.** Builders alone: **12 calls, 361,484 bytes, about 90,371 tokens**. Adding the operator's and the
reviewer's three each: **18 calls, 542,226 bytes, about 135,557 tokens**, or **0.43% of the run's
31,530,609 context-in** — and because every one of them is re-read on each subsequent turn of its own
session, the replayed cost is far larger than the one-time figure.

**Prompt status: REQUIRED.** The brief template hard-codes
`READ FIRST\n  get-architecture, get-syntax-rules, get-testing-patterns`; the operator's step 2 and
the reviewer's step 1 each require all three.

### Finding 8 — Two re-reads inside the operator's own exploration

**What happened.** Of 27 `Read` calls, `packages/shared/src/contracts/rate-limit-window/…` was read
at `2.7m` and again at `3.8m`. (The other repeats in the histogram —
`locations/` ×2, `exit-code` ×3, `local-eslint/transformers` ×2, `pasted-image*` ×4 — are distinct
sibling files under a truncated path prefix, not re-reads.)

**Cost.** One extra `Read`, well under 0.1 min. Listed for completeness; it is noise against the
16.4-minute idle figure.

**Prompt status: PERMITTED.** Step 2 puts no cap on reading during exploration.

---

## 6. Suggested fixes

Ranked by minutes-or-tokens saved.

### Fix 1 — Wire `codeweaverScopeBlockTransformer` into the prompt renderer (§3.1)

**File:** `packages/orchestrator/src/transformers/work-item-to-prompt/work-item-to-prompt-transformer.ts`.

**Edit:** after the four-id `parts` array is built, add a `workItem.role === 'codeweaver'` branch that
pushes `contentTextContract.parse('')` followed by
`...codeweaverScopeBlockTransformer({ quest, operationItem: linkedOperation })`. The transformer
already returns `[]` for a cell with nothing to say, and already caps itself to two short blocks —
for this item it would have added roughly 4 lines, roughly 330 characters, against a 31,940-character prompt with
18,060 characters of headroom under the 50,000 ceiling.

**Estimated saving:** roughly 0.3 min per codeweaver of seam re-derivation, plus the class of defect the
transformer's own header comment exists to prevent (`telling a consumer nothing about a provider that
pivoted is how a seam ships broken`). Across the 7 codeweavers on this quest, roughly 2 minutes and one
category of cross-cell error. This is the highest-value fix because it is a wiring omission, not a
prompt rewrite.

### Fix 2 — Give code-writing sub-agents the same snippet override the operator and reviewer get (§5 finding 1)

**File:** `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, the
brief template's `PROVE` block.

**Edit:** replace
`no npm run build · no run-ward MCP tool · no commit · never widen the ward`
with
```
no npm run build · no run-ward MCP tool · no commit · never widen the ward
This OVERRIDES the <dungeonmaster-ward> and <dungeonmaster-wardDiscipline> snippets you were
handed at session start. Their "build first, unpiped" line is written for a session that owns the
tree; you are one of several running at once, and `tsc` writes one shared dist/ per package.
Your reviewer runs the build. If ward reports a stale-dist type error, report it — do not build.
```

**Estimated saving:** roughly 48 s per offending sub-agent measured here (2 of 4 offended), and removal of
the corruption risk the rule exists for. On a wave of four parallel builders the avoided risk is worth
more than the 48 s.

### Fix 3 — Add a "no sub-agents" line to the brief template (§5 finding 2)

**File:** the same brief template, in `TRAPS` or beside the `PROVE` block.

**Edit:** add one line — `You start no sub-agent of your own. A question you cannot answer from the
files goes in your NEXT: rework line.`

**Estimated saving:** 0.7 min and 287,810 context-in tokens on this run; the depth-2 dispatch was pure
loss. One line of prompt.

### Fix 4 — Merge dependent single-file changes into one sub-agent (§5 finding 6)

**File:** `codeweaver-prompt-statics.ts`, step 3 (`### 3. Write your map`), under
`**Order comes from what a change needs, not from the flow's shape.**`

**Edit:** add — `**A dependency between two changes is a reason to give them to ONE sub-agent, not a
reason for two groups.** A group is what runs in PARALLEL. Where change B only compiles once change A
exists and both are yours, one brief carrying both is one dispatch, one orientation load and one
ward run instead of two. Split into groups only where two changes touch the same file, or where you
need to read A's result before you can specify B.`

**Estimated saving:** roughly 3 min of wall clock and roughly 90,371 bytes of duplicated orientation per merged
pair. On this quest's 7 codeweavers, plausibly 10–15 minutes.

### Fix 5 — Filter design decisions to the cell's own nodes in the `get-quest` render (§3.3)

**File:** the quest text renderer behind `get-quest` (the `## Design decisions governing these nodes`
section — `packages/orchestrator/src/transformers/quest-*-to-text/`), where `packageName` is already
in scope.

**Edit:** when `packageName` is supplied, render in full only the decisions whose `relatesTo` names a
node the package tags; collapse the rest to one line each (`#id: "<title>" — governs nodes you do not
own`). Keep `## Design decisions for the whole quest` unfiltered, since by definition it binds.

**Estimated saving:** on this item, 10 of 13 decisions collapse — roughly **8,800 of 27,330
characters (32%)** off every codeweaver's scope fetch, and off every turn's cache_read replay for the
rest of the session. Across the session's 104 API responses that is the largest single token lever
available.

### Fix 6 — Name the flag in the reviewer's `git log` instruction (§5 finding 4)

**File:** `packages/orchestrator/src/statics/codeweaver-reviewer/codeweaver-reviewer-statics.ts`, step 3.

**Edit:** replace `Also read `git log` with bodies on this branch — bound it with `-n <count>``
with the literal command: ``git log -n 10`` (no `--oneline`, no `--stat` — you want the bodies)`.
The current wording says "with bodies" three sentences before listing `--oneline` as an acceptable
bound, and the agent took the flag.

**Estimated saving:** zero on this run (cold start). On a `pt N` codeweaver it is the difference
between reading the previous pass's return block and re-deriving it — the same failure the repo's own
notes price at 101 minutes for 11 minutes of work.

### Fix 7 — Make the `flowId` requirement mechanical rather than advisory (§5 finding 3)

**File:** `packages/orchestrator/src/statics/codeweaver-reviewer/codeweaver-reviewer-statics.ts`
step 2, and/or the `get-quest` responder.

**Edit (prompt half):** move the `flowId` requirement into the code fence itself, so the fence and the
brief line are adjacent:
```
get-quest({ questId: 'QUEST_ID', flowId: '<the FLOW: line in your brief — copy it exactly>' })
# Your brief's FLOW: line is `send-message-with-images`-shaped. Never omit it. Never substitute packageName for it.
```
**Edit (tool half, stronger):** have `get-quest` reject a call carrying neither `flowId` nor
`packageName` from a `codeweaver-reviewer` caller, with a message naming the brief's `FLOW:` line.
A bold sentence three lines above the call site did not hold; the same defence that works elsewhere
in this codebase is a refusal.

**Estimated saving:** 61,689 bytes, about 15,422 tokens for every reviewer that repeats this. Whether the
other six codeweaver cells' reviewers did the same is not measurable from this transcript — but the
spill risk the prompt itself names applies to all of them, and it grows with the quest.

### Fix 8 — Give the operator a durable channel for its carry-forwards (§3.5)

**File:** `codeweaver-prompt-statics.ts`, step 8 (`### 8. Record what you claim, and what you found`).

**Edit:** the prompt currently sends findings to `signal-back`, which has no field for them. Point
them at the channel that exists instead — `modify-quest`'s `planningNotes.questNotes[]`
(`kind: 'open-question' | 'out-of-scope'`, with `role`, `workItemId`, `flowId`, `summary`, `detail`).
Add to step 8: `**A finding for another cell goes on the quest, not in your signal.** `signal-back`
carries no note field. Write one `questNotes[]` entry per carry-forward with `modify-quest` — the
seam you assumed, the sibling cell that has to honour it, and anything a sub-agent did that the next
operator should brief against.` Then fix step 7's `copy its FINDINGS: into your signal` to say
`copy its FINDINGS: into a questNotes[] entry at step 8`.

**Estimated saving:** not measurable in minutes on this item, because the seam note happened to ride
into git on the map file. It is a correctness fix: the operator wrote two carry-forwards the server
cell — which ran 41 minutes later against the same node — could not read.

### Fix 9 — Serve the three standards blobs once per quest, not once per session (§5 finding 7)

**File:** the MCP layer behind `get-architecture` / `get-syntax-rules` / `get-testing-patterns`
(`packages/mcp/src/responders/architecture/…`).

**Edit:** two options, in increasing order of effort. (a) Trim `get-testing-patterns` — it is 48,698
bytes against a 50,000-byte ceiling, so it is one added paragraph from spilling silently, and it is
loaded 6 times per cell. (b) Have the three tools return a short digest plus a repo-relative path,
and let a session `Read` the full text only where it is about to write in an unfamiliar folder type.

**Estimated saving:** (a) is a safety fix with no token saving but removes a live spill risk.
(b) would cut roughly 90,371 bytes × 5 sessions, about 113,000 tokens of one-time load per cell, and far more in
replayed cache_read.

### Fix 10 — Add a "swap the tool, don't re-test the block" line to the reviewer prompt (§5 finding 5)

**File:** `codeweaver-reviewer-statics.ts`, in the `## Rules` block beside `[GIT]`.

**Edit:** one paragraph mirroring the operator's `[WALL]` wording — `**Native `grep`, `find`, `sed`,
Glob and Search are blocked by a hook in this repo, and no retry clears it.** `Read` with an offset,
`discover` and `python3 -c` do the same jobs. A `BLOCKED: Native search tools are disabled` reply is
not a wall and is not worth re-testing.`

**Estimated saving:** roughly 10 s and two turns per reviewer. Smallest fix on the list; included because it
is one paragraph and the reviewer prompt is the only one of the family missing it.

---

## 7. Raw figures appendix

### `python3 tmp/transcript-digest.py summary b3d97d99-7007-4951-b58e-e6006b46f222`

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/b3d97d99-7007-4951-b58e-e6006b46f222.jsonl
LINES     299
START     2026-09-01T19:09:06.542000+00:00
END       2026-09-01T19:33:32.460000+00:00
WALL      0:24:25.918000  (24.4 min)
TYPES     {'queue-operation': 14, 'attachment': 79, 'user': 65, 'last-prompt': 19, 'atis-latch': 18, 'assistant': 104}
MODELS    {'claude-opus-5': 104}

TOKENS (this transcript only, excludes subagents)
  assistant API responses : 104
  input (uncached)        : 208
  cache_read              : 14,500,661
  cache_creation          : 654,866
  output                  : 107,599
  of which thinking       : 51,539
  TOTAL context-in        : 15,155,735

TOOL CALLS (59 total)
     27  Read
     10  mcp__dungeonmaster__discover
      6  Bash
      5  Agent
      2  ToolSearch
      1  mcp__dungeonmaster__get-agent-prompt
      1  mcp__dungeonmaster__get-quest
      1  mcp__dungeonmaster__get-architecture
      1  mcp__dungeonmaster__get-syntax-rules
      1  mcp__dungeonmaster__get-testing-patterns
      1  mcp__dungeonmaster__get-project-inventory
      1  Write
      1  mcp__dungeonmaster__modify-quest
      1  mcp__dungeonmaster__signal-back

TOOL RESULT BYTES fed back: 280,342

SUBAGENTS 6  (run `subagents` subcommand for the roster)
```

### `python3 tmp/transcript-digest.py subagents b3d97d99-7007-4951-b58e-e6006b46f222`

```
09-01 19:13:47  +   2.0m  agent-aae887e3fc69721ac  general-purpose/sonnet  turns= 24 out=7,103 ctx-in=1,508,461
           desc: Add pasted-image statics
           tools: {'ToolSearch': 1, 'Read': 3, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Bash': 3, 'Write': 3, 'Edit': 1}
09-01 19:13:59  +   1.9m  agent-a48efcd3f5ddf7325  general-purpose/sonnet  turns= 20 out=3,869 ctx-in=1,152,024
           desc: Add quest imagesDir location
           tools: {'ToolSearch': 1, 'Read': 2, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Edit': 2, 'Bash': 3}
09-01 19:16:38  +   2.9m  agent-a5c460d22fb3ee2fc  general-purpose/sonnet  turns= 33 out=12,155 ctx-in=2,169,535
           desc: Add pasted-image media type contract
           tools: {'ToolSearch': 1, 'Read': 6, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Bash': 4, 'Write': 3, 'Edit': 1, 'Agent': 1}
09-01 19:18:31  +   0.7m  agent-ab27b38f085122c04  Explore/None  turns= 14 out=1,939 ctx-in=287,810
           desc: Find import order convention example
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 4, 'Read': 3}
09-01 19:20:21  +   5.2m  agent-acafb4083d5b6bf67  general-purpose/sonnet  turns= 49 out=20,715 ctx-in=4,249,967
           desc: Add pasted-image upload contract
           tools: {'ToolSearch': 2, 'Read': 11, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Bash': 7, 'Write': 4, 'mcp__dungeonmaster__discover': 1, 'Edit': 1}
09-01 19:26:28  +   6.7m  agent-a1a91a783b07cf132  general-purpose/sonnet  turns= 65 out=22,142 ctx-in=7,007,077
           desc: Review shared slice
           tools: {'ToolSearch': 3, 'mcp__dungeonmaster__get-agent-prompt': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__get-quest': 2, 'Bash': 13, 'mcp__dungeonmaster__discover': 5, 'Read': 11}

SUBAGENT TOTALS  agents=6 turns=205 output=67,923 context-in=16,374,874
```

### Traceability for every other number quoted above

| Figure | Command / source |
|---|---|
| Rendered prompt 31,940 chars, 593 lines, `model: opus`, 4-line Operation Context, `Seams` 0 / `Shared homes` 0 | `python3 tmp/transcript-digest.py result b3d97d99-7007-4951-b58e-e6006b46f222 get-agent-prompt --max-chars 40000`, then `json.loads` of the payload |
| Prompt identical to HEAD statics | `difflib` of `codeweaver-prompt-statics.ts` template (with `$ARGUMENTS` substituted) vs the rendered prompt — 14 diff lines, all inside my own truncated extraction of `spilledToolResultStatics.markdown` |
| `codeweaverScopeBlockTransformer` has no caller | `os.walk('packages')` + regex `codeweaverScopeBlockTransformer` → 2 hits, both in its own folder; plus a full read of `work-item-to-prompt-transformer.ts` |
| `mcpToolResultStatics.maxVerbatimChars: 50_000` | `packages/shared/src/statics/mcp-tool-result/mcp-tool-result-statics.ts` |
| `signalBackInputContract` is `.strict()` with no note field | `packages/mcp/src/contracts/signal-back-input/signal-back-input-contract.ts` and its server twin |
| `roleToModelStatics.codeweaver = 'opus'` | `packages/orchestrator/src/statics/role-to-model/role-to-model-statics.ts` |
| Work item record (`dependsOn`, `startRef`, `attempt`, `retryCount`, timestamps) | `json.load` of `.dungeonmaster/guilds/21523917-83f7-4e23-a6de-8db1cae2ad96/quests/1be07040-b9ec-476c-a439-0b4fbb0123cd/quest.json`, `workItems[]` filtered to `ac2b5262-…` |
| Flow node/edge counts, package tags, observable `package: 'shared'` | same `quest.json`, `flows[send-message-with-images]` |
| `get-quest` 27,330 chars and its 5 section sizes | `python3 tmp/transcript-digest.py result b3d97d99-… get-quest --max-chars 30000`, section offsets by `str.find` |
| Operator tool-result sizes (`get-architecture` 19,066 / `get-syntax-rules` 24,538 / `get-testing-patterns` 51,411 / `get-project-inventory` 11,082 / `modify-quest` 65 / `signal-back` 345, JSON-encoded) | `python3 tmp/transcript-digest.py result b3d97d99-… <tool> --max-chars 1` per tool |
| Sub-agent tool-result sizes (`get-architecture` 18,025 / `get-syntax-rules` 23,648 / `get-testing-patterns` 48,698 / `get-agent-prompt` 20,648 / `get-quest` 35,631 + 26,058, raw `tool_result.content` text) | raw-JSONL extraction by the sub-agent analysts; smaller than the digest figures because the digest reports the JSON-encoded envelope |
| No spilled tool results | `ls <sessionId>/tool-results/` → `No such file or directory` |
| Reviewer's 13 Bash commands, their timestamps, the two `get-quest` calls, the blocked `find`/`grep` | `timeline agent-a1a91a783b07cf132 --parent b3d97d99-…` plus raw-JSONL call/result timestamp pairing |
| Reviewer's dispatch brief (`OPERATION: / FLOW: / PACKAGE:`) | `prompts agent-a1a91a783b07cf132 --parent b3d97d99-…` |
| Builder briefs, `git -C` / `&&` trap counts (1 each in all 4), `no npm run build` (1 each in all 4) | `prompts agent-<id> --parent b3d97d99-…` for each of the four |
| `npm run build --workspace=@dungeonmaster/shared` at `19:18:36.750Z`; `npm run build 2>&1 \| tail -50` at `19:23:58.207Z`, exit 0 logged at +264.8 s | raw-JSONL Bash `tool_use` extraction from `agent-a5c460d22fb3ee2fc` and `agent-acafb4083d5b6bf67` |
| Depth-2 brief and its discarded answer | `prompts agent-ab27b38f085122c04 --parent b3d97d99-…`; parent's own text in `agent-a5c460d22fb3ee2fc` |
| Commit `bebca45c3`, 13 files / 354 insertions, full body | `git log -n 1 bebca45c3` and `git show --stat --format='' bebca45c3` in the quest worktree |
| Map file, 3,834 bytes / 53 lines | `Read` of `worktrees/try-2-…-1be07040/.quest-plans/f21eacd1-3a1b-492e-83e1-aaf7581aa3b0-map.md` |
| Ward result (lint 4/4, typecheck 6125/6125 across 12 packages, unit 39/39, integration 39/39, run `1788291117878-b53f`, 12.6 s) | the reviewer's return block, quoted verbatim in the commit body |
| Red-then-green ward run `1788290082935-c5f6` | `agent-a48efcd3f5ddf7325` transcript, +42.8 s and +51.8 s |
| `locations-statics.test.ts` line 5 = `toStrictEqual` open, line 46 = `imagesDir: 'images'` | `Read` of the file in the quest worktree |

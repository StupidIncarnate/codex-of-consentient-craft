# Work item 09 — codeweaver — web / render-images-in-transcript

## 0. Identity

| Field | Value |
|---|---|
| Work item id | `71c1fd22-93e9-4b28-afad-f937fffbb039` |
| Operation item id | `332e0da3-47aa-4f78-b3eb-15fbded0bdfe` |
| Session id | `26055f5a-7478-40b4-8e2d-ade03dec05c5` |
| Role | `codeweaver` (operator) |
| Model | `claude-opus-5` (`MODELS {'claude-opus-5': 152}`) |
| Operation text | `Codeweaver: build this slice — package: web · flow: render-images-in-transcript` |
| `dependsOn` | `["7546da90-f77b-479a-9b70-96802f47bc2f"]` (work item [8], web / send-message-with-images) |
| Status | `complete`, `actualSignal: "complete"`, `operationStatus: "done"` |
| `startRef` | `3275de52b05889760bb1da5f6cfc469b39316a7d` |
| `attempt` / `retryCount` | `0` / `0` — no pt-N continuation, one pass |
| Commit produced | `9f8ab692a` (by the reviewer, not the operator) |

Window: `createdAt 2026-09-02T06:39:48.811Z` leads to `completedAt 2026-09-02T08:28:53.059Z`.
Transcript window `06:40:05.030Z` leads to `08:29:04.424Z` = **1:48:59.394 (109.0 min)**.

**Sub-agents: 27.** 16 dispatched by the operator itself, 11 dispatched by three of those
sub-agents (grandchildren). Models, from the `.meta.json` files:

- **sonnet — 13**: the 2 `Explore` mappers, the 10 code-writing `general-purpose` agents, and the
  `codeweaver-reviewer`.
- **haiku — 1**: `agent-af34fd5cc33f4387d` "Locate pastedImageStatics file" (a grandchild).
- **no `model` field (inherited) — 13**: every other grandchild search agent.

The operator passed `model: "sonnet"` on all 16 of its own dispatches, as the prompt requires.

---

## 1. Chronological breakdown — where the time went

| # | Clock (UTC) | Elapsed | Min | What happened | Evidence |
|---|---|---|---|---|---|
| 1 | 06:40:05–06:44:29 | 0.0–4.4m | 4.4 | Fetch prompt, `get-quest({flowId,packageName})`, the three standards tools, `git log --oneline -n 25`, `git show --stat --name-only` on both prior web commits, 4 `discover` calls, 6 `Read`s. Two `Explore` mappers dispatched at 1.6m/1.7m. | `0.3m CALL mcp__dungeonmaster__get-quest(questId=… packageName=web)`; `1.6m CALL Agent(description=Map optimistic dedup path …)` |
| 2 | 06:44:29–06:45:11 | 4.4–5.1m | 0.7 | Writes the map. 101 lines, exactly the prompt's GROUP/PROVES/TRAPS shape. | `5.1m CALL Write(file_path=…/.quest-plans/332e0da3-47aa-4f78-b3eb-1…)` |
| 3 | 06:45:11–06:47:23 | 5.1–7.3m | 2.2 | Group 1 out — 4 `Agent` calls in one message, then a turn ended on a plain message. | `7.2m say: "Group 1 is out — four sub-agents running in parallel. Ending my turn while they work"` |
| 4 | 06:47:23–06:59:35 | 7.3–19.5m | 12.2 | **10.4m idle** on group 1; routes 4 returns; 2 `modify-quest` sign-off writes (7 observables); group 2 out (parser 16.8m, guard 19.4m). | gaps `212s`, `252s`, `98s`, `189s`; `16.0m say: "Three back, all pass."` |
| 5 | 06:59:35–07:06:17 | 19.5–26.2m | 6.7 | **5.0m idle** on group 2; reads the parser's signature; group 3 (the renderer) out at 26.1m. | `24.7m say: "Group 2 complete. Reading the parser's exact signature before briefing the renderer."` |
| 6 | 07:06:17–07:39:00 | 26.2–58.9m | **32.7** | **Pure idle.** One sub-agent, `agent-a05f88384e57ff529`, held the whole session. | `58.9m ### INJECTED PROMPT: <task-id>a05f88384e57ff529</task-id> … <status>completed</status>` with `GAP 1989s` |
| 7 | 07:39:00–07:41:17 | 58.9–61.2m | 2.3 | Signs 12 observables + 1 terminal node; group 4 out (2 agents). | `modify-quest #3 ts=2026-09-02T07:40:02.888Z signoffs: observables=12 nodes=1 edges=0` |
| 8 | 07:41:17–07:58:41 | 61.2–78.6m | 17.4 | **16.7m idle** on group 4 (`437s` + `565s`); group 5 out at 78.6m. | `68.5m say: "The bubble mount passed. Waiting on the binding edit before the last group."` |
| 9 | 07:58:41–07:59:45 | 78.6–79.7m | 1.1 | **The edge-id hunt.** `ls` blocked outside the worktree, a `discover` for a flow-edge contract, a `ToolSearch`, then a bare `get-quest({questId})` that spilled 263,665 chars to a file, then 3 `python3 -c` calls to parse the raw quest JSON. | `79.0m say: "Edge ids are author-chosen, and the quest file sits outside my worktree. Fetching the quest as JSON to read them."` |
| 10 | 07:59:45–08:12:11 | 79.7–92.1m | 12.4 | Signs the first edge, dispatches two more agents (`Confirm overlay close-button unit`, `Close the overlay from transcript`), **10.2m idle** (`285s` + `322s` + `37s`), signs 5 observables + 4 edges. | `modify-quest #4 … edges=1`; `modify-quest #7 ts=…08:12:09.214Z … observables=5 nodes=0 edges=4` |
| 11 | 08:12:11–08:13:11 | 92.1–93.1m | 1.0 | **Step 5, the diff read.** `git status --porcelain`, `git diff --stat`, one scoped `git diff` over the product files, one `Read`. Finds the real gap. | `92.5m say: "Product code fits together. One real gap against the design decision: the broken placeholder is an invisible empty box."` |
| 12 | 08:13:11–08:19:23 | 93.1–99.3m | 6.2 | **5.9m idle** on the placeholder fixer; re-reads `git diff --stat` + the widget; signs 2 more; dispatches the reviewer. | `99.3m say: "Diff read, everything fits. Running my reviewer."` |
| 13 | 08:19:23–08:28:17 | 99.3–108.2m | 8.9 | **Idle** — the reviewer builds, wards, commits, pushes. | gap `529s`; `99.3m say: "Ending my turn until it reports."` |
| 14 | 08:28:17–08:29:04 | 108.2–109.0m | 0.8 | Signs 4 remaining units, `git status --porcelain`, `get-quest` to verify every unit carries a verdict, `signal-back`, final summary. | `108.7m say: "Every unit carries a verdict — 24 confirmed, 5 unconfirmable, no blanks."` |

Phases sum: `4.4+0.7+2.2+12.2+6.7+32.7+2.3+17.4+1.1+12.4+1.0+6.2+8.9+0.8 = 109.0` min. ✔

### Time by category

The idle figure is the sum of the fourteen `GAP` values the timeline prints on the line after each
`### INJECTED PROMPT: <task-notification>`:
`212+252+18+98+189+113+1989+437+565+285+322+37+353+529 = 5,399 s = 90.0 min`.

| Category | Minutes | % of 109.0 | How measured |
|---|---|---|---|
| Sub-agent dispatch — **waiting** (turn ended, nothing to do) | **81.2** | 74.5% | 90.0 total idle minus the reviewer's 8.8 |
| Review cycle (waiting on `codeweaver-reviewer`) | 8.8 | 8.1% | the `529s` gap at 107.9m |
| Brief composition + `Agent` dispatch | 6.7 | 6.1% | active spans containing `CALL Agent` |
| Orientation / reading | 4.4 | 4.0% | phase 1 |
| Routing returns + `modify-quest` sign-offs | 3.9 | 3.6% | the 14 post-notification active blocks |
| Verification (step 5 `git diff` reads) | 1.3 | 1.2% | phases 11 + the 99.0m re-read |
| **Idle-or-stall (edge-id hunt — a tooling gap)** | 1.1 | 1.0% | phase 9 |
| Planning (writing the map) | 0.7 | 0.6% | phase 2 |
| Final signal + verify | 0.5 | 0.5% | phase 14 |

**Parent-active total: 19.0 min of 109.0.** The operator itself ran no build, no ward and no test,
and edited no file but its own map — full compliance with `[BUILD]` and the YOURS/NOT YOURS block.

---

## 2. Chronological token buckets

`python3 tmp/transcript-digest.py buckets 26055f5a-7478-40b4-8e2d-ade03dec05c5 --minutes 6`

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/26055f5a-7478-40b4-8e2d-ade03dec05c5.jsonl
LINES     453
START     2026-09-02T06:40:05.030000+00:00
END       2026-09-02T08:29:04.424000+00:00
WALL      1:48:59.394000  (109.0 min)

BUCKETS of 6 min
WINDOW              APIs  CALLS   OUT-TOK    CTX-IN-TOK  RESULT-BYTES  TOP TOOLS
09-02 06:40-06:46    48     28   112,063     6,074,874       343,346  mcp__dungeonmaster__discoverx8, Readx7, Bashx3, Agentx3
09-02 06:46-06:52    10      5    33,647     2,302,825        26,530  Agentx3, Readx2
09-02 06:52-06:58     6      2    28,005     1,451,211         9,175  mcp__dungeonmaster__modify-questx1, Agentx1
09-02 06:58-07:04    13      5    22,477     3,329,642        13,496  Readx3, mcp__dungeonmaster__modify-questx1, Agentx1
09-02 07:04-07:10     7      2    21,213     1,860,281        18,284  Readx1, Agentx1
09-02 07:34-07:40     3      1    15,825       825,975            55  mcp__dungeonmaster__modify-questx1
09-02 07:40-07:46     3      2    12,945       849,392        17,073  Agentx2
09-02 07:46-07:52     2      0       980       580,762             0  
09-02 07:52-07:58     2      0     9,300       585,784             0  
09-02 07:58-08:04    18     10    28,498     5,435,831        22,481  Bashx4, Agentx2, mcp__dungeonmaster__discoverx1, ToolSearchx1
09-02 08:04-08:10     4      2    10,996     1,248,388         6,239  mcp__dungeonmaster__modify-questx1, Agentx1
09-02 08:10-08:16    17      7    26,493     5,529,306        27,051  Bashx3, mcp__dungeonmaster__modify-questx2, Readx1, Agentx1
09-02 08:16-08:22     8      4     3,929     2,725,841         3,582  Bashx1, Readx1, mcp__dungeonmaster__modify-questx1, Agentx1
09-02 08:22-08:28     0      0         0             0             0  
09-02 08:28-08:34    11      4    16,494     3,843,594        25,762  mcp__dungeonmaster__modify-questx1, Bashx1, mcp__dungeonmaster__get-questx1, mcp__dungeonmaster__signal-backx1
```

Note the four buckets the tool omits entirely — `07:10-07:16`, `07:16-07:22`, `07:22-07:28`,
`07:28-07:34`. Zero main-session API calls in 24 consecutive minutes; that is the middle of the
32.7-minute renderer wait.

### Sub-agent spend, attributed to the bucket each sub-agent STARTED in

| Bucket | Sub-agents started | Sub-agent OUT | Sub-agent CTX-IN |
|---|---|---|---|
| 06:40-06:46 | ae447362c17e68ce4, ab1da6285a12fbf58, aefcc8ebb3536a20e | 48,519 | 11,259,316 |
| 06:46-06:52 | afd618adc069b207a, a045f135b418ab40b, a306e8fddc09c709a | 106,967 | 29,051,219 |
| 06:52-06:58 | a6c17516ba1867b19 | 47,176 | 5,482,704 |
| 06:58-07:04 | aa4dfcc071db51f5d | 9,792 | 2,798,840 |
| 07:04-07:10 | a05f88384e57ff529, a6b28196b0d06b573, ac11ba5f5deddabcf | 120,759 | 18,614,466 |
| 07:10-07:16 | ac4bf1f98cd3ec0e6, a1d52d5555e01ef88 | 10,339 | 1,175,736 |
| 07:16-07:22 | af0d2de8d5c0c7795 | 17,795 | 3,453,415 |
| 07:22-07:28 | a1fa0ee8c6f79e253 | 10,931 | 2,130,174 |
| 07:34-07:40 | a439822aae06376f0 | 14,727 | 3,197,924 |
| 07:40-07:46 | a4aad8da7dcef1ab2, a735db5a35e4168d3, aaa27f462b44f55a8, aa7312d077ec89839 | 103,865 | 32,035,437 |
| 07:58-08:04 | af5bcf994c5e251e6, a2a1f6330301e460c, a88585a28327d5a7f, af34fd5cc33f4387d | 76,593 | 20,117,614 |
| 08:04-08:10 | afce78981dd05286b | 13,915 | 3,077,840 |
| 08:10-08:16 | a597b4e04f3a6cbbe | 23,926 | 3,714,917 |
| 08:16-08:22 | a28d1d97ee8b0d513 (the reviewer) | 45,729 | 17,626,623 |
| **Total** | **27** | **651,033** | **153,736,225** |

Both column totals reconcile exactly with `SUBAGENT TOTALS agents=27 turns=1290 output=651,033
context-in=153,736,225`.

### Totals, with `cache_read` and `cache_creation` kept apart

| | responses | input (uncached) | cache_read | cache_creation | **context-in** | output |
|---|---|---|---|---|---|---|
| Main session | 152 | 304 | 35,577,474 | 1,065,928 | **36,643,706** | 342,865 (118,671 thinking) |
| 27 sub-agents | 1,290 | 2,652 | 143,036,152 | 10,697,421 | **153,736,225** | 651,033 |
| **Grand total** | **1,442** | **2,956** | **178,613,626** | **11,762,349** | **190,379,931** | **993,898** |

`cache_read` is 93.8% of all context-in (`178,613,626 / 190,379,931`); `cache_creation` is 6.2%.
The main session's ratio is more extreme still — 97.1% cache_read — which is what an operator that
ends its turn and is re-entered by notifications looks like: the same roughly 350k prompt re-read 152 times.

Sub-agents burned **1.90×** the operator's output tokens and **4.19×** its context-in.

Per-agent detail for the seven heaviest (computed from each `subagents/agent-*.jsonl`):

| Agent | responses | cache_read | cache_creation | context-in | output |
|---|---|---|---|---|---|
| `a05f88384e57ff529` Build transcript image renderer | 76 | 13,925,223 | 836,650 | 14,762,025 | 103,853 |
| `aaa27f462b44f55a8` Drop the duplicate bubble | 121 | 23,074,497 | 858,499 | 23,933,238 | 69,958 |
| `a28d1d97ee8b0d513` **the reviewer** | 113 | 17,008,393 | 618,004 | 17,626,623 | 45,729 |
| `af5bcf994c5e251e6` Prove one bubble on both routes | 82 | 14,242,223 | 1,051,184 | 15,293,571 | 56,169 |
| `afd618adc069b207a` Add chat-content normaliser | 54 | 7,244,691 | 784,150 | 8,028,949 | 60,660 |
| `a306e8fddc09c709a` Cover overlay close paths | 101 | 10,594,913 | 366,156 | 10,961,271 | 24,185 |
| `a045f135b418ab40b` Add pasted-image memory state | 83 | 9,609,760 | 451,073 | 10,060,999 | 22,122 |

---

## 3. Was the prompt fit for the work?

### 3a. The rendered prompt vs the static template

`python3 tmp/transcript-digest.py result 26055f5a-7478-40b4-8e2d-ade03dec05c5 get-agent-prompt`
returns a 33,708-character payload. Its body is `codeweaverPromptStatics.prompt.template` verbatim.
The only substitution is `$ARGUMENTS`, and it rendered as four lines and nothing else:

```
## Operation Context

Quest ID: 1be07040-b9ec-476c-a439-0b4fbb0123cd
Work Item ID: 71c1fd22-93e9-4b28-afad-f937fffbb039
Operation Item ID: 332e0da3-47aa-4f78-b3eb-15fbded0bdfe
Your operation item: [codeweaver] Codeweaver: build this slice — package: web · flow: render-images-in-transcript
```

Grepping the whole 34,130-character recovered payload:

```
Seams            -> 0
Shared homes     -> 0
Work item context-> 0
packagesAffected:-> 0
packageNames:    -> 0
wardMode         -> 0
```

**`codeweaverScopeBlockTransformer` never ran.** It is written, documented at length, and
unit-tested — and it has no production caller. A repo-wide scan for its identifier returns only
`codeweaver-scope-block-transformer.ts` and its own `.test.ts`; `workItemToPromptTransformer`
(`packages/orchestrator/src/transformers/work-item-to-prompt/work-item-to-prompt-transformer.ts`)
builds `parts` from four `contentTextContract.parse(...)` lines plus three role-specific extras
(siegemaster's dev server, warpgate's base branch, spiritmender's ward blob) and nothing else.
`workItemContextBlockTransformer` is in the same state.

The consequence is concrete. Step 5 asks the operator:

> **4. Does the seam hold?** Where your flow's node names another package too, your half has to
> match what that package's half expects. If that half is not built yet, write down what you
> assumed.

The transformer that exists to answer "whose half is the other side, and has it run" produced
nothing, so the operator answered it by hand: at 0.9m it ran `git show --stat --name-only 3275de52b`
and `git show --stat --name-only 061e49064` to reconstruct what the two prior web cells had landed.
That worked — the `git log` instruction in step 2 covers the same ground — but it is a reconstruction
of a fact the ledger already held.

### 3b. The step script matched the work well

The nine-step script fits this cell almost exactly, and the operator ran it in order with no
deviation. The evidence for each:

- **Step 1** — one call, correctly parameterised: `0.3m CALL mcp__dungeonmaster__get-quest(questId=…
  packageName=web)` with `flowId: 'render-images-in-transcript'`. 24,017 characters, inline, well
  under the ceiling. The operator immediately read the prompt's contract rule correctly:
  `0.8m say: "No '## Contracts' heading in that render — so my cell is observables, terminals, and
  labelled edges only."`
- **Step 3's map** is the shape the prompt specifies, down to the section names:

  ```
  GROUP 1  (independent files)
    packages/web/src/contracts/transcript-segment/transcript-segment-contract.ts        new   — zod discriminated union: …
  …
  PROVES
    #check-patterns-come-from-shared          -> (read-check) reviewer opens normalise-chat-content-transformer.ts
  ```

  Five groups, ordered by dependency (contracts and statics first). It also names the units it
  cannot prove — the prompt's "Name the observables you cannot prove here, and why" — which is why
  the final tally was `24 confirmed, 5 unconfirmable, no blanks` rather than blanks.
- **Step 4's brief shape** was followed on all 13 code briefs. Measured directly from the tool
  inputs: `code briefs=13  with [GIT FORMS] traps=13  with PROVE=13  with MUST BE TRUE=13`. The
  renderer's brief closes exactly as the template dictates:

  ```
  PROVE
    npm run ward -- --only lint,test -- packages/web/src/widgets/chat-message/image-content-layer-widget.tsx …
    no npm run build · no run-ward MCP tool · no commit · never widen the ward
  ```
- **Step 4's "sign this group's PROVED lines NOW"** was honoured wave by wave rather than batched
  at the end: nine `modify-quest` writes at 06:56, 06:59, 07:40, 07:59, 08:04, 08:10, 08:12, 08:19
  and 08:28, carrying 34 observable, 1 terminal-node and 5 edge sign-offs.
- **Step 6's reviewer brief** is the exact five-line form, including the `READ-CHECKS:` line the
  prompt says to add and no `workItemId`:

  ```
  Call get-agent-prompt({ agent: 'codeweaver-reviewer', questId: '1be07040-b9ec-476c-a439-0b4fbb0123cd' }) FIRST, then follow what it returns exactly.
  OPERATION: 332e0da3-47aa-4f78-b3eb-15fbded0bdfe
  FLOW: render-images-in-transcript
  PACKAGE: web
  READ-CHECKS: check-patterns-come-from-shared
  ```

### 3c. Three places the prompt asked for something the tools cannot supply

**(i) Edge sign-offs need an edge id the flow render never prints.** "Recording what you claim"
demands:

> **A terminal unit's sign-off goes on the NODE itself, and a branch unit's on the EDGE** … `edges: [ { id: '<the labelled edge id>',  codeweaverSignoff: { … } } ]`

The render the prompt told it to fetch draws labelled edges like this — label and TARGET NODE, no id:

```
              →"no transcript entry yet" [#render-from-memory]
              →"transcript entry present" [#drop-optimistic]
                      →"missing, unreadable or not an image" [#image-not-served] [C✓]
```

Source: `packages/shared/src/transformers/flow-graph-to-text/flow-graph-to-text-transformer.ts`
lines 275 and 281 —
`` `${indent}${SYM.indent}${SYM.rightArrow}${labelPart}[#${String(toId)}]${edgeSignoffMarker}` ``.
The line even carries a sign-off MARKER (`[C✓]`) while withholding the id you would need to write
one. The operator hit this at 78.6m and spent 1.1 minutes and roughly 2,750 output tokens getting
around it — `ls` refused, a speculative `discover(glob=packages/*/src/contracts/*flow-edge*/**)`,
a `ToolSearch`, a bare `get-quest({questId})` that blew the result ceiling
(`Error: result (263,665 characters across 4,359 lines) exceeds maximum allowed tokens`), and three
`python3 -c` calls against the spilled file. It signed its first edge 4 seconds after finishing
(`modify-quest #4 ts=2026-09-02T07:59:45.710Z … edges=1`).

**(ii) Step 7 tells the operator to put the reviewer's FINDINGS somewhere that does not exist.**

> | `pass` | go to step 8, and copy its `FINDINGS:` into your signal — anything it named for someone else survives nowhere else |

`signalBackInputContract` (both `packages/mcp/…` and `packages/server/…`) is `.strict()` and has
exactly five keys: `questId`, `workItemId`, `signal`, `operationItemId`, `operationStatus`,
`blockedReason`. There is no findings field, and a strict schema rejects an extra one. The contract's
own comment says so: `// note field — the next-session handoff is the git commit message, not the
ledger.` This pass got away with it — the reviewer returned `FINDINGS: none outstanding` — and the
operator's signal was the minimum legal payload:

```json
{"questId":"1be07040-…","workItemId":"71c1fd22-…","signal":"complete",
 "operationItemId":"332e0da3-…","operationStatus":"done"}
```

**(iii) The `[BUILD]` rule is stated in the operator's prompt and in every brief, and it is
overridden in practice by a session snippet the operator does not control.** Detail in finding 1
below. The operator itself obeyed it perfectly; 14 of its 27 sub-agents did not, and their own words
name the snippet as the reason.

### 3d. Nothing in the prompt was ignored by the operator

Checked against the YOURS / NOT YOURS block: 0 `Edit` calls, 1 `Write` (the map, at the mandated
`.quest-plans/<operationItemId>-map.md` path), 0 `npm run build`, 0 `npm run ward`, 0 `git add`,
`commit`, `push`, `stash`, `reset`, `checkout`, `clean` or `rebase`, 0 `git -C`, 0 piped or chained
git call, 0 `sleep`, 0 poll, 1 `signal-back` as the last action. `[HELPERS]` was followed literally
— every wait ends with a plain message and no tool call (`7.3m say: "Group 1 is running. Ending my
turn — the completion notifications will bring me back to route the returns and send group 2."`).

---

## 4. What went well

**1. The turn-ending discipline was total, and it is the reason 90 idle minutes cost nothing.**
Fourteen waits, fourteen turn-ends on a plain message, zero polls and zero sleeps. The four
consecutive empty buckets (`07:10` through `07:34`) are the proof: 24 minutes of wall clock, 0 API
calls, 0 tokens. Compare the ward-discipline note in `CLAUDE.md` recording another quest where two
reviewers burned 815 seconds on `sleep 90` / `sleep 240`. Mechanism: the `[HELPERS]` rule plus the
concrete instruction "With everything you can do done and a helper still out, end your turn on a
plain message and no tool call."

**2. Step 5 found a defect that every one of its own tests was blind to — in 1.0 minute.**
At 92.5m, after `git status --porcelain`, `git diff --stat`, one scoped `git diff` and one `Read`:

> `92.5m say: "Product code fits together. One real gap against the design decision: the broken placeholder is an invisible empty box."`

The operator's own closing summary says exactly why the tests missed it:

> The broken-image placeholder was a 32-by-32 box with no paint — invisible on screen. Every
> observable about it passed, because they all measure the box.

It dispatched `agent-a597b4e04f3a6cbbe` "Make broken placeholder visible", which added a `danger`
border and a `bg-deep` fill **asserted as exact colour strings**. Cost: 5.9 min idle, 23,926
sub-agent output tokens, 3,714,917 context-in. Mechanism: the prompt's "Four questions, and only
you can ask them, because only you hold the whole cell", combined with reading the DIFF rather
than the tree — the whole read fit in one minute.

**3. Wave-by-wave signing kept the evidence fresh.** Nine `modify-quest` writes spread across the
session rather than one at the end. The largest, at 07:40:02, carried 12 observables and 1 terminal
node in 8,092 bytes — transcribed from `agent-a05f88384e57ff529`'s return minutes after it landed.
The prompt's own justification ("Left to step 8 you would be transcribing dozens of units from
returns that scrolled past long ago") is borne out: the end-of-session write at 08:28:32 carried
only 4 units.

**4. The reviewer was correctly and cheaply run.** One `npm run build` as its own unpiped command
(`08:24:54`, exit 0 in 24 s), then one `npm run ward -- --staged` (`08:25:20`, 59.7 s), both with
`timeout: 600000` in the foreground — the prompt allows two rounds and it needed one. It settled the
`(read-check)` observable with a real `file:line`:

> `check-patterns-come-from-shared — HOLDS · normalise-chat-content-transformer.ts:15,18,26,31 and parse-transcript-segments-transformer.ts:17,30,38-39 both import pastedImageStatics from @dungeonmaster/shared/statics … absence would look like a locally-declared regex literal (e.g. a bare `/\[Pasted Image (\d+)\]/` in either file)`

Then `git add -A`, one commit with the whole return block in the body, one bare `git push`. Total
8.6 min, 45,729 output tokens.

**5. Five units were recorded `unconfirmable` rather than signed off a mock.** The final message:

> The five all need a real browser … jsdom performs no layout, so `getBoundingClientRect` is all
> zeros. The declared style values are asserted; the painted result is not.

That is the "Never sign one your test proves against a MOCK" rule working, and it is what leaves the
siegemaster something honest to walk.

---

## 5. What agents did that they should not have

### Finding 1 — 16 forbidden `npm run build` runs by 14 sub-agents, several of them concurrent

**What happened.** Every code-writing sub-agent brief carried `no npm run build` in its `PROVE`
block (verified: 13/13). The operator's own prompt carries `[BUILD] You run no build, no ward and no
test of any kind`, with the reason: *"`tsc` writes one shared `dist/` per package and ward's typecheck
is `tsc -b`, which builds — so a second builder hands every sibling session type errors on correct
code."* Fourteen sub-agents built anyway, 16 times:

```
agent-a045f135b418ab40b | 06:49:33 | 'npm run build 2>&1 | tail -60'  | Build the repo before running ward
agent-aefcc8ebb3536a20e | 06:48:37 | 'npm run build 2>&1 | tail -30'  | Build the repo to ensure dist is current before ward
agent-a306e8fddc09c709a | 06:50:55 | 'npm run build 2>&1 | tail -30'  | Build the repo before running ward
agent-afd618adc069b207a | 06:57:12 | 'npm run build 2>&1 | tail -30'  | Build the repo before running ward
agent-aa4dfcc071db51f5d | 07:01:01 | 'npm run build'                  | Build the repo
agent-a6c17516ba1867b19 | 07:01:40 | 'npm run build 2>&1 | tail -60'  | Build the repo to ensure fresh dist before ward
agent-a05f88384e57ff529 | 07:19:53 | 'npm run build 2>&1 | tail -40'  | Build the repo before running ward
agent-af0d2de8d5c0c7795 | 07:23:15 | 'npm run build'                  | Build all packages before running ward typecheck
agent-a4aad8da7dcef1ab2 | 07:45:21 | 'npm run build'                  | Build the monorepo before running ward
agent-aaa27f462b44f55a8 | 07:50:52 | 'npm run build'                  | Build the monorepo before running ward
agent-a88585a28327d5a7f | 08:00:37 | 'npm run build 2>&1 | tail -20; echo "BUILD_EXIT:$?"'          | Build the repo before running ward
agent-a88585a28327d5a7f | 08:02:54 | 'npm run build 2>&1 | tail -10; echo "BUILD_EXIT:${PIPESTATUS[0]}"' | Rebuild after revert
agent-a88585a28327d5a7f | 08:02:56 | 'npm run build 2>&1 | tail -10'  | Rebuild after revert
agent-afce78981dd05286b | 08:06:26 | 'npm run build'                  | Build the repo before running ward
agent-af5bcf994c5e251e6 | 08:07:20 | 'npm run build 2>&1 | tail -30'  | Build the repo to ensure ward resolves cross-package types correctly
agent-a597b4e04f3a6cbbe | 08:16:57 | 'npm run build'                  | Build the repo before running ward
```

**The cause is in the transcript, in their own descriptions.** "to ensure fresh dist before ward",
"to ensure ward resolves cross-package types correctly" — those paraphrase the
`<dungeonmaster-wardDiscipline>` session snippet each sub-agent receives at session start:

> **Build first, unpiped.** Ward resolves cross-package types through each package's `dist/`, so a
> stale build surfaces as phantom TS2339 "property X does not exist" on correct code.

Where the snippet and a one-line brief disagree, the snippet won 14 times out of 14. The
codeweaver-reviewer prompt neutralises the snippet explicitly — *"This rule overrides the
`<dungeonmaster-ward>` and `<dungeonmaster-wardDiscipline>` snippets you were handed at session
start"* — and the code sub-agent briefs carry no such override, because the operator writes them
freehand.

**Concurrency.** These were not spread out. Group 1 ran four agents in parallel and three of them
built inside 2m18s (06:48:37, 06:49:33, 06:50:55). Two more built 39 s apart (07:01:01, 07:01:40).
Group 4's pair built at 07:45:21 and 07:50:52. Group 5's pair built at 08:00:37 and 08:07:20, with
`a88585a28327d5a7f` firing two more at 08:02:54 and 08:02:56. And `agent-a05f88384e57ff529` built at
07:19:53 while its own grandchild `agent-af0d2de8d5c0c7795` built again at 07:23:15 — a parent and
its child writing the same `dist/`.

**Cost.** The reviewer's build took 24 s (08:24:54 to 08:25:18) for 13 packages; 16 of those is
**about 6.4 minutes of sub-agent wall clock**, all of it inside the operator's 90 idle minutes. The real
cost is not the seconds — it is the corruption window the `[BUILD]` rule was written to close, which
this pass was lucky to survive.

**Aggravator: 10 of the 16 were piped through `| tail -N`**, which the same snippet forbids in the
same sentence ("piping it discards the exit code"). Two agents noticed and tried to recover it with
`echo "BUILD_EXIT:$?"` (reads the echo's status, not the build's) and `${PIPESTATUS[0]}` (correct).

**Prompt verdict: FORBIDDEN, twice over** — by the operator prompt's `[BUILD]` and by each brief's
own `PROVE` line.

### Finding 2 — one sub-agent held the whole session for 32.7 minutes, and spent 13.5 of them dispatching seven serial searches

**What happened.** `agent-a05f88384e57ff529` ("Build transcript image renderer") ran 07:06:13 to
07:39:00. The operator's timeline shows the wait verbatim:

```
   26.2m     3s     30   272,903  say: "The renderer is out — it carries ten of my observables. Ending my turn while it runs."
   58.9m                         ### INJECTED PROMPT: <task-notification> <task-id>a05f88384e57ff529</task-id> … <status>completed</status>
   59.3m  1989s   5275   275,325  say: "[thinking]"
```

Inside it, seven `Agent` dispatches, each blocking:

| Elapsed in the sub-agent | Nested agent | Duration |
|---|---|---|
| 0.6m | `a6b28196b0d06b573` Find ChatEntry content type and uuid contract | 1.3m |
| 3.4m | `ac11ba5f5deddabcf` Find trailer construction and existing test conventions | 1.8m |
| 7.8m | `ac4bf1f98cd3ec0e6` Find existing consumers/tests of pastedImageMemoryState | 0.7m |
| 9.7m | `a1d52d5555e01ef88` Find ban-primitives escape patterns for string return types in proxies | 1.2m |
| 15.6m | `af0d2de8d5c0c7795` Find precedent for narrowing union stub return type in tests | 3.9m |
| 21.5m | `a1fa0ee8c6f79e253` Find safe indexed-array-access pattern in proxies | 2.0m |
| 28.6m | `a439822aae06376f0` Check if chat-input-widget tests a dynamic Modal open via state | 2.6m |

**13.5 of the 32.8 minutes** were spent inside those seven, and every one of them blocked the
109-minute operator. Their combined spend: 55,897 output tokens, 13,754,690 context-in.

**Three of the seven were the same question about lint rules**, asked three times roughly 6 minutes apart:
"ban-primitives escape patterns for string return types in proxies", "precedent for narrowing union
stub return type in tests", "safe indexed-array-access pattern in proxies" — 7.1 minutes total. The
sub-agent had already called `get-architecture`, `get-syntax-rules` and `get-testing-patterns`
(its histogram shows one of each); none of them answered a proxy-file lint question, so it went
hunting the tree for precedent instead.

**One was a straight duplicate.** `ac4bf1f98cd3ec0e6` "Find existing consumers/tests of
pastedImageMemoryState" (07:14:03) re-searched a file that `agent-a045f135b418ab40b` had WRITTEN and
finished at 06:55:07, that the operator had `Read` at 22.6m, and that the renderer's own brief named
under `READ FIRST` with a one-line description of what it does.

**Prompt verdict: PERMITTED by omission.** The `Briefing a sub-agent` section says nothing about
whether a code-writing sub-agent may start its own. Only the reviewer prompt forbids it ("You return
text. You call no `signal-back` and you start no sub-agent"). Three sub-agents took the silence as
permission and spawned 11 grandchildren between them (`a05f88384e57ff529` ×7, `a4aad8da7dcef1ab2`
×2, `af5bcf994c5e251e6` ×2).

### Finding 3 — tight edit→ward→edit→ward loops, with the same command re-run 4 and 5 times

`agent-a045f135b418ab40b` ran the identical command five times in 1.7 minutes, with 8 edits in
between:

```
  5.7m WARD: npm run ward -- --only unit -- packages/web/src/state/pasted-image-memory/pasted-image-memory-state.test.ts 2>&1 | tail -60
  5.9m EDIT: pasted-image-memory-state.ts
  6.1m WARD: npm run ward -- --only unit -- …pasted-image-memory-state.test.ts 2>&1 | tail -80
  6.2m EDIT: pasted-image-memory-state.ts
  6.3m EDIT: pasted-image-memory-state.ts
  6.5m WARD: npm run ward -- --only unit -- …pasted-image-memory-state.test.ts 2>&1 | tail -80
  6.6m EDIT / 6.8m EDIT
  7.0m WARD: (same again)
  7.1m EDIT / 7.3m EDIT
  7.4m WARD: (same again)
```

`agent-aaa27f462b44f55a8` did the same with `--onlyTests "pasted image bytes are remembered"` — four
identical runs between 13.7m and 15.1m, six edits interleaved. It ran 8 ward invocations in a 16.4
minute session.

Across all sub-agents: **51 `npm run ward` invocations**. Several were piped through `| tail -N` or
`| head -N`, which discards ward's exit code the same way piping a build does.

**Prompt verdict: PERMITTED, and arguably required** — each brief's `PROVE` line names the ward
command and the `RETURN` block demands "the red I watched before the code made it pass", so a
red-to-green cycle is the deliverable. What is not required is guessing five times in a row.
`<dungeonmaster-wardDiscipline>` does say "**Run it ONCE.** Choose the right flags the first time",
which these violate in spirit.

### Finding 4 — the operator called `get-quest` without a flow id, exactly as its prompt forbids

At 79.0m the operator called `mcp__dungeonmaster__get-quest(questId=1be07040-…)` with no `flowId`
and no `packageName`. Result:

```
Error: result (263,665 characters across 4,359 lines) exceeds maximum allowed tokens. Output has been saved to
/home/brutus-home/.claude/projects/…/26055f5a-…/tool-results/mcp-dungeonmaster-get-quest-178…
```

Its own prompt, in step 1: *"`get-quest` takes `flowId` and `packageName`, never `stage`. `stage:
'spec'` returns the whole quest, every flow on it, and that render grows as the quest does — past
the tool-result ceiling on any quest of real size."*

It recovered cleanly (three `python3 -c` calls against the spilled file, edge ids in hand by 79.6m)
and paid roughly 1.1 minutes. **The provocation was finding 3c(i)** — it needed edge ids the sanctioned
call does not print, and there was no third option. Prompt verdict: **forbidden, but the forbidden
route was the only route.**

### Finding 5 — the reviewer graded 7 of 25 files from a diff, 6 of them test files

Its prompt, step 4: *"**Every one, in full.** Not the diff — the file. Reading whole files is what
finds the false green a diff hides: an assertion comparing a value to itself…"*

Measured against the 25 product/test files in commit `9f8ab692a`:

- **Read in full (18):** `chat-message-widget.tsx`, `has-equivalent-chat-entry-guard.ts`,
  `image-content-layer-widget.{tsx,proxy.tsx,test.tsx}`, `image-overlay-widget.proxy.tsx`,
  `normalise-chat-content-transformer.{ts,test.ts}`,
  `parse-transcript-segments-transformer.{ts,test.ts}`,
  `pasted-image-memory-state.{ts,proxy.ts,test.ts}`, `quest-chat-content-layer-widget.test.tsx`,
  `transcript-segment-contract.{ts,test.ts}`, `transcript-segment.stub.ts`,
  `use-quest-chat-binding.ts`
- **Seen only as `git diff HEAD -- <file>` (7):** `chat-message-widget.proxy.tsx`,
  `chat-message-widget.test.tsx`, `has-equivalent-chat-entry-guard.test.ts`,
  `image-overlay-widget.test.tsx`, `session-view-widget.test.tsx`,
  `use-quest-chat-binding.proxy.ts`, `use-quest-chat-binding.test.ts`

Six of the seven are the test and proxy files that step 4's question 3 ("Is the unit test real? …
name the wrong value that would turn it red") exists to interrogate. Twelve `git diff HEAD -- <path>`
Bash calls between 1.0m and 2.1m are where those seven were "read". Cost: cheap in tokens, expensive
in what it can no longer claim.

**Prompt verdict: FORBIDDEN.** The instruction is unambiguous and the reviewer took the shortcut its
own prompt names as the failure mode.

### Finding 6 — three refused commands in the reviewer, two of them hook-blocked native search

```
--- 0.4m tool-result --- "Error: EISDIR: illegal operation on a directory, read '…/packages/web/src/contracts/transcript-segment'"
--- 0.5m tool-result --- "Error: PreToolUse:Bash hook error: [dungeonmaster-pre-bash]: BLOCKED: Native search tools are disabled."   (a `find`)
--- 3.4m tool-result --- "Error: PreToolUse:Bash hook error: [dungeonmaster-pre-bash]: BLOCKED: Native search tools are disabled."   (a `grep -n "shared" …/package.json`)
```

Across all 27 sub-agents there were **18 hook-blocked native-search attempts**. Every code brief the
operator wrote DID carry the warning — *"Search with the `discover` MCP tool … Native Grep/Glob/find/rg
and shell grep/find are BLOCKED by hooks in this repo"* — but the `codeweaver-reviewer` prompt, which
the operator does not write, carries no such line. Three wasted round-trips in the one session that
had a build and a ward still ahead of it. Prompt verdict: **forbidden by the environment, not
warned about in the reviewer's own prompt.**

### Finding 7 — one sub-agent spent 4.5 minutes and two full builds confirming a test that already existed and already passed

`agent-a88585a28327d5a7f` ("Confirm overlay close-button unit") reported:

> `FILES: none — the widget file was temporarily edited to prove the test bites, then reverted`

It broke `image-overlay-widget.tsx`'s `IconButtonWidget onClick` to a no-op, built the monorepo, ran
ward, watched red, reverted, **built the monorepo again**, ran ward, watched green. 4.5 min, 6,670
output tokens, 2,085,564 context-in, 3 builds (08:00:37, 08:02:54, 08:02:56) for one jsdom test that
touches no cross-package type.

**Prompt verdict: REQUIRED in substance, wasteful in form.** "Recording what you claim" demands
`confirmed` carry "a test `file:line` AND what makes that test fail", so red-then-green is the
evidence standard. The two monorepo builds are finding 1 again.

### Finding 8 — the ward gate that failed did NOT fail on this codeweaver's work

This is the assignment's central question, so it is stated with the full evidence.

**The gate.** `runId 1788337745350-9780` = `2026-09-02T08:29:05.350Z`, work item [10],
`mode: 'changed'`, exit code 1. Result blob
`.dungeonmaster/…/ward-results/229c5454-3b1c-4f04-aa67-97350a357b20.json`:

| check | status | detail |
|---|---|---|
| lint | pass | 6 packages, web 159 files |
| typecheck | pass | 13 packages, 7,404 files |
| **unit** | **pass** | web: 120 files, 401 discovered, **1,187 passing, 0 failures** |
| **integration** | **fail** | web: 128 files, 8 discovered, **1,204 passing, 2 failures** |
| e2e | skip | 0 files |

The two failures:

```
suitePath: …/packages/web/src/contracts/pasted-image-draft/pasted-image-draft-contract.test.ts
testName : pastedImageDraftContract invalid inputs INVALID: {dataBase64 decoding over the byte ceiling} => throws for oversized payload
message  : Error: expect(received).toThrow(expected)
           Expected substring: "Decoded image exceeds 5242880 bytes"
           Received message:   "Maximum call stack size exceeded"

suitePath: …/packages/web/src/transformers/data-url-split/data-url-split-transformer.test.ts
testName : dataUrlSplitTransformer byte ceiling INVALID: {payload decoding over maxBytesPerImage} => throws
message  : RangeError: Maximum call stack size exceeded
             at RegExp.test (<anonymous>)
             at ZodString._parse (…/zod/v3/types.cjs:656:48)
```

**Neither file is in this codeweaver's commit.** `git show --stat --name-only 9f8ab692a` lists 26
paths; `pasted-image-draft-contract.test.ts` and `data-url-split-transformer.test.ts` are not among
them. They were landed by work items [7] (`061e49064`, paste-image-into-composer) and [8]
(`3275de52b`, send-message-with-images). The root cause the spiritmender found sits in two contracts
from work items [2] and [7]:

> `spiritmender: fix regex stack overflow on multi-MB pasted-image validation`
> Traced to `imageDataUrlContract`/`base64ImageDataContract` each running a single `regex.test()`
> with the `'u'` flag and a `+` quantifier over the whole base64 payload — up to ~7M characters …
> Reproduced directly under jest+jsdom (not in plain node), and **reproduced across the same batch
> of files repeatedly; a bare `u`-flag drop "fixed" it in isolation but still crashed once other
> files in the batch ran first**

Its diff touched three files, none of them this codeweaver's:
`…/pasted-image-upload-contract.ts` (shared), `…/image-data-url/image-data-url-contract.ts` (web),
`…/base64-byte-length-transformer.ts`.

**Did this codeweaver's own verification miss it?** Structurally yes, and the miss is designed in.
The reviewer's ward, verbatim from its transcript:

```
> dungeonmaster-ward --staged
lint        @dungeonmaster/web   PASS  12 files, 12 discovered (8.9s)
typecheck   @dungeonmaster/web   PASS  1233 files, 1233 discovered (8.0s)
unit        @dungeonmaster/web   PASS  16 files, 401 discovered (19.3s)
integration @dungeonmaster/web   PASS  25 files, 8 discovered (23.2s)
e2e         @dungeonmaster/web   skip (0.0s)
run: 1788337521833-3f71  (59.7s)
```

`1788337521833` = `08:25:21.833Z`, exactly **223.5 seconds** before the gate started. Same tree, same
worktree, 3 minutes 43 seconds apart — and it graded **16 unit files** where the gate graded **120**,
**25 integration files** where the gate graded **128**. `--staged` means "files origin lacks", and
every prior cell's reviewer pushed on its way out, so `--staged` at 08:25 resolved to this pass's 26
paths and nothing else. The two crashing files were outside the reviewer's scope by construction.

Two conclusions follow, and the second is the sharper one:

1. **No reviewer on this quest could ever have seen it.** `ward(changed)` sits in `relayTail`, after
   all eight codeweaver cells. Eight cells ran, each verified against a `--staged` window that shrank
   to its own commit, and the first whole-branch run of any kind was the gate at 08:29 — the ninth
   verification event on a branch with eight commits on it.
2. **Even a whole-branch run would have been a coin flip.** In the SAME gate run, minutes apart, web
   `unit` passed with 1,187 tests and web `integration` failed with the same two tests crashing. The
   defect is jest-batch-order-dependent, exactly as the spiritmender's diagnosis says. A reviewer
   running the full sweep would have had roughly even odds of a green.

The pt-2 ward (`1788339452894-54de`, `08:57:32.894Z`) came back green on identical file counts
(web unit 120, web integration 128) after the contract fix.

**Verdict: the codeweaver did not leave the failures, and no verification step available to it under
its prompt could have caught them.** The gap is in the ledger's shape, not in this session's conduct.

---

## 6. Suggested fixes

Ranked by minutes-or-tokens recovered per quest of this shape.

### Fix 1 — Move `ward(changed)` so it runs between codeweaver cells, not only after all of them
*(answers finding 8; est. saves the spiritmender's 23.6 min + the failed gate's 5.0 min + the pt-2
gate's 2.7 min = **roughly 31 min per quest**, plus every minute a later cell spends building on a latent
break)*

**File:** `packages/shared/src/statics/quest-type-registry/quest-type-registry-statics.ts` (the
`relayTail` / `startImplementationOps` arrays both quest types share).

**Edit:** give the `codeweaver` seed a trailing `ward` companion, or splice a `ward(changed)` item
after every Nth codeweaver cell (N=3 would have put one after [4] and [7] on this quest). Eight
cells producing eight commits with one whole-branch verification event between the first and the
last is the structural cause: work item [7] landed the defective contract at 03:45 and the first
thing to grade the whole branch ran at 08:29 — **4 hours 44 minutes** and four codeweaver sessions
later.

Cheaper variant if the ledger cannot change: **have `codeweaver-reviewer` run `--staged` AND a
package-scoped run of the packages it touched** — `npm run ward -- -- packages/web` after the
`--staged` run — which would have put both crashing files in the batch. It costs each reviewer
roughly 60–120 s; it is one run per cell versus one spiritmender per quest.

### Fix 2 — Make the sub-agent brief's `no npm run build` an explicit override of the ward snippet
*(answers finding 1; est. saves roughly 6.4 min of sub-agent wall clock per cell and closes the concurrent-`dist/` window)*

**File:** `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, the
`PROVE` block inside the `Briefing a sub-agent` template.

**Edit:** replace

```
PROVE
  npm run ward -- --only lint,test -- <this brief's own paths>
  no npm run build · no run-ward MCP tool · no commit · never widen the ward
```

with

```
PROVE
  npm run ward -- --only lint,test -- <this brief's own paths>
  NEVER npm run build. This OVERRIDES the <dungeonmaster-wardDiscipline> snippet's "Build first,
  unpiped" line, which is written for a session working alone. Sub-agents run in parallel here and
  `tsc` writes one shared dist/ per package, so a second builder hands its siblings type errors on
  correct code. --only lint,test never touches dist/, so a stale build cannot affect your run.
  no run-ward MCP tool · no commit · never widen the ward
```

The measurement that justifies the length: 14 of 14 sub-agents that faced the conflict resolved it
in the snippet's favour, and their `description` fields quote the snippet's reasoning back
(`"to ensure fresh dist before ward"`, `"to ensure ward resolves cross-package types correctly"`).
A one-line prohibition loses to a paragraph with a mechanism behind it; give the prohibition the
mechanism.

**Companion file:** `packages/shared/src/statics/session-snippet/session-snippet-statics.ts` —
add one clause to the `wardDiscipline` snippet's "Build first, unpiped" paragraph: *"…unless you are
a sub-agent on an operator's pass, whose brief forbids it — a `--only lint,test` run does not read
`dist/`."* Fixing it at the snippet closes the conflict for every role in every repo at once.

### Fix 3 — Print the edge id in the flow render
*(answers finding 3c(i) and finding 4; est. saves roughly 1.1 min and roughly 2,750 output tokens per operator
session that signs an edge, and removes a 263 KB spill)*

**File:** `packages/shared/src/transformers/flow-graph-to-text/flow-graph-to-text-transformer.ts`,
lines 275 and 281.

**Edit:** change

```ts
`${indent}${SYM.indent}${SYM.rightArrow}${labelPart}[#${String(toId)}]${edgeSignoffMarker}`,
```

to carry the edge's own id where the edge is labelled:

```ts
`${indent}${SYM.indent}${SYM.rightArrow}${labelPart}[#${String(toId)}]${edgeIdPart}${edgeSignoffMarker}`,
```

with `edgeIdPart` rendering `` ` <edge:${String(edge.id)}>` `` for a labelled edge and `''`
otherwise, plus one KEY legend line. The render already prints `${edgeSignoffMarker}` on that same
line — it shows `[C✓]` for an edge whose id it withholds, which is the whole defect. Same edit at
line 227 for the cross-flow inbound form.

This is precisely the failure `packages/orchestrator/CLAUDE.md` rule 4 warns about ("Check the
RENDERER before promising a session what it will be handed") — the prompt promises an edge id the
renderer never emits.

### Fix 4 — Forbid grandchildren in the code-sub-agent brief, and add the three lint answers the standards tools do not carry
*(answers finding 2; est. saves 7–13 min per heavy cell)*

**File:** `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, the
`Briefing a sub-agent` template.

**Edit (a):** add one line under `TRAPS` in the template:

```
  You are a leaf. Start no Agent of your own — the operator already mapped this package and its
  brief names every file you need. A search you cannot answer from the brief is a `NEXT: rework`
  line, not a sub-agent.
```

Evidence: 11 grandchildren were spawned, 13.5 min of one 32.8-min sub-agent went into seven of them,
one (`ac4bf1f98cd3ec0e6`) re-searched a file the brief already named under `READ FIRST` with a
description of what it does, and one (`af0d2de8d5c0c7795`) — a read-only search agent — ran
`npm run build` and `npm run ward -- --only typecheck`.

**Edit (b), the better half:** three of the seven searches were lint questions — `ban-primitives`
escapes for a string return type in a proxy, narrowing a union stub return type in a test, safe
indexed-array-access in a proxy. All three sessions had already called `get-syntax-rules` and
`get-testing-patterns`. **File:** the MCP `get-syntax-rules` / `get-testing-patterns` statics under
`packages/mcp/src/statics/` — add a "Proxy files: the four rules that bite" section covering those
three plus `exactOptionalPropertyTypes`. 7.1 minutes of tree-searching for answers that belong in a
tool that was already called.

### Fix 5 — Make the reviewer read whole test files, and warn it about the search hooks
*(answers findings 5 and 6; est. saves 3 wasted round-trips and closes the reviewer's one real
quality gap)*

**File:** `packages/orchestrator/src/statics/codeweaver-reviewer/codeweaver-reviewer-statics.ts`.

**Edit (a),** step 4: after *"**Every one, in full.** Not the diff — the file"* add the enumeration
that makes it checkable:

```
Before you build, list the files `git status` and `git diff HEAD --stat` named, and confirm you have
one `Read` per file. `git diff HEAD -- <path>` is NOT a read of that path. A test file you graded
from a diff is a test you cannot answer question 3 about, because the assertion you did not see is
the one that does not bite.
```

Measured: 18 of 25 files read in full, 7 diff-only, 6 of the 7 test/proxy files.

**Edit (b),** the `## Rules` section: add the search-tool line every code brief already carries but
the reviewer's prompt does not —

```
**[SEARCH] Native `Grep`/`Glob`/`Search` and shell `grep`/`find`/`rg` may be blocked by repo hooks.**
Reach for `discover` / `get-project-map` first; `Read`, `ls` and `python3 -c` are the substitutes.
```

### Fix 6 — Either wire `codeweaverScopeBlockTransformer` in, or delete it
*(answers finding 3a; est. saves roughly 0.5 min per cell and removes a 175-line file that reads as live)*

**File:** `packages/orchestrator/src/transformers/work-item-to-prompt/work-item-to-prompt-transformer.ts`.

**Edit:** after the four `parts` lines, for `workItem.role === 'codeweaver'`:

```ts
if (workItem.role === 'codeweaver') {
  parts.push(...codeweaverScopeBlockTransformer({ quest, operationItem: linkedOperation }));
}
```

The transformer is already budget-conscious by design (its own header explains why it renders seams
and shared homes and NOT the flow slice). It returns `[]` when there is nothing to say, so the
degenerate case is safe.

If the omission was deliberate, delete
`packages/orchestrator/src/transformers/codeweaver-scope-block/` and its test, and cut the seam
question from the codeweaver prompt's step 5 — because as it stands, step 5 question 4 asks the
operator something no block answers, and this session paid two `git show` calls to answer it by hand.

### Fix 7 — Drop the unsatisfiable FINDINGS instruction from step 7
*(answers finding 3c(ii); est. saves nothing this pass, prevents a lost finding on a pass where the
reviewer returns one)*

**File:** `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, step 7's
table row.

**Edit:** replace *"copy its `FINDINGS:` into your signal — anything it named for someone else
survives nowhere else"* with *"its `FINDINGS:` are already durable — your reviewer put its whole
return block in the commit body, which is where the next session reads them from. `signal-back`
takes no findings field."*

`signalBackInputContract` is `.strict()` with six keys and no slot for findings; its own comment
already says *"the next-session handoff is the git commit message, not the ledger."* The prompt is
telling the operator to do something the schema would reject.

### Fix 8 — Tell code sub-agents to diagnose before re-running ward
*(answers finding 3; est. saves 1–2 min per sub-agent that hits a red)*

**File:** the `Briefing a sub-agent` template's `PROVE` block, same file as fix 2.

**Edit:** add one line —

```
  A red gets ONE reading before your next edit: run `npm run ward -- detail <runId>` and name the
  assertion and the actual value out loud. Never re-run the same command after an edit you have not
  explained; four identical runs is four guesses.
```

Evidence: `agent-a045f135b418ab40b` fired the identical command 5× in 1.7 min; `agent-aaa27f462b44f55a8`
4× in 1.4 min. The agents that DID use `npm run ward -- detail <runId>` (`a05f88384e57ff529`,
`a4aad8da7dcef1ab2`, `a6c17516ba1867b19`, `a88585a28327d5a7f`) converged without a repeat loop.

---

## 7. Raw figures appendix

### `summary 26055f5a-7478-40b4-8e2d-ade03dec05c5`

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/26055f5a-7478-40b4-8e2d-ade03dec05c5.jsonl
LINES     453
START     2026-09-02T06:40:05.030000+00:00
END       2026-09-02T08:29:04.424000+00:00
WALL      1:48:59.394000  (109.0 min)
TYPES     {'queue-operation': 36, 'attachment': 111, 'user': 87, 'last-prompt': 34, 'atis-latch': 33, 'assistant': 152}
MODELS    {'claude-opus-5': 152}

TOKENS (this transcript only, excludes subagents)
  assistant API responses : 152
  input (uncached)        : 304
  cache_read              : 35,577,474
  cache_creation          : 1,065,928
  output                  : 342,865
  of which thinking       : 118,671
  TOTAL context-in        : 36,643,706

TOOL CALLS (72 total)
     16  Agent
     15  Read
     12  Bash
      9  mcp__dungeonmaster__discover
      9  mcp__dungeonmaster__modify-quest
      3  mcp__dungeonmaster__get-quest
      2  ToolSearch
      1  mcp__dungeonmaster__get-agent-prompt
      1  mcp__dungeonmaster__get-architecture
      1  mcp__dungeonmaster__get-syntax-rules
      1  mcp__dungeonmaster__get-testing-patterns
      1  Write
      1  mcp__dungeonmaster__signal-back

TOOL RESULT BYTES fed back: 513,074

SUBAGENTS 27  (run `subagents` subcommand for the roster)
```

### `subagents 26055f5a-7478-40b4-8e2d-ade03dec05c5`

```
09-02 06:41:40  +   1.5m  agent-ae447362c17e68ce4  Explore/sonnet  turns= 21 out=9,284 ctx-in=864,233
           desc: Map optimistic dedup path
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 8, 'Read': 5}
09-02 06:41:48  +   2.5m  agent-ab1da6285a12fbf58  Explore/sonnet  turns= 57 out=15,159 ctx-in=4,535,305
           desc: Map replay frame and routes
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 12, 'Read': 26}
09-02 06:45:57  +   4.9m  agent-aefcc8ebb3536a20e  general-purpose/sonnet  turns= 57 out=24,076 ctx-in=5,859,778
           desc: Add transcript-segment contract
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 14, 'Read': 10, 'Write': 3, 'Bash': 4, 'Edit': 2}
09-02 06:46:26  +  12.0m  agent-afd618adc069b207a  general-purpose/sonnet  turns= 54 out=60,660 ctx-in=8,028,949
           desc: Add chat-content normaliser
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 11, 'mcp__dungeonmaster__discover': 11, 'Write': 3, 'Bash': 3}
09-02 06:46:49  +   8.3m  agent-a045f135b418ab40b  general-purpose/sonnet  turns= 83 out=22,122 ctx-in=10,060,999
           desc: Add pasted-image memory state
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 8, 'Read': 14, 'Bash': 12, 'Write': 3, 'Edit': 10}
09-02 06:47:13  +   8.2m  agent-a306e8fddc09c709a  general-purpose/sonnet  turns=101 out=24,185 ctx-in=10,961,271
           desc: Cover overlay close paths
           tools: {'ToolSearch': 1, 'Read': 8, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Bash': 14, 'mcp__dungeonmaster__discover': 23, 'Edit': 8}
09-02 06:56:53  +   7.9m  agent-a6c17516ba1867b19  general-purpose/sonnet  turns= 52 out=47,176 ctx-in=5,482,704
           desc: Add transcript segment parser
           tools: {'Read': 12, 'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 6, 'Write': 2, 'Bash': 6, 'Edit': 2}
09-02 06:59:31  +   3.1m  agent-aa4dfcc071db51f5d  general-purpose/sonnet  turns= 33 out=9,792 ctx-in=2,798,840
           desc: Normalise before dedup compare
           tools: {'Read': 7, 'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 1, 'Edit': 4, 'Bash': 3}
09-02 07:06:13  +  32.8m  agent-a05f88384e57ff529  general-purpose/sonnet  turns= 76 out=103,853 ctx-in=14,762,025
           desc: Build transcript image renderer
           tools: {'Read': 18, 'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Agent': 7, 'Write': 6, 'Bash': 6, 'Edit': 4}
09-02 07:06:49  +   1.3m  agent-a6b28196b0d06b573  general-purpose/None  turns= 28 out=8,731 ctx-in=1,432,738
           desc: Find ChatEntry content type and uuid contract
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 10, 'Read': 10}
09-02 07:09:38  +   1.8m  agent-ac11ba5f5deddabcf  general-purpose/None  turns= 33 out=8,175 ctx-in=2,419,703
           desc: Find trailer construction and existing test conventions
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 18, 'Read': 4}
09-02 07:14:03  +   0.7m  agent-ac4bf1f98cd3ec0e6  Explore/None  turns= 13 out=3,407 ctx-in=382,431
           desc: Find existing consumers/tests of pastedImageMemoryState
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 5, 'Read': 3}
09-02 07:15:56  +   1.2m  agent-a1d52d5555e01ef88  general-purpose/None  turns= 15 out=6,932 ctx-in=793,305
           desc: Find ban-primitives escape patterns for string return types in proxies
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 6, 'Read': 2}
09-02 07:21:51  +   3.9m  agent-af0d2de8d5c0c7795  general-purpose/None  turns= 47 out=17,795 ctx-in=3,453,415
           desc: Find precedent for narrowing union stub return type in tests
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 16, 'Read': 7, 'Bash': 2}
09-02 07:27:42  +   2.0m  agent-a1fa0ee8c6f79e253  general-purpose/None  turns= 31 out=10,931 ctx-in=2,130,174
           desc: Find safe indexed-array-access pattern in proxies
           tools: {'Read': 9, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 8, 'Bash': 2}
09-02 07:34:48  +   2.6m  agent-a439822aae06376f0  general-purpose/None  turns= 41 out=14,727 ctx-in=3,197,924
           desc: Check if chat-input-widget tests a dynamic Modal open via state
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 6, 'Read': 8, 'Bash': 10}
09-02 07:40:37  +   7.8m  agent-a4aad8da7dcef1ab2  general-purpose/sonnet  turns= 59 out=30,896 ctx-in=7,586,793
           desc: Mount renderer in user bubble
           tools: {'Read': 11, 'Agent': 2, 'Edit': 7, 'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 4, 'Bash': 6}
09-02 07:41:02  +   0.3m  agent-a735db5a35e4168d3  general-purpose/None  turns=  5 out=925 ctx-in=157,642
           desc: Locate ChatEntry contract shape for user role content field
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 1, 'Read': 1}
09-02 07:41:15  +  16.4m  agent-aaa27f462b44f55a8  general-purpose/sonnet  turns=121 out=69,958 ctx-in=23,933,238
           desc: Drop the duplicate bubble
           tools: {'ToolSearch': 2, 'Read': 24, 'mcp__dungeonmaster__discover': 13, 'Edit': 19, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__get-architecture': 1, 'Bash': 11}
09-02 07:42:07  +   0.4m  agent-aa7312d077ec89839  general-purpose/None  turns=  9 out=2,086 ctx-in=357,764
           desc: Inspect pasted-image-memory-state and image-overlay-widget proxies
           tools: {'Read': 6}
09-02 07:58:41  +  12.8m  agent-af5bcf994c5e251e6  general-purpose/sonnet  turns= 82 out=56,169 ctx-in=15,293,571
           desc: Prove one bubble on both routes
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 25, 'Agent': 2, 'Edit': 10, 'Bash': 6}
09-02 07:59:46  +   1.8m  agent-a2a1f6330301e460c  Explore/sonnet  turns= 42 out=11,786 ctx-in=2,548,599
           desc: Find composer attachment stub and chat-input marker-position test
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 15, 'Read': 13, 'Bash': 1}
09-02 08:00:02  +   4.5m  agent-a88585a28327d5a7f  general-purpose/sonnet  turns= 35 out=6,670 ctx-in=2,085,564
           desc: Confirm overlay close-button unit
           tools: {'Read': 3, 'Bash': 12, 'Edit': 2}
09-02 08:01:02  +   0.6m  agent-af34fd5cc33f4387d  Explore/haiku  turns= 10 out=1,968 ctx-in=189,880
           desc: Locate pastedImageStatics file
           tools: {'ToolSearch': 1, 'Bash': 1, 'mcp__dungeonmaster__discover': 1, 'Read': 1}
09-02 08:05:22  +   5.3m  agent-afce78981dd05286b  general-purpose/sonnet  turns= 34 out=13,915 ctx-in=3,077,840
           desc: Close the overlay from transcript
           tools: {'ToolSearch': 1, 'Read': 6, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Edit': 5, 'Bash': 5}
09-02 08:13:07  +   5.8m  agent-a597b4e04f3a6cbbe  general-purpose/sonnet  turns= 38 out=23,926 ctx-in=3,714,917
           desc: Make broken placeholder visible
           tools: {'ToolSearch': 1, 'Read': 6, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 3, 'Bash': 4, 'Edit': 4}
09-02 08:19:23  +   8.6m  agent-a28d1d97ee8b0d513  general-purpose/sonnet  turns=113 out=45,729 ctx-in=17,626,623
           desc: Review web transcript images
           tools: {'ToolSearch': 3, 'mcp__dungeonmaster__get-agent-prompt': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__get-quest': 1, 'Bash': 25, 'Read': 25, 'mcp__dungeonmaster__discover': 14}

SUBAGENT TOTALS  agents=27 turns=1290 output=651,033 context-in=153,736,225
```

### `summary agent-a28d1d97ee8b0d513 --parent 26055f5a-…` (the reviewer)

```
LINES     196
START     2026-09-02T08:19:23.223000+00:00
END       2026-09-02T08:27:58.619000+00:00
WALL      0:08:35.396000  (8.6 min)
TYPES     {'user': 73, 'attachment': 10, 'assistant': 113}
MODELS    {'claude-sonnet-5': 113}

TOKENS (this transcript only, excludes subagents)
  assistant API responses : 113
  input (uncached)        : 226
  cache_read              : 17,008,393
  cache_creation          : 618,004
  output                  : 45,729
  of which thinking       : 33,793
  TOTAL context-in        : 17,626,623

TOOL CALLS (72 total)
     25  Bash
     25  Read
     14  mcp__dungeonmaster__discover
      3  ToolSearch
      1  mcp__dungeonmaster__get-agent-prompt
      1  mcp__dungeonmaster__get-architecture
      1  mcp__dungeonmaster__get-syntax-rules
      1  mcp__dungeonmaster__get-testing-patterns
      1  mcp__dungeonmaster__get-quest

TOOL RESULT BYTES fed back: 1,857
```

### Ward gate `229c5454-3b1c-4f04-aa67-97350a357b20` (runId `1788337745350-9780`), full check matrix

```
== lint pass
    @dungeonmaster/eslint-plugin pass files= 3 disc= 3 fails= 0 errs= 0 pass= 0
    @dungeonmaster/orchestrator pass files= 33 disc= 33 fails= 0 errs= 0 pass= 0
    @dungeonmaster/server pass files= 54 disc= 54 fails= 0 errs= 0 pass= 0
    @dungeonmaster/shared pass files= 17 disc= 17 fails= 0 errs= 0 pass= 0
    @dungeonmaster/testing pass files= 1 disc= 1 fails= 0 errs= 0 pass= 0
    @dungeonmaster/web pass files= 159 disc= 159 fails= 0 errs= 0 pass= 0
== typecheck pass
    @dungeonmaster/web pass files= 1233 …   (13 packages, all pass, 7,404 files)
== unit pass
    @dungeonmaster/eslint-plugin pass files= 4 disc= 226 fails= 0 errs= 0 pass= 77
    @dungeonmaster/orchestrator pass files= 31 disc= 517 fails= 0 errs= 0 pass= 403
    @dungeonmaster/server pass files= 22 disc= 188 fails= 0 errs= 0 pass= 218
    @dungeonmaster/shared pass files= 43 disc= 565 fails= 0 errs= 0 pass= 115
    @dungeonmaster/testing pass files= 1 disc= 107 fails= 0 errs= 0 pass= 5
    @dungeonmaster/web pass files= 120 disc= 401 fails= 0 errs= 0 pass= 1187
== integration fail
    @dungeonmaster/eslint-plugin pass files= 6 disc= 7 fails= 0 errs= 0 pass= 79
    @dungeonmaster/orchestrator pass files= 48 disc= 36 fails= 0 errs= 0 pass= 501
    @dungeonmaster/server pass files= 33 disc= 15 fails= 0 errs= 0 pass= 239
    @dungeonmaster/shared pass files= 43 disc= 1 fails= 0 errs= 0 pass= 115
    @dungeonmaster/testing pass files= 1 disc= 5 fails= 0 errs= 0 pass= 5
    @dungeonmaster/web fail files= 128 disc= 8 fails= 2 errs= 0 pass= 1204
== e2e skip   (6 packages, 0 files each)
```

### Ward run ids, converted

```
reviewer --staged ward  2026-09-02T08:25:21.833Z  1788337521833   (green,  59.7s)
ward GATE (changed)     2026-09-02T08:29:05.350Z  1788337745350   (FAIL, exit 1)
ward pt2 (changed)      2026-09-02T08:57:32.894Z  1788339452894   (green, all checks)
gap reviewer->gate = 223.517 s
```

### `modify-quest` sign-off writes (from the tool inputs)

```
#1 2026-09-02T06:56:14.929Z  observables=4  nodes=0 edges=0  bytes=2332
#2 2026-09-02T06:59:01.318Z  observables=3  nodes=0 edges=0  bytes=2338
#3 2026-09-02T07:40:02.888Z  observables=12 nodes=1 edges=0  bytes=8092
#4 2026-09-02T07:59:45.710Z  observables=0  nodes=0 edges=1  bytes=812
#5 2026-09-02T08:04:55.260Z  observables=1  nodes=0 edges=0  bytes=909
#6 2026-09-02T08:10:59.417Z  observables=3  nodes=0 edges=0  bytes=2521
#7 2026-09-02T08:12:09.214Z  observables=5  nodes=0 edges=4  bytes=6750
#8 2026-09-02T08:19:18.518Z  observables=2  nodes=0 edges=0  bytes=1662
#9 2026-09-02T08:28:32.545Z  observables=4  nodes=0 edges=0  bytes=3786
                            ------------------------------------------
                             total: 34 observables, 1 terminal node, 5 labelled edges
```

### Commit `9f8ab692a` — 26 paths (`git show --stat --name-only`)

```
.quest-plans/332e0da3-47aa-4f78-b3eb-15fbded0bdfe-map.md
packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.{ts,proxy.ts,test.ts}
packages/web/src/contracts/transcript-segment/transcript-segment-contract.{ts,test.ts}
packages/web/src/contracts/transcript-segment/transcript-segment.stub.ts
packages/web/src/guards/has-equivalent-chat-entry/has-equivalent-chat-entry-guard.{ts,test.ts}
packages/web/src/state/pasted-image-memory/pasted-image-memory-state.{ts,proxy.ts,test.ts}
packages/web/src/transformers/normalise-chat-content/normalise-chat-content-transformer.{ts,test.ts}
packages/web/src/transformers/parse-transcript-segments/parse-transcript-segments-transformer.{ts,test.ts}
packages/web/src/widgets/chat-message/chat-message-widget.{tsx,proxy.tsx,test.tsx}
packages/web/src/widgets/chat-message/image-content-layer-widget.{tsx,proxy.tsx,test.tsx}
packages/web/src/widgets/image-overlay/image-overlay-widget.{proxy.tsx,test.tsx}
packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.test.tsx
packages/web/src/widgets/session-view/session-view-widget.test.tsx
```

### Branch history around this work item

```
e0ffce3b2 spiritmender: fix regex stack overflow on multi-MB pasted-image validation   <- work item [11]
9f8ab692a codeweaver-reviewer: web's half of render-images-in-transcript …             <- THIS work item [9]
3275de52b codeweaver-reviewer: web's half of send-message-with-images …                <- work item [8], the startRef
061e49064 codeweaver-reviewer: web's half of paste-image-into-composer …               <- work item [7]
```

### Derived numbers and their arithmetic

| Number quoted above | Arithmetic |
|---|---|
| 90.0 min idle | `212+252+18+98+189+113+1989+437+565+285+322+37+353+529 = 5,399 s` (the timeline's `GAP` column on each post-notification line) |
| 19.0 min parent-active | `109.0 − 90.0` |
| 81.2 min "waiting on sub-agents" | `90.0 − 8.8` (the reviewer's `529s` gap) |
| 16 forbidden builds | 18 `npm run build` string hits across sub-agent transcripts, minus 1 false positive (the reviewer's commit body quotes the command) and minus the reviewer's own legitimate run |
| 51 sub-agent ward runs | 52 `npm run ward` string hits minus the same commit-body false positive |
| 6.4 min of build waste | `16 × 24 s`, the reviewer's measured build duration (`08:24:54.020Z → 08:25:18.791Z`) |
| 13.5 min of nested search inside the renderer | `1.3+1.8+0.7+1.2+3.9+2.0+2.6` from the roster |
| 55,897 output / 13,754,690 ctx-in for those seven | roster sums for `a6b28196b0d06b573`, `ac11ba5f5deddabcf`, `ac4bf1f98cd3ec0e6`, `a1d52d5555e01ef88`, `af0d2de8d5c0c7795`, `a1fa0ee8c6f79e253`, `a439822aae06376f0` |
| ~2,750 output tokens on the edge-id hunt | timeline `OUT` values for the distinct responses spanning 78.6m–79.6m: `543+887+522+352+450` |
| 93.8% cache_read | `178,613,626 / 190,379,931` |
| 1.90× / 4.19× sub-agent multiple | `651,033 / 342,865` and `153,736,225 / 36,643,706` |
| 4h44m latent window | work item [7] completed `2026-09-02T03:45:15.738Z`; the gate ran `08:29:05.350Z` |

### Not measurable from the transcript

- Whether the two crashing tests were present in the reviewer's 16-file unit batch. Ward's result
  blob records `filesCount` and `discoveredCount` but not the file list per project, and the
  reviewer's terminal output was summarised to the per-package PASS lines quoted above. The
  inference that they were absent rests on `--staged` semantics plus the fact that both files were
  pushed by earlier reviewers, not on a list ward printed.
- The exact per-sub-agent breakdown of the 18 hook-blocked search attempts by command type; only the
  count and the identity of the blocking hook were recovered.

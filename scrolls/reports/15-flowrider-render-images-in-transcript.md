# Work item 15 — flowrider — render-images-in-transcript (web / server / orchestrator)

## 0. Identity

| Field | Value |
|---|---|
| Work item id | `b52b4841-d3e6-431c-9138-5a4d018a5bd7` |
| Operation item id | `c0f5d521-29cb-4cf6-8db6-ecc012c8ab16` |
| Session id | `6509cd6e-205f-4938-88eb-a5051d77a6d3` |
| Role | `flowrider` |
| Model | `claude-opus-5` (166 assistant API responses, all one model) |
| Operation text | `Flowrider: author the test suites that prove this flow — flow: render-images-in-transcript` |
| dependsOn | item [14] `flowrider` / `send-message-with-images` (session `42edd7ea-612e-464e-b382-a5713d077d85`), which itself followed item [13] `flowrider` / `paste-image-into-composer` (`5c841160-080c-4eea-adf6-e7736b92121e`). Item [12] `pt 2: Ward gate (changed files)` was the last green gate before the flowrider chain. |
| Status | `complete` — `signal-back(... operationStatus: 'done')` at elapsed 218.7m |
| Window | 2026-09-02T16:13:14.174Z → 2026-09-02T19:52:11.294Z |
| Total wall clock | **218.95 min** (the transcript's own assistant-record span is 218.77 min: `START 16:13:31.950` → `END 19:52:25.084`) |
| Flow ids on the item | `['render-images-in-transcript']` |
| packageNames on the item | `[]` — **empty**, see §3 |

Sub-agent count: **26**. Fourteen were direct children of this session; twelve were grandchildren spawned by three of the test-writing sub-agents.

| Tier | Count | Model | Ids |
|---|---|---|---|
| Direct — read-only explorers | 4 | `sonnet` (explicit `model: "sonnet"` on every dispatch) | `a1eee9fee730548f3`, `a5a5603b40804f402`, `abaf7220f594d5cb5`, `a154b36eede128aa9` |
| Direct — wave 1 test writers | 4 | `sonnet` | `aa75fd37057fc2edd`, `a502373cced56c9dd`, `af12f6ca449f8f11d`, `aa69b8dc1d2069fed` |
| Direct — waves 2–6 test writers | 5 | `sonnet` | `ac15f6b7d0e9a79ee`, `af53301a106bbd964`, `a368d1c5a826e6370`, `af7a0174de0a516b0`, `a99bab1aff48176d3` |
| Direct — reviewer | 1 | `sonnet` | `aa20ed24786aba447` |
| Grandchildren | 12 | model `None` (inherited from their sonnet parents); agentType `general-purpose` ×5, `Explore` ×7 | `a541080a25523e3c5`, `a156e27c2e00b03ad`, `a81241e1198f84b9b`, `a62e51732794e9dca`, `a8bdbd18242fd972c`, `a5c8412a3fcb7ad45`, `aa5bc3197035af2a5`, `af9ae53c18e40ca9a`, `a89b752a728a9942e`, `a883d0f3a2b0174dd`, `a62063ffe2897e8c5`, `a7b1d7f3a8c3c20d6` |

Every direct dispatch used `subagent_type: "general-purpose"` and `model: "sonnet"`, exactly as the prompt requires. No opus sub-agent ran anywhere in the tree.

Output: one commit, `99587913a` — 13 files changed, 3,564 insertions, 29 deletions. 68 checklist units, 67 `confirmed`, 1 `unconfirmable`.

---

## 1. Chronological breakdown — where the time went

Phase boundaries are taken from the `timeline` elapsed column. "Blocked on helpers" is the sum of gaps ≥120 s between consecutive assistant records inside the phase; "operator active" is the phase span minus that. The two columns sum to the span, and the spans sum to 219.0 min.

| # | Clock | Elapsed | Span (min) | Operator active | Blocked on helpers | What happened | Evidence |
|---|---|---|---|---|---|---|---|
| P1 | 16:13:39–16:17:39 | 0.0–4.0m | 4.0 | 4.0 | 0.0 | Fetch prompt, `get-quest`, `get-qa-checklist` (67 units), the standards triple, dispatch 4 read-only explorers, read the sibling flowrider's map and 3 codeweaver maps | `0.7m say: "67 units on my flow. Loading standards and dispatching explorers together."`; `1.9m say: "The implementation already landed (codeweaver built all three halves). Let me read the sibling flowrider's map — same shape as mine."` |
| P2 | 16:17:39–16:26:47 | 4.0–13.2m | 9.2 | 9.2 | 0.0 | Absorb 4 explorer returns, send 2 `SendMessage` follow-ups into the same explorers, write the map (1 `Write` + 7 `Edit`), allocate all 67 units into six groups | `7.8m say: "The linchpin answered **yes**. An e2e spec can seed a session transcript and get it replayed into a real browser…"`; `13.2m say: "Map is complete — all 67 units allocated across 6 waves."` |
| P3 | 16:26:47–16:45:07 | 13.2–31.5m | 18.3 | 5.6 | 12.7 | Wave 1: four below-browser test writers dispatched together in one message; four returns absorbed and signed one at a time (11 units) | `13.6m/14.0m/14.5m/14.9m CALL Agent(...)` ×4; `30.5m say: "Wave 1 done — 11 units signed."` |
| P4 | 16:45:07–17:18:37 | 31.5–65.1m | 33.6 | 3.3 | 30.3 | Wave 2 alone: `transcript-renders-images.e2e.ts` + the new 907-line harness. Return read, both files opened, 11 units signed | `62.0m gap 1820s`; `62.8m say: "The spec is strong — real 200s, exact toStrictEqual on full child lists, and naturalWidth asserted against two different seeded widths (16 and 24)…"` |
| P5 | 17:18:37–17:51:25 | 65.1–97.9m | 32.8 | 2.4 | 30.4 | Wave 3 alone: overlay geometry. Return recorded a real spec defect (Mantine renders 864 px where "75 % of the viewport" needs 960 px); observable added, 11 units signed | `95.6m gap 1822s`; `95.6m say: "Wave 3 came back 10/10 green — but it found something that changes a verdict rather than confirming one."` |
| P6 | 17:51:25–18:38:13 | 97.9–144.7m | 46.8 | 2.2 | 44.6 | Wave 4 alone: `/api/images` refusal matrix + broken-thumbnail terminal, 2 files in 1 agent. Longest single sub-agent gap of the run. 19 units signed | `142.6m gap 2673s`; `142.6m say: "Wave 4 returned with two findings that matter more than the green suite, and one honest NOT PROVED."` |
| P7 | 18:38:13–18:54:07 | 144.7–160.6m | 15.9 | 1.7 | 14.2 | Wave 5 alone: path-encoding matrix, 9 rows. 9 units signed | `159.1m gap 855s`; `159.1m say: "All nine rows flipped under one break, with per-row detail on which field caught it."` |
| P8 | 18:54:07–19:45:11 | 160.6–211.6m | 51.0 | 1.1 | 49.9 | Wave 6 alone: `transcript-replaces-optimistic.e2e.ts`, the unit the map had flagged as most likely to fail. 7 units signed; checklist re-fetched (0 of 68 remaining); `git status --short` | `210.6m gap 2995s`; `211.5m say: "**Zero of 68 remaining** — every unit carries a verdict."` |
| P9 | 19:45:11–19:52:25 | 211.6–219.0m | 7.4 | 0.7 | 6.7 | One `flowrider-reviewer`, returned `pass`, committed `99587913a` and pushed. `git status`, `git log`, `signal-back` | `218.5m say: "Reviewer returned pass and committed."`; `218.7m CALL mcp__dungeonmaster__signal-back(...)` |
| | | | **219.0** | **30.2** | **188.8** | | |

### Idle vs blocked — the measurement the brief asked for

Every gap of ≥120 s between consecutive assistant records, with the sub-agent transcripts' own start/end timestamps overlaid:

```
  16:28:37 -> 16:34:36  gap=    359s (  6.0m)  subagents-live= 4  covered=    359s  uncovered=     0s
  16:34:54 -> 16:39:06  gap=    252s (  4.2m)  subagents-live= 3  covered=    252s  uncovered=     0s
  16:39:42 -> 16:42:14  gap=    152s (  2.5m)  subagents-live= 2  covered=    152s  uncovered=     0s
  16:45:10 -> 17:15:29  gap=   1820s ( 30.3m)  subagents-live= 2  covered=   1802s  uncovered=    18s
  17:18:46 -> 17:49:08  gap=   1822s ( 30.4m)  subagents-live= 5  covered=   1763s  uncovered=    59s
  17:51:35 -> 18:36:08  gap=   2673s ( 44.6m)  subagents-live= 1  covered=   2624s  uncovered=    49s
  18:38:22 -> 18:52:37  gap=    855s ( 14.2m)  subagents-live= 1  covered=    841s  uncovered=    14s
  18:54:15 -> 19:44:10  gap=   2995s ( 49.9m)  subagents-live= 8  covered=   2969s  uncovered=    26s
  19:45:17 -> 19:52:00  gap=    403s (  6.7m)  subagents-live= 1  covered=    398s  uncovered=     5s

TOTAL gap>=120s : 11330s = 188.8 min  = 86.3% of assistant span
  covered by >=1 live subagent : 11159s = 186.0 min = 85.0%
  NOT covered (true idle)      : 170s = 2.8 min = 1.3%
```

**The peer analyzer's 74.9 % figure does not reproduce here as idleness.** 86.3 % of this item's wall clock sat in gaps of ≥2 min, but 85.0 % of the wall clock had at least one sonnet sub-agent actually working, and only **2.8 min (1.3 %)** had nothing in flight at all — and those 2.8 min are the tail latency between a sub-agent's last transcript record and the harness's notification, not a stall the operator could have used. This operator never slept, never polled, never re-ran a helper to see if it had finished; it always ended its turn on a plain message. On the [HELPERS] rule it was clean.

The waste is not idleness — it is **serialisation**. Waves 2 through 6 each contained exactly one direct sub-agent:

| Wave | Sub-agent | Duration | Ran alongside another wave? |
|---|---|---|---|
| 1 (below-browser, 4 files) | `aa75fd37`, `a502373c`, `af12f6ca`, `aa69b8dc` | 15.0 / 6.9 / 15.3 / 10.4 min | yes — 4 in parallel |
| 2 (browser) | `ac15f6b7d0e9a79ee` | 30.2 min | no |
| 3 (browser) | `af53301a106bbd964` | 29.5 min | no |
| 4 (browser) | `a368d1c5a826e6370` | 43.9 min | no |
| 5 (browser) | `af7a0174de0a516b0` | 14.2 min | no |
| 6 (browser) | `a99bab1aff48176d3` | 49.6 min | no |

Sum of direct-child durations 241.1 agent-min over 218.8 wall min — a parallelism factor of **1.10**. The explorer wave ran at about 3.3×, wave 1 at 47.6 agent-min inside a 15.5 min window (**3.07×**), and waves 2–6 at exactly **1.00×**: 167.4 agent-min of single-threaded work occupying 169.4 wall min, **77.4 % of the item's total clock**.

### Time by category

| Category | Minutes | % of 219.0 | Basis |
|---|---|---|---|
| Orientation / reading | 8.0 | 3.7 % | P1 active (4.0) + the explorer-absorption half of P2 |
| Planning — writing and revising the map | 5.2 | 2.4 % | rest of P2 active (9.2 total) |
| Sub-agent dispatch — waiting on test-writing waves | 182.1 | 83.2 % | P3–P8 blocked: 12.7 + 30.3 + 30.4 + 44.6 + 14.2 + 49.9 |
| Review cycles — waiting on the reviewer | 6.7 | 3.1 % | P9 blocked |
| Verification / ward by the operator | 0.0 | 0.0 % | the operator ran none, by design; the reviewer's build and 2 ward runs sit inside the 6.7 min above |
| Other — sign-off transcription (12 `modify-quest`), checklist re-fetch, `git status`/`git log`, signal | 17.0 | 7.8 % | P3–P9 active: 5.6 + 3.3 + 2.4 + 2.2 + 1.7 + 1.1 + 0.7 |
| | **219.0** | **100 %** | |

**Idle-or-stall is a slice of the two waiting rows, not a row of its own: of the 188.8 waiting minutes, 186.0 had at least one sonnet sub-agent live and only 2.8 (1.3 % of the item) had nothing in flight.**

---

## 2. Chronological token buckets

`python3 tmp/transcript-digest.py buckets 6509cd6e-205f-4938-88eb-a5051d77a6d3 --minutes 12`

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/6509cd6e-205f-4938-88eb-a5051d77a6d3.jsonl
LINES     460
START     2026-09-02T16:13:31.950000+00:00
END       2026-09-02T19:52:25.084000+00:00
WALL      3:38:53.134000  (218.9 min)

BUCKETS of 12 min
WINDOW              APIs  CALLS   OUT-TOK    CTX-IN-TOK  RESULT-BYTES  TOP TOOLS
09-02 16:13-16:25    63     26   153,830    11,138,078       376,665  Agentx4, Readx4, Editx4, ToolSearchx3
09-02 16:25-16:37    19      8    81,336     5,468,994        54,372  Agentx4, Editx3, mcp__dungeonmaster__modify-questx1
09-02 16:37-16:49    24      7    42,735     7,456,238        18,302  mcp__dungeonmaster__modify-questx5, Editx1, Agentx1
09-02 17:13-17:25    14      4    51,126     4,980,445        38,507  Readx2, mcp__dungeonmaster__modify-questx1, Agentx1
09-02 17:37-17:49     4      1    17,080     1,518,137            55  mcp__dungeonmaster__modify-questx1
09-02 17:49-18:01     6      2    27,043     2,333,831        15,677  mcp__dungeonmaster__modify-questx1, Agentx1
09-02 18:25-18:37     5      1    38,849     2,011,098            55  mcp__dungeonmaster__modify-questx1
09-02 18:37-18:49     3      1     6,194     1,234,943        11,357  Agentx1
09-02 18:49-19:01     8      2    27,227     3,359,551        12,076  mcp__dungeonmaster__modify-questx1, Agentx1
09-02 19:37-19:49    12      4    19,598     5,219,353        19,670  mcp__dungeonmaster__modify-questx1, mcp__dungeonmaster__get-qa-checklistx1, Bashx1, Agentx1
09-02 19:49-20:01     8      3     4,192     3,551,968           845  Bashx2, mcp__dungeonmaster__signal-backx1
```

Six 12-minute buckets are missing from that table entirely — 16:49–17:13, 17:25–17:37, 18:01–18:25, 19:01–19:37. In those 72 minutes the opus operator made **zero** API calls; every one of them was covered by a live sonnet sub-agent.

### Sub-agent spend, attributed to the bucket each sub-agent started in

| Bucket | Sub-agents started | Sub-agent output | Sub-agent cache_read | Sub-agent cache_creation |
|---|---|---|---|---|
| 16:13-16:25 | `a1eee9fe`, `a5a5603b`, `abaf7220`, `a154b36e` | 98,288 | 28,304,827 | 3,471,878 |
| 16:25-16:37 | `aa75fd37`, `a502373c`, `af12f6ca`, `aa69b8dc` | 244,393 | 58,460,113 | 2,081,978 |
| 16:37-16:49 | `ac15f6b7`, `a541080a` | 173,344 | 49,939,666 | 1,877,004 |
| 16:49-17:13 | — | 0 | 0 | 0 |
| 17:13-17:25 | `af53301a`, `a156e27c`, `a81241e1`, `a62e5173`, `a8bdbd18` | 150,693 | 31,064,129 | 1,473,473 |
| 17:25-17:49 | — | 0 | 0 | 0 |
| 17:49-18:01 | `a368d1c5` | 204,575 | 101,647,191 | 1,432,848 |
| 18:01-18:37 | — | 0 | 0 | 0 |
| 18:37-18:49 | `af7a0174` | 75,932 | 16,394,546 | 723,577 |
| 18:49-19:01 | `a99bab1a` | 194,621 | 53,061,631 | 3,115,650 |
| 19:01-19:13 | `a5c8412a` | 32,189 | 3,485,939 | 402,050 |
| 19:13-19:25 | `aa5bc319`, `af9ae53c`, `a89b752a` | 11,491 | 1,872,729 | 545,790 |
| 19:25-19:37 | `a883d0f3`, `a62063ff`, `a7b1d7f3` | 39,311 | 6,375,418 | 1,066,266 |
| 19:37-19:49 | `aa20ed24` (reviewer) | 31,263 | 14,200,518 | 669,013 |
| 19:49-20:01 | — | 0 | 0 | 0 |
| **Total** | 26 | **1,256,100** | **364,806,707** | **16,859,527** |

### Totals

| | input (uncached) | cache_read | cache_creation | context-in total | output | of which thinking |
|---|---|---|---|---|---|---|
| Main session (opus) | 332 | 47,011,626 | 1,260,678 | 48,272,636 | 469,210 | 149,639 |
| 26 sub-agents (sonnet) | 3,786 | 364,806,707 | 16,859,527 | 381,670,020 | 1,256,100 | not broken out by the tool |
| **Grand total** | **4,118** | **411,818,333** | **18,120,205** | **429,942,656** | **1,725,310** | |

`cache_read` is 95.8 % of the whole context-in figure; `cache_creation` is 4.2 %. The single largest consumer in the tree is `a368d1c5a826e6370` at 101,647,191 cache_read tokens — 24.7 % of all cache_read in the item, from one 43.9-minute sub-agent.

---

## 3. Was the prompt fit for the work?

The rendered prompt is **34,282 characters**, well inside the 50,000-character `maxVerbatimChars` budget. I diffed it against `flowriderPromptStatics.prompt.template`: it is the template with `$ARGUMENTS` replaced by four lines and nothing else.

```
## Operation Context

Quest ID: 1be07040-b9ec-476c-a439-0b4fbb0123cd
Work Item ID: b52b4841-d3e6-431c-9138-5a4d018a5bd7
Operation Item ID: c0f5d521-29cb-4cf6-8db6-ecc012c8ab16
Your operation item: [flowrider] Flowrider: author the test suites that prove this flow — flow: render-images-in-transcript
```

**Finding — the work-item context block never rendered.** `workItemContextBlockStatics` defines `- packagesAffected:` and `- packageNames:` labels, and `workItemContextBlockTransformer` appends them when `get-agent-prompt` is called with both `questId` and `workItemId`. This call carried both (`get-agent-prompt(agent=flowrider questId=… workItemId=b52b4841…)` at 0.2m), yet the rendered prompt contains neither the string `Work item context` nor `packagesAffected`. The work item's own `packageNames` is `[]` in the index, so even a rendered block would have been empty — which is the deeper problem: **the flowrider was told which flow it owned and nothing about which packages that flow crosses.** It spent P1 and half of P2 (about 8 min, 4 sub-agents, 98,288 output tokens and 31.8 M context-in) discovering that the flow crosses `orchestrator`, `shared`, `server` and `web`. Those four package names exist on the codeweaver items [4], [6] and [9] that built this exact flow.

### Passages that drove behaviour, and what the agent did

**1. Step 1's flow-id extraction rule — worked exactly as designed.**

> **Your Operation Context carries four ids, not the flow.** Your flow's id is in the last of them: the `Your operation item:` line ends `— flow: <your flow>`. **Read it out of that line**

At `0.4m say: "My flow is \`render-images-in-transcript\`. Let me fetch it and load the tools I need."` — first try, no wrong call, no `stage`-beside-`flowId` refusal.

**2. The layer-per-observable rule — the single most valuable passage in the prompt for this item.**

> `ui-state` — you reach for jsdom on a painted claim. jsdom has no layout engine. Every measured width reads 0.

The operator's closing message names this as the substance of the operation: *"Codeweaver had proved most of the `ui-state` units in jsdom, which has no layout engine, never fetches an `img` src and never decodes an image — so every painted claim reads 0 there. All of them moved to a real browser."* That decision produced 100 real Playwright cases where a cheaper reading would have produced roughly 100 jsdom assertions proving nothing. It also produced the arbitrary-file-read finding: only a real HTTP exchange could show `path=/etc/passwd` returning **200, 3546 bytes, `Content-Type: image/png`** once `imageContentTypeTransformer` was broken.

**3. "Another track's sign-off never shrinks your list" — obeyed, and it mattered.**

> **Every `[ ]` unit on the checklist is yours to prove, whatever marks the graph carries beside it.** Do not open another track's tests to decide whether one still counts — write yours.

67 units on the checklist, 67 addressed (68 after the operator added one). The operator never opened a codeweaver test to argue a unit away.

**4. The grouping rule — obeyed, and it cost 169 minutes.**

> **Grouping is by file, with one extra rule: never two browser walks against the same package at once.** Playwright writes one report path per package.

> **Two browser walks against the same package never go out together.** … Give each browser walk its own group.

The map encodes this literally:

```
GROUP 2  (browser walk #1 — packages/web · creates the new harness)
GROUP 3  (browser walk #2 — packages/web · NEVER beside group 2)
GROUP 4  (browser walk #3 — packages/web · NEVER beside groups 2/3 · TWO files, ONE agent, ONE ward run)
GROUP 5  (browser walk #4 — packages/web · NEVER beside groups 2/3/4)
GROUP 6  (browser walk #5 — packages/web · NEVER beside groups 2/3/4/5)
```

Every browser unit on this flow lives in `packages/web`, so the rule collapsed five groups into a five-deep chain. The operator did try to widen it — group 4 carries "TWO files, ONE agent, ONE ward run", which is the only lever the rule leaves — and that agent then became the 43.9-minute one.

The constraint the rule protects is real and I located it. `packages/ward/src/brokers/check-run/e2e/check-run-e2e-broker.ts:132-134`:

```typescript
const jsonReportPath = filePathContract.parse(
  `${projectFolder.path}/.ward-playwright-report.json`,
);
```

…passed at line 143 as `PLAYWRIGHT_JSON_OUTPUT_NAME`. One fixed path per package, no run nonce. Two concurrent `npm run ward -- --only lint,test -- packages/web/...` runs genuinely do clobber each other's report. Note that the *ports* are already safe — line 129 takes `await netFreePortAdapter()` per run — so the report path is the only thing standing between this item and a 4× speedup on its dominant cost.

**5. Step 6 — ignored outright.**

> ### 6. Read what was written
> ```
> git diff
> ```
> Read the whole diff. … **Check for units your map covered that no test actually carries.** A sub-agent that quietly dropped one is the common failure.

**The operator ran `git diff` zero times.** Its complete Bash history for the session is five commands: `ls -la .quest-plans/`, `git log --oneline -12 --name-only`, `git status --short` (211.3m), `git status --short` (218.5m), `git log --oneline -3` (218.5m). Its complete source-file Read history is two files, both from wave 2 — `transcript-renders-images.e2e.ts` and `transcript-images.harness.ts` at 17:15:31 and 17:16:22. Ten of the twelve files this operation produced were never opened by the operator.

The evidence why is structural, not lazy. Step 5 says *"Work EVERY group on your map, in order, before you go to step 6"* and *"Sign this group's PROVED lines NOW, before you send the next group… you have not opened the test, so you are transcribing, not judging."* By the time step 6 arrives, the operator has already signed all 68 units and the diff is 3,564 lines across 13 files. At `211.5m` it said *"Verifying that against the checklist, and reading what actually changed"* and then ran `git status --short` — substituting a filename listing for a diff read. Its two sibling flowriders both did better on the same prompt: the first flowrider session (FR1) (`5c841160`) read nine of its produced spec files at 11:43–11:45, and the second flowrider session (FR2) (`42edd7ea`) ran `git diff --stat` at 15:52:04 followed by three `python3` passes extracting assertion text from the specs. This flowrider is the only one of the three that read essentially nothing back.

**6. "Write a FILE MAP and terse instructions. Never prose."** — followed in form, but the required shape is not compressible. Brief sizes: explorers 2,695–3,529 chars; wave 1 test writers 5,174–7,115; browser waves 10,484–14,609; reviewer 229. Wave 4's 14,609-char brief carried 19 units, each needing `SURFACE:` / `ASSERT:` / `FAILS IF:` verbatim — about 770 chars per unit, which is close to the floor the prescribed shape allows. The prompt's "terse" instruction and its own mandatory brief template are in tension on any wave carrying more than about ten units.

**7. The one instruction the prompt is missing.** At 25.8m a `modify-quest` call was refused:

> `Structural validation failed:\n- [FAIL] Input Allowlist: Sign-off on observable 'check-text-only-still-compares' … also writes 'description' — an observable carrying a sign-off may carry only its id and its sign-off fields; a sign-off is evidence about the unit as it stands, so one call may not both sign it and rewrite it — send the sign-off and the edit as two separate modify-quest calls`

The "Recording what you claim" section never mentions this. Recovery cost about 30 s and two extra calls (`25.9m` and `26.1m`) — small, but it is the same lesson every flowrider will learn by hitting the wall.

**8. Nothing significant had to be invented.** The one place the operator went beyond the page was grandchildren: the prompt never mentions that a test-writing sub-agent may itself dispatch sub-agents, and three of them did (12 in total). See §5 finding 5.

---

## 4. What went well

**Reading the sibling flowrider's map instead of re-deriving the house pattern.** At `16:15:29` the operator read `.quest-plans/339d7ed2-…-map.md` — the second flowrider session's (FR2's) map for `send-message-with-images` — and at 16:15:43/16:15:44/16:16:36 the three codeweaver maps for its own flow (`332e0da3` web, `83c9f2ce` server, `8857ed98` orchestrator). Total 58 KB of Read. At `3.5m say: "the sibling flowrider's map gives me the house pattern: server integration tests extend a flow's .integration.test.ts, browser walks are packages/web/src/flows/quest-chat/…"`. This is the cheapest orientation in the whole item and it settled the file layout for all six waves.

**`SendMessage` back into a live explorer rather than a fresh agent.** Twice — `4.4m` to `a1eee9fee730548f3` and `5.5m` to `a5a5603b40804f402`. Both follow-ups decided a group's layer. A fresh sub-agent would have re-paid the 6.5 M and 5.8 M cache-read those explorers had already built. Cost of the two follow-ups: 434 bytes of tool result.

**The linchpin question was asked before the map was written, not after.** At `2.6m say: "One linchpin is unclear: can an e2e spec seed a session transcript and get it replayed into the browser? Dispatching a fourth explorer on exactly that."` The answer at `7.8m` — yes, `sessionHarness.createSessionFile` writes to the path `chatHistoryReplayBroker` reads — is what let every transcript-side unit be proved in a real browser instead of dropping below one. A 3.7-minute, 24,943-token explorer decided the layer of roughly 40 units.

**Signing group-by-group produced a real spec correction instead of a green lie.** At `26.2m say: "check-text-only-still-compares said a message with no images 'normalises to itself unchanged.' That isn't true: the transformer trims trailing whitespace, so a whitespace-only string normalises to ''. The sub-agent measured that value with node rather than assuming it."` The observable was rewritten and then signed against the rewritten text — two `modify-quest` calls, about 30 s.

**The defect-not-verdict discipline held three times.** Wave 3 measured the overlay at 864 px where the spec says 960 px and the operator recorded `unconfirmable` with a `toSettle` rather than signing (`95.6m`). Wave 4 produced the arbitrary-file-read demonstration. Wave 6 reproduced the duplicate-bubble defect end to end. None of the three was converted into a green check.

**The reviewer was fast, thorough, and found something outside its own scope.** `aa20ed24786aba447`: 6.8 min, 87 turns, 31,263 output tokens, 14.2 M cache_read. It opened all 11 test files in full, cross-checked every asserted literal against real source, ran `npm run build` (green, 13 packages) then `npm run ward -- --staged` (green) — and then noticed the green was hollow:

> `npm run ward -- --staged` came back green but I discovered it structurally misses **untracked** new files (`git diff` against a merge-base never lists `??` paths), so it silently skipped lint/e2e on the 6 brand-new files this pass added. I compensated with a second, explicitly-scoped `npm run ward -- --only lint,e2e -- <those 6 files>`, which came back green (7 files linted, 6 e2e files / 100 cases passed) — both ward runs used, per the "twice at most" budget.

It filed the gap against `packages/ward/src/brokers/git/diff-unpushed/git-diff-unpushed-broker.ts`. That is a defect in the repo's own pre-push gate, found by a sonnet sub-agent in under seven minutes, and it affects every session in every repo that trusts `--staged`.

**Zero forbidden git verbs across 26 agents.** No `git checkout --`, no `git stash`, no `git reset`, no `git -C`, no chained/piped git — verified by regex over all 26 transcripts. Every red-first revert was done by editing the line back, as the brief's `RED FIRST` block requires, and confirmed with a read-only `git diff --stat` or `git status --porcelain` showing empty.

---

## 5. What agents did that they should not have

### 1. Five browser waves ran strictly one at a time — 169.4 min, 77.4 % of the item's wall clock

**What happened.** Waves 2–6 each contained exactly one `Agent` call: `31.5m`, `65.1m`, `97.9m`, `144.7m`, `160.6m`. Their gaps were 1820 s, 1822 s, 2673 s, 855 s and 2995 s. 167.4 agent-minutes of work occupied 169.4 wall minutes at a parallelism factor of 1.00, against 3.07 for wave 1.

**Cost.** If waves 3–6 had run together after wave 2 built the harness, the chain would be 30.2 + max(29.5, 43.9, 14.2, 49.6) = 79.8 min instead of 169.4 min — **about 89.6 minutes, 41 % of the item's total clock.** Token cost is unchanged; this is pure latency.

**Prompt status: REQUIRED, twice.** *"never two browser walks against the same package at once"* and *"Two browser walks against the same package never go out together."* The operator applied it correctly.

**But the operator also welded a second lock on.** Every one of waves 3, 4, 5 and 6 was briefed as `packages/web/test/harnesses/transcript-images/transcript-images.harness.ts extend` — the same 907-line file, four times. Even with the Playwright report rule lifted, those four waves could not have gone out together, because the prompt's own file-grouping rule forbids two sub-agents editing one file. The map put a shared, still-growing harness across five waves and thereby guaranteed the chain from its own side.

### 2. Step 6 was skipped entirely — no `git diff`, 10 of 12 produced files never opened

**What happened.** Zero `git diff` calls in 219 minutes. Two source Reads, both wave 2. At `211.5m` the operator wrote *"reading what actually changed"* and ran `git status --short`.

**Cost.** Not measurable in minutes saved — it is a risk cost, and it landed. §5 finding 10 lists two vacuous-negative assertions the prompt's own evidence contract names as reject-on-sight, sitting in files the operator never opened and then signed units against. It also means the operator's zero rework cycles cannot be read as "the briefs were perfect"; nothing in this session was positioned to generate a rework except the reviewer.

**Prompt status: REQUIRED and ignored.** *"Read the whole diff. Three questions… Check for units your map covered that no test actually carries."* Both sibling flowriders did more here on the identical prompt.

### 3. Sixteen `npm run build` calls by six of nine test writers, against an explicit ban in their own briefs

**What happened.** Every test-writing brief carried, verbatim, `no npm run build · no run-ward MCP tool · no commit · never widen the ward`. Six sub-agents ran it anyway:

| Agent | Builds | First call |
|---|---|---|
| `aa75fd37057fc2edd` | 6 | `16:34:59 npm run build 2>&1 | tail -n 40` |
| `a99bab1aff48176d3` | 5 | `19:08:10 npm run build 2>&1 | tail -30` |
| `a502373cced56c9dd` | 2 | `16:30:17 npm run build 2>&1 | tail -30` |
| `aa69b8dc1d2069fed` | 1 | `16:33:46 npm run build 2>&1 | tail -40` |
| `ac15f6b7d0e9a79ee` | 1 | `17:11:13 npm run build 2>&1 | tail -30` |
| `a368d1c5a826e6370` | 1 | `18:10:48 npm run build 2>&1 | tail -40` |

Three of them overlapped inside wave 1: `16:30:17`, `16:30:46`, `16:33:46`, `16:34:59`. That is precisely the hazard the flowrider prompt names — *"Ward runs it as `tsc -b`, which writes the shared `dist/`, so a wave of sub-agents running it at once hands each other type errors on correct code."* No failure in this run traced back to it, but the collision happened.

Every one of the 16 was piped (`2>&1 | tail -n`), which the `<dungeonmaster-wardDiscipline>` snippet forbids because it discards the exit code. Two agents noticed and bolted on `; echo "EXIT:$?"`.

**Cost.** About 16 builds times roughly 30–60 s is about 8–16 sub-agent minutes, mostly inside gaps that were blocked anyway, so the wall cost is small. The real cost is that a one-line prohibition in a 14,000-character brief failed **six times out of nine**.

**Prompt status: FORBIDDEN, by both the parent's `[BUILD]` rule and the child's own `PROVE` block.**

### 4. Thirty-one raw `npx playwright test` invocations by three sub-agents

**What happened.** `a368d1c5a826e6370` ×19, `af53301a106bbd964` ×9, `af7a0174de0a516b0` ×3. Example: `cd .../packages/web && npx playwright test src/flows/session-view/transcript-image-overlay.e2e.ts --grep "three-quarters" --reporter=list 2>&1 | tail -80`. All were scoped to one spec; none was a bare full run.

**Prompt status: not named in the brief's `PROVE` block, but forbidden by the session snippet** (*"ALWAYS use `npm run ward`. Never `npx jest`/`eslint`/`tsc`/`playwright`"*). Note this is also a `cd` into a package, which the ward-discipline snippet forbids separately. Used as an inner debug loop before the final scoped ward, so it did not corrupt any result — but it is 31 runs of a tool the repo says to never call directly, and it is how the "one report path per package" hazard would actually be hit, since these bypass ward's per-run port allocation.

### 5. Twelve undeclared grandchildren, re-reading what the explorer wave had already read

**What happened.** Three test writers spawned sub-agents of their own: `ac15f6b7` ×1, `af53301a` ×4, `a99bab1a` ×7. The prompt says nothing about grandchildren in any direction.

At least ten of the twelve re-read files the top-level explorers had already read in full. `a541080a25523e3c5` re-read `quest-chat-flow.tsx`, `session-view-flow.tsx`, `normalise-chat-content-transformer.ts`, `chat-message-widget.tsx`, `image-content-layer-widget.tsx` and `chat-panel-widget.tsx` — all six already read verbatim by explorer `abaf7220f594d5cb5` twenty minutes earlier. `a81241e1198f84b9b` re-read `packages/web/playwright.config.ts` and `packages/web/test/harnesses/e2e-fixtures.ts`, each already read by two different explorers.

They also duplicated each other. Under `a99bab1a`: `a5c8412a` and `aa5bc319` both read `agent-launch-broker.ts`, `chat-main-session-tail-broker.ts` and `chat-start-responder.ts`; `a62063ff` and `a7b1d7f3` both read `quest-driven-watchers-bootstrap-responder.ts` and `reconcile-watchers-layer-responder.ts`. Under `af53301a`: `a156e27c` and `a62e5173` both read `web-config-statics.ts`.

**Cost.** The 12 grandchildren burned 152,393 output tokens and 26,431,271 context-in tokens. A conservative half of that is rediscovery.

**Prompt status: PERMITTED by omission.** The brief template has a `FIRST` line and a `MIRROR` line but no line saying "your parent already ran recon; here is what it found."

### 6. Ward re-run churn — two agents ran an identical scoped command four times

`a502373cced56c9dd` ran `npm run ward -- --only unit -- packages/server/src/responders/server/init/server-init-responder.test.ts` at 4.19m, 4.59m, 5.27m and 5.92m. `aa69b8dc1d2069fed` ran `--only unit -- normalise-chat-content-transformer.test.ts` at 6.61m, 8.63m, 8.95m and 9.58m. Total ward invocations across the nine test writers: 50, all scoped, none bare, none `--staged`, none via the `run-ward` MCP tool. **Zero `run-ward` MCP calls anywhere in the tree** — that ban held perfectly.

**Prompt status: not forbidden.** The ward-discipline snippet says *"Run it ONCE"*, but that is written for full runs, and these were single-file iteration loops.

### 7. Wave 6 spent 30.5 min (61 % of its run) redesigning the same spec three times — and it was scheduled last, alone

**What happened.** `a99bab1aff48176d3` ran 49.6 min. Its v1 spec was written at 12.5–13.9m and passed red-first at 15.9m against a design that turned out unworkable. It then dispatched all seven of its grandchildren and rewrote the spec twice more:

- `16.8m CALL discover(glob=packages/orchestrator/src/** grep=chat-output)`
- `17.6m CALL Agent(description=Research live chat-output delivery mechanism for a resumed session …)`
- `29.5m say: "Now I understand the real delivery mechanism much better. The naive 'just wait for a file-tail' approach doesn't work because the file path is randomly generated server-side…"`
- `32.1m CALL Write(…transcript-replaces-optimistic.e2e.ts)` — rewrite #2
- `47.1m CALL Write(…transcript-replaces-optimistic.e2e.ts)` — rewrite #3, then a third full red-first cycle at 48.1–48.7m

**The operator knew.** Its map carries a section headed `## The one unit most likely to come back NOT PROVED`, and at `159.7m say: "Sending the last wave — the full loop, and the one I flagged in the map as most likely to come back unproved."* It scheduled its highest-variance work **last and alone**, so every minute of that 30.5-minute redesign was 30.5 minutes of the parent's wall clock with nothing else running.

**Cost.** About 30 min of serialised wall clock, 194,621 output and 56.2 M context-in tokens. **Prompt status: PERMITTED.** The prompt orders groups by file, and says nothing about ordering by risk.

### 8. `a368d1c5a826e6370` spent ~14 min on library archaeology and a throwaway probe file

Longest churn stretch 20.8m to 30.2m (about 9.4 min): reading `node_modules/hono` and `node_modules/@hono/node-server` source through `python3` and `node -e` one-liners to establish default content-type-on-empty-body behaviour. Then 32.5m to 37.3m (about 4.8 min) writing a throwaway `zzz-debug-state.e2e.ts` probe **six times** (33.7, 34.3, 34.5, 34.6, 34.8, 34.9m) before concluding at 37.1m: *"Playwright retires the worker process after any test failure, wiping module-level state."* The probe was deleted. Both stretches produced durable knowledge, and the second one changed the shape of `image-route-answers.e2e.ts:186-190` (statuses collected inside one test rather than accumulated across tests). But roughly 14 min of a 43.9-min sub-agent went into learning two library facts the repo now has nowhere written down.

### 9. Orientation re-derived the shared test substrate a third time

Explorer file reads, by flowrider:

| Flowrider | Explorers | Wall | Output tokens | Context-in | Distinct files read |
|---|---|---|---|---|---|
| [13] `5c841160` paste-image-into-composer | 2 | 3.8 agent-min | 23,254 | 5,402,622 | 33 |
| [14] `42edd7ea` send-message-with-images | 2 | 6.7 agent-min | 38,516 | 13,729,740 | 46 |
| [15] `6509cd6e` render-images-in-transcript | 4 | 19.3 agent-min | 98,288 | 31,777,269 | 65 |

**14 of this item's 65 explorer-read files (22 %) had already been read by an earlier flowrider's explorer**, and they are overwhelmingly the shared e2e substrate rather than flow-specific code:

```
packages/web/playwright.config.ts
packages/web/test/harnesses/e2e-fixtures.ts
packages/web/test/harnesses/claude-mock/claude-mock.harness.ts
packages/web/test/harnesses/claude-mock/bin/claude
packages/web/test/harnesses/quest/quest.harness.ts
packages/web/test/harnesses/environment/environment.harness.ts
packages/server/test/harnesses/server-app/server-app.harness.ts
packages/server/src/statics/api-routes/api-routes-statics.ts
packages/shared/src/statics/pasted-image/pasted-image-statics.ts
packages/web/src/statics/web-config/web-config-statics.ts
packages/web/src/widgets/image-overlay/image-overlay-widget.tsx
packages/server/src/flows/images/images-flow.ts
packages/server/src/flows/images/images-flow.integration.test.ts
packages/server/src/startup/start-server.ts
```

**Cost, pro-rated by file share:** about 4.2 explorer agent-minutes and about 7.0 M context-in tokens on this item alone, and the same tax was paid on items [13] and [14]. The wall-clock cost is small (the explorers ran 4-wide inside a roughly 6-minute window); the token cost is not. File-count share is a proxy, not a direct token measurement — I flag it as such.

A second, larger duplicate: the standards triple (`get-architecture` 19,056 B + `get-syntax-rules` 24,528 B + `get-testing-patterns` 51,401 B = **94,985 bytes**) was fetched **eleven times** in this session tree — once by the operator and once each by all ten test-writing/reviewing sub-agents — for about 1.04 MB of identical text. That is required by the prompt (*"Load the repo's standards first"* and `FIRST get-architecture, get-syntax-rules, get-testing-patterns` in every brief), so it is a design cost, not a violation.

### 10. Two vacuous negatives shipped, and the reviewer said there were none

**The answer to "were tests written that assert wiring rather than behaviour" is mostly no.** Across 121 runtime cases in 10 files, six of the ten files contain no weak assertion at all. `transcript-image-path-encoding.e2e.ts` polls `naturalWidth` to nine *distinct* expected widths (29/28/31/33/35/37/39/41/43) so a fixed-placeholder pass is impossible. `image-serve-responder.test.ts` pairs its negative with a genuine positive control in the same file. This is a strong suite.

Three exceptions, one of which is a shape the prompt's own evidence contract lists as reject-on-sight:

**(a) Vacuous negatives — the flow-evidence contract's named false green, twice.** The contract says: *"**Vacuous negatives.** Assert a count of 0, or an absence, only where the same suite shows that selector reaching non-zero."*

- `packages/web/src/flows/session-view/transcript-renders-images.e2e.ts:160` — `expect(consoleErrors.getErrors()).toStrictEqual([]);`
- `packages/web/src/flows/session-view/transcript-broken-image.e2e.ts:257` — `expect(pageErrors.getErrors()).toStrictEqual([]);`
- `packages/web/src/flows/session-view/transcript-renders-images.e2e.ts:239` — `await expect(page.getByText(String(images.getPromptInstructionText()))).toHaveCount(0);`

Nowhere in the 3,564-line diff does any test deliberately trigger one of those recorders or make that locator match. A recorder wired to nothing, or a `getPromptInstructionText()` that returns a string no element ever carries, passes all three forever. The reviewer's return says: *"Found no weak assertions, no existence-only claims, no vacuous negatives."* That claim is wrong on its own contract's terms, and the operator, having never opened either file, had no position from which to catch it.

**(b) A `toBeVisible()` standing in for a content claim.** `transcript-image-overlay.e2e.ts:485-486`:

```
await expect(page.getByTestId('IMAGE_OVERLAY')).toHaveCount(0);
await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toBeVisible();
```

The test's own claim is that the transcript image is *still rendered* after the overlay closes. `toBeVisible()` never re-checks `src`, so a regression that leaves the `<img>` element present with a blank or broken `src` passes. The prompt forbids exactly this: *"**One assertion per unit, asserting what it actually says**: exact text, exact count, exact state. Never a weaker `toBeVisible()` stand-in."*

**(c) A disclosed-inert canary.** `image-route-answers.e2e.ts:150-151` filters response headers for a canary string and asserts `leaked: []`. The harness's own comment at `transcript-images.harness.ts:298-304` states the canary is *"inert by construction"* for 8 of the 10 matrix rows — only the LF and CR rows can carry it. A disclosed tradeoff rather than an oversight, but 80 % of that assertion's rows cannot fail.

**Not this pass's fault, for the record:** `server-init-responder.test.ts:233` (`expect(sendCallCount).toBe(1)`) and `:945-948` (`expect({aCount, bCount}).toStrictEqual({aCount: 1, bCount: 1})`) are call-count-only assertions with no payload check, but both pre-date this commit — this pass touched only 3 of that file's 36 cases, and the 3 it touched were upgraded from 1-session/1-client to 2-session/2-client ordered-pair assertions.

### 11. The suites did not catch what the siegemasters found

This flow's own siegemaster has not run — item [16] is `paste-image-into-composer` (session `346c75d4`, complete) and item [17] is `send-message-with-images` (session `8ffd3cb9`, still `pending`). Between them those two sessions enumerated 25 distinct defects. **Three are explicitly tagged or attributed to `render-images-in-transcript`, and no assertion in commit `99587913a` would have caught any of them.**

| Siegemaster finding | Caught by 99587913a? | Why not |
|---|---|---|
| `transcript-image-unbounded-render` (`346c75d4`, ~96.5m) — *"The transcript's CHAT_MESSAGE_IMAGE renders with no size bound, the same defect just fixed on the composer side."* A 2000×1333 image grows its container to ~610 px of an 813 px viewport. | **No** | `transcript-renders-images.e2e.ts` asserts only `naturalWidth` — intrinsic decode dimensions, seeded at 8–24 px, never large. `transcript-image-overlay.e2e.ts` does test size capping, but on the *modal*, a different box. No file asserts any painted bound on the un-clicked inline thumbnail. |
| `failed-send-leaves-duplicate-optimistic-bubble` (`346c75d4`, ~539m) — a failed send's optimistic bubble is never removed, so a successful retry shows one message twice (two bubbles, two files on disk, not four). | **No** | `transcript-replaces-optimistic.e2e.ts` is a single test and drives only the successful first-attempt send. Nothing in the commit simulates a failed POST followed by a real retry. |
| `siege-transcript-bubble-renders-plain-text` (`8ffd3cb9`, ~163.9m) — the `YOU:` bubble rendered as plain text with no thumbnail, no broken-image placeholder, and no `[Pasted Image N]` token either; the walker's note explicitly attributes it to `render-images-in-transcript`. | **No** | `transcript-broken-image.e2e.ts` covers a missing file, which always renders `CHAT_MESSAGE_IMAGE_BROKEN` — never "nothing at all." No file exercises the create-surface first-message path with a live spawned agent. |

One further overlay report (`IMAGE_OVERLAY_IMAGE.src` empty in the MCP-driven browser tab) was **not** a production defect: the fixer's own review established it reproduces only in the walker's automation tab where `requestAnimationFrame` is frozen, and `transcript-image-overlay.e2e.ts` passes 8/8 in real Chromium on that exact path. The flowrider's suite actively disproved a false siegemaster report there.

The other 22 defects belong to `paste-image-into-composer`, `send-message-with-images`, or neither flow — composer paste handling, IndexedDB drafts, the five-image cap race, spawn `--add-dir` permissions, a phantom-quest routing bug. Those are not this item's gaps.

**Prompt status.** Nothing in the flowrider prompt would have produced these three tests. The checklist listed 67 units and the operation proved 68; the units for "the inline thumbnail is bounded" and "a failed send's optimistic bubble is removed" did not exist on the flow. This is a spec-completeness failure upstream of the flowrider, not a flowrider failure — with one caveat: the prompt tells the flowrider *"A defect you measure is a new observable"* and *"You may add, edit and delete freely,"* and the operator did add one observable, so the machinery for closing these gaps was available and simply never pointed at un-specified surfaces.

---

## 6. Suggested fixes

Ranked by estimated saving. Estimates are for one flowrider item of this size; the first three recur on every flowrider in every quest.

### 1. Give the Playwright JSON report a per-run path, then relax the one-browser-walk-at-a-time rule — **≈90 min per flowrider item**

**File:** `packages/ward/src/brokers/check-run/e2e/check-run-e2e-broker.ts:132-134`.

```typescript
// now
const jsonReportPath = filePathContract.parse(
  `${projectFolder.path}/.ward-playwright-report.json`,
);
// change to a per-run name, keyed the way the ports already are
const jsonReportPath = filePathContract.parse(
  `${projectFolder.path}/.ward-playwright-report-${serverPort}.json`,
);
```

The port is already unique per run (`await netFreePortAdapter()` at line 129), so this needs no new source of entropy and no new state. Add a cleanup unlink after `playwrightJsonReportToPassingTransformer` reads it, and update `check-run-e2e-broker.proxy.ts:135` to match.

**Then** edit `packages/orchestrator/src/statics/flowrider-prompt/flowrider-prompt-statics.ts` in two places — the step-4 grouping rule and the step-5 dispatch rule — replacing *"never two browser walks against the same package at once"* with the file-overlap rule that actually still applies: *"Two sub-agents never edit one file. Browser walks against the same package MAY go out together, as long as no two of them touch the same spec or harness."*

Measured basis: waves 2–6 were 169.4 wall min at 1.00× parallelism; wave 1 hit 3.07× with four concurrent agents. 30.2 + max(29.5, 43.9, 14.2, 49.6) = 79.8 min. **Saving about 89.6 min, 41 % of this item.**

### 2. Make the harness a first-class wave-0 artifact, never a file four later waves extend — **enables fix 1; ≈0 min on its own**

**File:** `flowrider-prompt-statics.ts`, step 4 map template. Add after the `GROUP` block:

> **A harness every later group needs is its OWN group, built complete and never touched again.** A harness a later group still extends is a file two groups share, and shared files cannot go out together — one growing harness serialises every group that reads it.

Waves 3, 4, 5 and 6 were all briefed `transcript-images.harness.ts extend`. Without this, fix 1 buys nothing.

### 3. Move the diff read from step 6 into step 5, per group — **catches the two vacuous negatives; ≈0 min**

**File:** `flowrider-prompt-statics.ts`. Step 6 as written (*"### 6. Read what was written / `git diff` / Read the whole diff"*) asks for a 3,564-line read after all signing is done, and was skipped outright here. Fold it into step 5, immediately before the sign-off instruction:

> **Before you sign this group, run `git diff -- <this group's paths>` and read it.** One group's diff is a few hundred lines and the units are still in front of you. Check three things: does each assertion say what its unit says; is it at the layer you chose; and does any `toStrictEqual([])`, `toHaveCount(0)` or absence assertion have a positive control in the same file showing that selector reaching non-zero? A negative with no positive control is a vacuous negative — send it back out.

Step 6 then shrinks to the cross-group question only ("which units does no test carry"). Both sibling flowriders read their output back; this one did not, and the two vacuous negatives at `transcript-renders-images.e2e.ts:160` and `transcript-broken-image.e2e.ts:257` are what got through.

### 4. Turn the sub-agent build ban into a mechanic with a substitute — **≈8–16 sub-agent min, removes a concurrent-`dist/` corruption hazard**

**File:** `flowrider-prompt-statics.ts`, the `PROVE` block of the brief template. `no npm run build` failed 6 of 9 times. The agents ran it to check types. Replace the bare prohibition with the reason plus the alternative:

```
PROVE
  npm run ward -- --only lint,test -- <this brief's own paths>
  DISCOVERY MISMATCH on a check type = ward answering, not failing. --passWithNoTests is never the fix.
  NEVER npm run build, and never npx playwright/jest/tsc/eslint.
    Build writes the shared dist/ that every sibling sub-agent in your wave is reading right now —
    running it hands them type errors on correct code. If you hit a type error you cannot resolve
    from the file in front of you, say so in NOT PROVED and return; your reviewer's --staged run is
    the typecheck and it runs after every wave is in.
  no run-ward MCP tool · no commit · never widen the ward
```

### 5. Hand sub-agents the recon their parent already paid for — **≈13 M context-in tokens per item**

**File:** `flowrider-prompt-statics.ts`, brief template. The 12 grandchildren burned 152,393 output and 26.4 M context-in re-reading files the explorer wave had already read. Add a `RECON` line to the required brief shape, between `MIRROR` and `TRAPS`:

```
RECON
  <the file:line facts my explorers already established for this file — paste them.
   Do not re-derive these. If you need something not here, ask me with one question in your
   return rather than dispatching your own sub-agent.>
```

And add one sentence to the prompt's own "Briefing a sub-agent" preamble: *"A sub-agent you brief may dispatch sub-agents of its own, and it will re-read everything your explorers read unless you paste what they found. Paste it."*

### 6. Write the shared test substrate down once per quest — **≈4 explorer agent-min and ≈7 M context-in per flowrider after the first**

**File:** `flowrider-prompt-statics.ts`, step 4. The 14 overlapping files are the same harness set every flowrider on a web quest re-discovers. Add:

> **Before you dispatch explorers, read `.quest-plans/` — a sibling flowrider's map is there.** Take its `## Facts the whole map rests on` section whole; the e2e harness set, the testids and the fixture seams do not change between flows on one quest. Then append what YOUR flow adds under the same heading, so the next flowrider takes yours.

This operator already read the second flowrider session's (FR2's) map voluntarily (`16:15:29`) and called it *"the house pattern"* — the fix makes the free half of that mandatory and the give-back half explicit.

### 7. Schedule the riskiest group first, not last — **≈15–30 min on an item with a flagged unit**

**File:** `flowrider-prompt-statics.ts`, step 4. The map here contains a section literally headed `## The one unit most likely to come back NOT PROVED`, and that group went out last and alone, at 160.6m, and spent 30.5 of its 49.6 minutes on three full rewrites. Add to the grouping rules:

> **Order groups by risk, not by flow order.** A group you expect to come back `NOT PROVED` goes out FIRST, beside the groups you are confident in — its rework then overlaps their work instead of running alone at the end of the chain. If you can name the unit most likely to fail, its group is group 1.

### 8. Fix `ward --staged`'s blindness to untracked files — **prevents a false green on every new file in the repo**

**File:** `packages/ward/src/brokers/git/diff-unpushed/git-diff-unpushed-broker.ts`. Found by the reviewer, filed, not fixed. `git diff` against a merge-base never lists `??` paths, so `npm run ward -- --staged` silently skipped lint and e2e on all six brand-new specs and still reported green. Union the diff result with `git ls-files --others --exclude-standard`. This is outside the flowrider's scope but it is the most consequential defect the item surfaced, and it makes the repo's documented pre-push gate unsound for exactly the case a flowrider produces most of — new files.

### 9. Document the sign-and-edit refusal in the prompt — **≈30 s per flowrider**

**File:** `flowrider-prompt-statics.ts`, the "Recording what you claim" section. Add one line under the `modify-quest` block:

> **One call may not both sign a unit and rewrite it.** A sign-off is evidence about the unit as it stands, so an observable carrying a `flowriderSignoff` may carry only its id and its sign-off fields. Sharpen the text in one call, then sign against the sharpened text in a second.

### 10. Add the missing observables to this flow before its siegemaster runs — **prevents 2 of 3 known-open defects reaching a human**

**File:** the quest's `render-images-in-transcript` flow, via `modify-quest`. Two units do not exist and therefore could not have been proved:

- On the `render-inline` node: an observable that the inline `CHAT_MESSAGE_IMAGE` is painted within a bound (`max-width` / `max-height` / `object-fit`), measured in a real browser with a deliberately oversized seed — the mirror of the composer-side fix, and the shape `transcript-image-overlay.e2e.ts:264-270` already demonstrates for the modal.
- On the `drop-optimistic` node: an observable that a FAILED send's optimistic bubble is removed, so a successful retry leaves exactly one bubble for one file on disk.

Both are directly writable as extensions of files this pass already created (`transcript-renders-images.e2e.ts`, `transcript-replaces-optimistic.e2e.ts`) using the existing `transcript-images.harness.ts`. Structurally: the flowrider prompt's *"A defect you measure is a new observable"* only fires on defects the session happens to trip over. Nothing in the role asks "what surface does this flow have that no unit covers?" — a `## UNCOVERED SURFACES` prompt in `get-qa-checklist`'s render, or a step-3 instruction to compare the flow's node set against its observable set, would close that class.

---

## 7. Raw figures appendix

### `python3 tmp/transcript-digest.py summary 6509cd6e-205f-4938-88eb-a5051d77a6d3`

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/6509cd6e-205f-4938-88eb-a5051d77a6d3.jsonl
LINES     460
START     2026-09-02T16:13:31.950000+00:00
END       2026-09-02T19:52:25.084000+00:00
WALL      3:38:53.134000  (218.9 min)
TYPES     {'queue-operation': 34, 'attachment': 112, 'user': 73, 'last-prompt': 38, 'atis-latch': 37, 'assistant': 166}
MODELS    {'claude-opus-5': 166}

TOKENS (this transcript only, excludes subagents)
  assistant API responses : 166
  input (uncached)        : 332
  cache_read              : 47,011,626
  cache_creation          : 1,260,678
  output                  : 469,210
  of which thinking       : 149,639
  TOTAL context-in        : 48,272,636

TOOL CALLS (59 total)
     14  Agent
     12  mcp__dungeonmaster__modify-quest
      8  Edit
      6  Read
      5  Bash
      3  ToolSearch
      2  mcp__dungeonmaster__get-qa-checklist
      2  SendMessage
      1  mcp__dungeonmaster__get-agent-prompt
      1  mcp__dungeonmaster__get-quest
      1  mcp__dungeonmaster__get-architecture
      1  mcp__dungeonmaster__get-syntax-rules
      1  mcp__dungeonmaster__get-testing-patterns
      1  Write
      1  mcp__dungeonmaster__signal-back

TOOL RESULT BYTES fed back: 547,581

SUBAGENTS 26  (run `subagents` subcommand for the roster)
```

### `python3 tmp/transcript-digest.py subagents 6509cd6e-205f-4938-88eb-a5051d77a6d3`

```
09-02 16:14:39  +   5.8m  agent-a1eee9fee730548f3  general-purpose/sonnet  turns= 82 out=22,325 ctx-in=10,852,039
           desc: Map orchestrator+shared image rewrite
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 29, 'Read': 24}
09-02 16:14:53  +   5.8m  agent-a5a5603b40804f402  general-purpose/sonnet  turns= 87 out=30,069 ctx-in=6,547,165
           desc: Map server /api/images route
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 37, 'Read': 20, 'mcp__dungeonmaster__get-project-map': 1}
09-02 16:15:09  +   4.0m  agent-abaf7220f594d5cb5  general-purpose/sonnet  turns= 66 out=20,951 ctx-in=7,173,599
           desc: Map web transcript rendering
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-project-map': 1, 'mcp__dungeonmaster__discover': 23, 'Read': 16, 'Bash': 3}
09-02 16:16:31  +   3.7m  agent-a154b36eede128aa9  general-purpose/sonnet  turns= 47 out=24,943 ctx-in=7,204,466
           desc: Map e2e transcript replay path
           tools: {'Read': 20, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 12}
09-02 16:27:07  +  15.0m  agent-aa75fd37057fc2edd  general-purpose/sonnet  turns=127 out=65,874 ctx-in=17,364,813
           desc: Prove image responder never logs
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 24, 'mcp__dungeonmaster__discover': 11, 'Bash': 18, 'Edit': 16}
09-02 16:27:31  +   6.9m  agent-a502373cced56c9dd  general-purpose/sonnet  turns= 92 out=27,135 ctx-in=13,036,169
           desc: Prove replay relay to client
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 15, 'mcp__dungeonmaster__discover': 8, 'Edit': 11, 'Bash': 15}
09-02 16:28:00  +  15.3m  agent-af12f6ca449f8f11d  general-purpose/sonnet  turns= 91 out=92,817 ctx-in=20,456,913
           desc: Prove replay payload rewrite
           tools: {'ToolSearch': 2, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 23, 'mcp__dungeonmaster__discover': 10, 'Edit': 6, 'Bash': 7}
09-02 16:28:26  +  10.4m  agent-aa69b8dc1d2069fed  general-purpose/sonnet  turns= 80 out=58,567 ctx-in=9,684,976
           desc: Prove content normaliser invariants
           tools: {'ToolSearch': 2, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Bash': 13, 'mcp__dungeonmaster__discover': 7, 'Read': 8, 'Edit': 12}
09-02 16:45:01  +  30.2m  agent-ac15f6b7d0e9a79ee  general-purpose/sonnet  turns=151 out=154,026 ctx-in=47,768,581
           desc: Prove transcript renders images
           tools: {'ToolSearch': 4, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 35, 'Agent': 1, 'mcp__dungeonmaster__discover': 29, 'Write': 4, 'Bash': 9, 'Edit': 5}
09-02 16:45:42  +   2.6m  agent-a541080a25523e3c5  general-purpose/None  turns= 47 out=19,318 ctx-in=4,048,485
           desc: Research image rendering pipeline in web package
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-project-map': 1, 'mcp__dungeonmaster__get-project-inventory': 2, 'mcp__dungeonmaster__discover': 19, 'Read': 14}
09-02 17:18:39  +  29.5m  agent-af53301a106bbd964  general-purpose/sonnet  turns=129 out=105,701 ctx-in=28,234,675
           desc: Prove transcript image overlay
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 20, 'Agent': 4, 'Edit': 24, 'Write': 1, 'Bash': 20}
09-02 17:19:04  +   0.9m  agent-a156e27c2e00b03ad  general-purpose/None  turns= 12 out=1,201 ctx-in=464,482
           desc: Locate image overlay widget and statics
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 3, 'Read': 3}
09-02 17:20:07  +   2.8m  agent-a81241e1198f84b9b  general-purpose/None  turns= 13 out=24,259 ctx-in=596,562
           desc: Read e2e fixtures and navigation/session harnesses
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 2, 'Read': 6}
09-02 17:23:32  +   0.7m  agent-a62e51732794e9dca  general-purpose/None  turns= 11 out=4,238 ctx-in=480,050
           desc: Check web-config-statics import patterns and harness precedents
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 3, 'Read': 3}
09-02 17:24:57  +   2.8m  agent-a8bdbd18242fd972c  general-purpose/None  turns= 45 out=15,294 ctx-in=2,762,253
           desc: Check eslint rules governing harness imports of statics
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 17, 'Read': 11}
09-02 17:51:25  +  43.9m  agent-a368d1c5a826e6370  general-purpose/sonnet  turns=292 out=204,575 ctx-in=103,080,623
           desc: Prove image route refusals
           tools: {'ToolSearch': 2, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 43, 'mcp__dungeonmaster__discover': 18, 'Bash': 61, 'Edit': 31, 'Write': 12}
09-02 18:38:12  +  14.2m  agent-af7a0174de0a516b0  general-purpose/sonnet  turns= 80 out=75,932 ctx-in=17,118,283
           desc: Prove image path encoding round trip
           tools: {'ToolSearch': 2, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 13, 'Bash': 13, 'mcp__dungeonmaster__discover': 9, 'Edit': 6, 'Write': 2}
09-02 18:54:06  +  49.6m  agent-a99bab1aff48176d3  general-purpose/sonnet  turns=171 out=194,621 ctx-in=56,177,623
           desc: Prove optimistic replaced by transcript
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 24, 'mcp__dungeonmaster__discover': 20, 'Edit': 14, 'Write': 5, 'Bash': 22, 'Agent': 7}
09-02 19:11:40  +   5.3m  agent-a5c8412a3fcb7ad45  Explore/None  turns= 41 out=32,189 ctx-in=3,888,071
           desc: Research live chat-output delivery mechanism for a resumed session
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 11, 'mcp__dungeonmaster__get-project-map': 1, 'Bash': 4, 'Read': 10}
09-02 19:17:51  +   1.1m  agent-aa5bc3197035af2a5  Explore/None  turns= 19 out=5,257 ctx-in=1,425,568
           desc: Read chat-main-session-tail and agent-launch broker sources
           tools: {'ToolSearch': 1, 'Read': 5, 'Bash': 1, 'mcp__dungeonmaster__discover': 5}
09-02 19:19:47  +   1.0m  agent-af9ae53c18e40ca9a  Explore/None  turns= 23 out=5,084 ctx-in=808,124
           desc: Verify live stdout user-line delivery mechanics
           tools: {'Bash': 7, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 5, 'Read': 4}
09-02 19:24:29  +   0.4m  agent-a89b752a728a9942e  Explore/None  turns=  9 out=1,150 ctx-in=184,929
           desc: Check ClaudeQueueResponse contract shape
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 2, 'Bash': 1, 'Read': 1}
09-02 19:29:40  +   0.6m  agent-a883d0f3a2b0174dd  Explore/None  turns=  4 out=3,110 ctx-in=152,332
           desc: Read useQuestChatBinding's chat-output handling in detail
           tools: {'Read': 1}
09-02 19:30:59  +   3.1m  agent-a62063ffe2897e8c5  Explore/None  turns= 32 out=12,689 ctx-in=2,377,105
           desc: Investigate quest-driven-watchers sessionId stamping and registration triggers
           tools: {'Bash': 2, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 10, 'Read': 8}
09-02 19:35:32  +   3.8m  agent-a7b1d7f3a8c3c20d6  Explore/None  turns= 55 out=23,512 ctx-in=4,912,429
           desc: Verify in_progress work item viability for quest-driven-watchers e2e test
           tools: {'Bash': 8, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 16, 'Read': 12}
09-02 19:45:05  +   6.8m  agent-aa20ed24786aba447  general-purpose/sonnet  turns= 87 out=31,263 ctx-in=14,869,705
           desc: Review flowrider operation
           tools: {'ToolSearch': 3, 'mcp__dungeonmaster__get-agent-prompt': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__get-quest': 1, 'mcp__dungeonmaster__get-qa-checklist': 1, 'Bash': 17, 'mcp__dungeonmaster__discover': 15, 'Read': 16}

SUBAGENT TOTALS  agents=26 turns=1893 output=1,256,100 context-in=381,670,020
```

### Per-sub-agent cache split (python over `subagents/*.jsonl`, summing `message.usage` on `type == 'assistant'`)

```
start    agent                   input    cache_read  cache_creation    output
16:14:39 a1eee9fee730548f3         164     9,695,432       1,156,443    22,325
16:14:53 a5a5603b40804f402         174     5,793,010         753,981    30,069
16:15:09 abaf7220f594d5cb5         132     6,595,488         577,979    20,951
16:16:31 a154b36eede128aa9          94     6,220,897         983,475    24,943
16:27:07 aa75fd37057fc2edd         254    16,807,801         556,758    65,874
16:27:31 a502373cced56c9dd         184    12,542,025         493,960    27,135
16:28:00 af12f6ca449f8f11d         182    19,748,594         708,137    92,817
16:28:26 aa69b8dc1d2069fed         160     9,361,693         323,123    58,567
16:45:01 ac15f6b7d0e9a79ee         302    46,897,278         871,001   154,026
16:45:42 a541080a25523e3c5          94     3,042,388       1,006,003    19,318
17:18:39 af53301a106bbd964         258    27,531,641         702,776   105,701
17:19:04 a156e27c2e00b03ad          24       317,182         147,276     1,201
17:20:07 a81241e1198f84b9b          26       380,683         215,853    24,259
17:23:32 a62e51732794e9dca          22       339,771         140,257     4,238
17:24:57 a8bdbd18242fd972c          90     2,494,852         267,311    15,294
17:51:25 a368d1c5a826e6370         584   101,647,191       1,432,848   204,575
18:38:12 af7a0174de0a516b0         160    16,394,546         723,577    75,932
18:54:06 a99bab1aff48176d3         342    53,061,631       3,115,650   194,621
19:11:40 a5c8412a3fcb7ad45          82     3,485,939         402,050    32,189
19:17:51 aa5bc3197035af2a5          38     1,168,946         256,584     5,257
19:19:47 af9ae53c18e40ca9a          46       548,406         259,672     5,084
19:24:29 a89b752a728a9942e          18       155,377          29,534     1,150
19:29:40 a883d0f3a2b0174dd           8        55,864          96,460     3,110
19:30:59 a62063ffe2897e8c5          64     1,913,986         463,055    12,689
19:35:32 a7b1d7f3a8c3c20d6         110     4,405,568         506,751    23,512
19:45:05 aa20ed24786aba447         174    14,200,518         669,013    31,263

SUBAGENT TOTALS  input=3,786  cache_read=364,806,707  cache_creation=16,859,527  output=1,256,100
  context-in total = 381,670,020
```

### Main-session tool-result bytes by tool

```
Read                                               n=  6 total=   86,508 sizes=[35801, 9981, 6860, 7043, 11379, 15444]
mcp__dungeonmaster__get-testing-patterns           n=  1 total=   51,401
mcp__dungeonmaster__get-agent-prompt               n=  1 total=   36,205
mcp__dungeonmaster__get-qa-checklist               n=  2 total=   35,338 sizes=[17434, 17904]
mcp__dungeonmaster__get-quest                      n=  1 total=   32,357
Bash                                               n=  5 total=   28,408 sizes=[1152, 25937, 964, 33, 322]
mcp__dungeonmaster__get-syntax-rules               n=  1 total=   24,528
mcp__dungeonmaster__get-architecture               n=  1 total=   19,056
Agent                                              n= 14 total=   16,828   (launch stubs only; returns arrive as attachments)
Edit                                               n=  8 total=    2,328
mcp__dungeonmaster__modify-quest                   n= 12 total=    1,718   (11 × `{"success": true}`, 1 × 1,113-byte refusal)
ToolSearch                                         n=  3 total=      845
SendMessage                                        n=  2 total=      434
mcp__dungeonmaster__signal-back                    n=  1 total=      335
Write                                              n=  1 total=      281
```

Standards triple = 19,056 + 24,528 + 51,401 = **94,985 bytes**, fetched 11× across the tree (operator + 10 test-writing/reviewing sub-agents) = **1,044,835 bytes** of identical text.

### Gap analysis script output (idle vs blocked)

Reproduced verbatim in §1 above. Method: assistant records only, sorted by timestamp; a gap ≥120 s is "not working"; each gap is intersected with the merged live-windows of all 26 sub-agent transcripts (min/max timestamp per file) to split "blocked on a helper" from "true idle".

### Sub-agent command counts (python regex over all 26 `subagents/*.jsonl`, `tool_use.name == 'Bash'`)

```
a368d1c5a826e6370  run-ward-mcp=0  {'npm run build': 1, 'npm run ward': 6, 'npx playwright': 19}
a502373cced56c9dd  run-ward-mcp=0  {'npm run build': 2, 'npm run ward': 9}
a99bab1aff48176d3  run-ward-mcp=0  {'npm run build': 5, 'npm run ward': 10}
aa20ed24786aba447  run-ward-mcp=0  {'npm run build': 2, 'npm run ward': 5, 'ward --staged': 3, 'git commit': 1, 'git push': 1, 'git add': 1}
aa69b8dc1d2069fed  run-ward-mcp=0  {'npm run build': 1, 'npm run ward': 7}
aa75fd37057fc2edd  run-ward-mcp=0  {'npm run build': 6, 'npm run ward': 6}
ac15f6b7d0e9a79ee  run-ward-mcp=0  {'npm run build': 1, 'npm run ward': 5}
af12f6ca449f8f11d  run-ward-mcp=0  {'npm run ward': 5}
af53301a106bbd964  run-ward-mcp=0  {'npm run ward': 1, 'npx playwright': 9}
af7a0174de0a516b0  run-ward-mcp=0  {'npm run ward': 1, 'npx playwright': 3}

TOTALS {'npm run build': 18, 'npm run ward': 55, 'ward --staged': 3, 'npx playwright': 31, 'npx jest': 0,
        'git commit': 1, 'git push': 1, 'git add': 1, 'git checkout --': 0, 'git stash': 0, 'git reset': 0}
```

The reviewer's `npm run build`/`ward --staged` counts are inflated by its own commit-message heredoc, which quotes the commands it ran. Its actual invocations are one `npm run build`, one `npm run ward -- --staged`, one compensating `npm run ward -- --only lint,e2e -- <6 files>`. Subtracting the reviewer, **non-reviewer `npm run build` = 16**, independently reproduced by two separate scripts.

### `npm run build` call timeline (sub-agents)

```
16:30:17 a502373cced56c9dd | npm run build 2>&1 | tail -30
16:30:46 a502373cced56c9dd | echo "build exit code check via separate run"; npm run build > /tmp/build-out.log ...
16:33:46 aa69b8dc1d2069fed | npm run build 2>&1 | tail -40
16:34:59 aa75fd37057fc2edd | npm run build 2>&1 | tail -n 40
16:35:52 aa75fd37057fc2edd | npm run build 2>&1 | tail -n 20
16:38:47 aa75fd37057fc2edd | npm run build 2>&1 | tail -n 5
16:39:30 aa75fd37057fc2edd | npm run build 2>&1 | tail -n 5
16:40:30 aa75fd37057fc2edd | npm run build 2>&1 | tail -n 5
16:40:53 aa75fd37057fc2edd | npm run build 2>&1 | tail -n 60
17:11:13 ac15f6b7d0e9a79ee | npm run build 2>&1 | tail -30
18:10:48 a368d1c5a826e6370 | npm run build 2>&1 | tail -40
19:08:10 a99bab1aff48176d3 | npm run build 2>&1 | tail -30
19:08:43 a99bab1aff48176d3 | npm run build > /tmp/build-out.log 2>&1; echo "EXIT:$?"; ...
19:08:45 a99bab1aff48176d3 | npm run build; echo "EXIT:$?"
19:28:05 a99bab1aff48176d3 | npm run build; echo "EXIT:$?"
19:41:24 a99bab1aff48176d3 | npm run build; echo "EXIT:$?"
19:47:46 aa20ed24786aba447 | npm run build                      <- the reviewer's one allowed build
```

### Main-session Bash and Read history (complete)

```
16:15:17 Bash  ls -la .quest-plans/ 2>/dev/null || echo "NO .quest-plans DIR"
16:15:17 Bash  git log --oneline -12 --name-only
16:15:29 Read  .quest-plans/339d7ed2-43c1-4023-8af8-a0511cb25caf-map.md     (FR2's flowrider map)
16:15:43 Read  .quest-plans/332e0da3-47aa-4f78-b3eb-15fbded0bdfe-map.md     (codeweaver web)
16:15:44 Read  .quest-plans/83c9f2ce-f00c-4dda-bf2d-594e5dacc074-map.md     (codeweaver server)
16:16:36 Read  .quest-plans/8857ed98-9679-424d-ba7e-ef800ad76d9b-map.md     (codeweaver orchestrator)
17:15:31 Read  packages/web/src/flows/session-view/transcript-renders-images.e2e.ts
17:16:22 Read  packages/web/test/harnesses/transcript-images/transcript-images.harness.ts
19:44:48 Bash  git status --short
19:52:02 Bash  git status --short
19:52:02 Bash  git log --oneline -3
```

No `git diff`. Two source files opened out of twelve produced.

### Agent dispatch metadata (all 14 direct children)

```
 1 Map orchestrator+shared image rewrite      model=sonnet type=general-purpose  prompt=2,695 chars
 2 Map server /api/images route               model=sonnet type=general-purpose  prompt=2,983
 3 Map web transcript rendering               model=sonnet type=general-purpose  prompt=3,529
 4 Map e2e transcript replay path             model=sonnet type=general-purpose  prompt=3,351
 5 Prove image responder never logs           model=sonnet type=general-purpose  prompt=5,174
 6 Prove replay relay to client               model=sonnet type=general-purpose  prompt=5,912
 7 Prove replay payload rewrite               model=sonnet type=general-purpose  prompt=7,115
 8 Prove content normaliser invariants        model=sonnet type=general-purpose  prompt=6,701
 9 Prove transcript renders images            model=sonnet type=general-purpose  prompt=13,335
10 Prove transcript image overlay             model=sonnet type=general-purpose  prompt=12,568
11 Prove image route refusals                 model=sonnet type=general-purpose  prompt=14,609
12 Prove image path encoding round trip       model=sonnet type=general-purpose  prompt=10,484
13 Prove optimistic replaced by transcript    model=sonnet type=general-purpose  prompt=11,142
14 Review flowrider operation                 model=sonnet type=general-purpose  prompt=229
```

### Commit `99587913a` — files changed

13 files, 3,564 insertions, 29 deletions.

```
.quest-plans/c0f5d521-29cb-4cf6-8db6-ecc012c8ab16-map.md                                +436  added
packages/orchestrator/src/responders/chat/replay/chat-replay-responder.test.ts          +176  modified
packages/server/src/responders/image/serve/image-serve-responder.proxy.ts                +13  modified
packages/server/src/responders/image/serve/image-serve-responder.test.ts                  +67  modified
packages/server/src/responders/server/init/server-init-responder.test.ts                 +106  modified
packages/web/src/transformers/normalise-chat-content/normalise-chat-content-transformer.test.ts  +76  modified
packages/web/test/harnesses/transcript-images/transcript-images.harness.ts               +907  NEW
packages/web/src/flows/session-view/transcript-renders-images.e2e.ts                     +241  NEW
packages/web/src/flows/session-view/transcript-image-overlay.e2e.ts                      +488  NEW
packages/web/src/flows/session-view/transcript-broken-image.e2e.ts                       +259  NEW
packages/web/src/flows/session-view/transcript-image-path-encoding.e2e.ts                +434  NEW
packages/web/src/flows/session-view/image-route-answers.e2e.ts                           +192  NEW
packages/web/src/flows/quest-chat/transcript-replaces-optimistic.e2e.ts                  +198  NEW
```

121 runtime cases across the 10 test/spec files (`it()`/`test()`, `.each` rows expanded). 9 of 9 geometry-measuring tests correctly call `page.bringToFront()` and assert `document.visibilityState` before any `boundingBox()`/computed-style read — the prompt's browser rule held perfectly.

### Sibling flowrider comparison (for §5 finding 9)

```
[13] 5c841160  paste-image-into-composer   184.0 min  8 subagents  main out 347,646  main ctx-in 29,816,937
[14] 42edd7ea  send-message-with-images    249.3 min 18 subagents  main out 453,402  main ctx-in 58,403,798
[15] 6509cd6e  render-images-in-transcript 218.9 min 26 subagents  main out 469,210  main ctx-in 48,272,636
```

The first flowrider session (FR1) dispatched 3 rework sub-agents after reading its own output; the second flowrider session (FR2) dispatched 4; **the third flowrider session (FR3) dispatched 0** and read almost none of its output. Its single review cycle passed on the first attempt.

### Numbers I could not obtain

- Per-sub-agent thinking-token split — `summary` does not break `thinking` out for sub-agent transcripts, only for the main session.
- Wall-clock duration of an individual `npm run build` inside a sub-agent — the transcript records the call and the result but the digest tool does not expose per-Bash elapsed time; the reviewer's build-to-ward interval (2.68m to 3.15m, about 28 s) is the only usable proxy and it may have been incremental.
- The siegemaster verdict for `render-images-in-transcript` itself — **not measurable from the transcript.** No siegemaster item exists for this flow; items [16] and [17] cover the two sibling flows, and [17] is still `pending`.

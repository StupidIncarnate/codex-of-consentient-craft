# Work item 08 — codeweaver — web / send-message-with-images

## 0. Identity

This report covers one **cell** of the quest — one package-and-flow slice of work, package `web` and flow
`send-message-with-images`. A **flow** is a named user-facing scenario the quest is building, broken into
steps and branches. One **operator** — the AI session that runs the cell end to end and directs every helper
it uses — owns this cell.

| Field | Value |
|---|---|
| Work item id | `7546da90-f77b-479a-9b70-96802f47bc2f` |
| Operation item id | `e203cbe2-c047-42c2-87cb-2973e93660c5` |
| Session id | `0db63e41-57e1-4ab4-b73f-5817849b334c` |
| Role | `codeweaver` (operator) |
| Model | `claude-opus-5` — 194/194 assistant records (`MODELS {'claude-opus-5': 194}`) |
| Operation text | `[codeweaver] Codeweaver: build this slice — package: web · flow: send-message-with-images` |
| `flowIds` / `packageNames` | `['send-message-with-images']` / `['web']` |
| `dependsOn` | `["5c7f99ca-7259-438b-b672-84fb87c262b7"]` (work item [7], the `web · paste-image-into-composer` cell) |
| `status` / `actualSignal` | `complete` / `complete`, `operationStatus: 'done'` |
| `retryCount` | `0` — no pt chain, one pass |
| `startRef` | `061e49064a323a3004c518ad249e6c87f461cc38` |

**Window:** `createdAt 2026-09-02T03:45:15.755Z` → `completedAt 2026-09-02T06:39:48.784Z`.
Transcript wall clock: `START 2026-09-02T03:45:30.135000+00:00`, `END 2026-09-02T06:40:04.138000+00:00`,
`WALL 2:54:34.003000 (174.6 min)`.

**Sub-agents: 38.** A **sub-agent** is a helper AI session the operator starts to do one piece of work. This
pass used 38 of them, at two depths — depth meaning how many steps removed from the operator each one is:

- **20 at depth 1** — started directly by the operator. All are `agentType: general-purpose` running on
  `model: sonnet`: 19 write code, and one is the `codeweaver-reviewer` (`agent-ae1d2690ddd38159c`), the
  **reviewer** — a sub-agent whose only job is to check the operator's work before it ships. It ran with the
  reviewer's own served-prompt brief.
- **18 at depth 2** — not started by the operator directly, but by five of its depth-1 builders, one step
  further removed. (This report calls starting a sub-agent "spawning" it; the two words mean the same thing.)
  All 18 are `agentType: Explore` — an **explorer**, a sub-agent that only reads and searches code and never
  edits anything. Twelve ran with `model: None` (inherited from the parent) and six ran on `model: sonnet`.

Depth-2 parentage, from the `*.meta.json` `parentAgentId` field:

```
a155b8642d3022923  "Lock composer and show progress"    spawned 5 explorers
a7c2cbd1869aacbd9  "Wire images into quest new broker"  spawned 5 explorers
a2e9daecce4e0d79d  "Route XHR proxy by URL"             spawned 5 explorers
a73a382864cf3e985  "Build upload progress contracts"    spawned 2 explorers
a4e9726b2fb2d4cb9  "Forward images on create surface"   spawned 1 explorer
```

The session's own tool histogram shows `20 Agent` calls plus `2 SendMessage` calls. That is 22 dispatch
actions against 20 depth-1 agents — two of the agents were resumed once each rather than replaced.

**Headline answer to the roster question:** of the 38 sub-agents, 15 were builders that wrote new code, 4
were repairs of work an earlier sub-agent in this same session had produced, 1 was the reviewer, and 18 were
read-only explorers started two levels down. Counting the two `SendMessage` resumes as dispatch actions too,
6 of the operator's 22 dispatch actions were repairs of its own sub-agents' output — 27%. Work from all 19
code-writing agents survived into the single commit `3275de52b` (54 files, 3,492 insertions). The reviewer
amended 2 of those 54 files and reverted none.

---

## 1. Chronological breakdown — where the time went

Phases are taken from the main-session `timeline`. Each row's elapsed range is bounded by a quoted timeline
line. Minutes sum to 174.5, against a 174.6-min wall. Two terms recur in the table below: a **sign-off** is
the codeweaver's formal claim that one item — a test observation, a node, or a labelled branch in the flow —
is proven, and **ward** is this repo's combined lint, typecheck and test command.

| # | Clock (UTC) | Elapsed | Min | What happened | Evidence |
|---|---|---|---|---|---|
| P1 | 03:45:32–03:51:12 | 0.1–5.7m | 5.6 | Fetch prompt, `get-quest`, three standards docs, `git log --name-only -n 6`, 12 `Read`s + 6 `discover`s across `web`, plus 8 `python3` probes (msw XHR interception, package deps, quest.json edge ids) | `0.2m CALL mcp__dungeonmaster__get-agent-prompt(agent=codeweaver …)`; `0.4m CALL mcp__dungeonmaster__get-testing-patterns({}) <- result 51,401 bytes`; `4.8m CALL Bash(… description=Check whether msw node setup includes the XHR interceptor)` |
| P2 | 03:51:12–03:53:24 | 5.7–7.9m | 2.2 | Map authoring. One 80-second thinking turn emits 10,862 output tokens, then the map is written | `7.0m 80s 10862 233,576 say: "I have the full picture. Writing my map."`; `7.7m CALL Write(file_path=…/.quest-plans/e203cbe2-…-map.md)` |
| P3 | 03:53:24–03:59:54 | 7.9–14.4m | 6.5 | Group 1 out (3 agents: contracts, payload contract, statics); all three return `pass` | `7.9m say: "Map written. Dispatching group 1 — the contracts and statics."`; `14.4m say: "All three group-1 agents passed and nothing was committed. Dispatching group 2."` |
| P4 | 03:59:54–04:23:12 | 14.4–37.7m | 23.3 | Group 2 out (4 agents). One 883-second block waiting on the XHR adapter alone | `16.3m say: "Group 2 is out — four agents… Ending the turn while they run."`; `37.0m 883s 676 279,152` |
| P5 | 04:23:12–04:46:00 | 37.7–60.5m | 22.8 | Group 3 out (3 brokers + the first repair agent). `modify-quest` adds `testing` to `packagesAffected` mid-wave | `37.7m say: "Group 2 is complete. One defect in the XHR adapter needs fixing before the brokers rely on it — dispatching that alongside group 3."`; `48.8m CALL mcp__dungeonmaster__modify-quest(...)` |
| P6 | 04:46:00–05:15:24 | 60.5–89.9m | 29.4 | Group 4 (binding) + a repair (cast cleanup) + group 5 partly in parallel (composer, panel). Panel reports a seam break at 74.7m; binding returns `NEXT: wall` at 89.9m | `63.9m say: "Dispatching the composer work now — it depends only on the prop signature, not on the binding, so it can run alongside."`; `74.7m 561s say: "A real seam issue surfaced: the composer passes \`onProgress\` on every send…"` |
| P7 | 05:15:24–05:33:00 | 89.9–107.5m | 17.6 | Diagnose the XHR-proxy collision, dispatch the repair | `89.9m say: "The binding hit a real collision I introduced: two broker proxies both stage \`globalThis.XMLHttpRequest\` at \`calledWith([])\`…"`; `91.1m CALL Agent(description=Route XHR proxy by URL …)` |
| P8 | 05:33:00–05:49:18 | 107.5–123.8m | 16.3 | `SendMessage` correction to the composer agent (false-positive test), execution-panel builder out | `107.9m CALL SendMessage({"to": "a155b8642d3022923", "summary": "Make onProgress conditional on images"…})`; `112.6m CALL Agent(description=Widen followup send prop …)` |
| P9 | 05:49:18–06:12:54 | 123.8–147.4m | 23.6 | Last builder (create surface) out, plus a `SendMessage` re-run of the panel agent; 1,340-second block | `124.4m CALL Agent(description=Forward images on create surface …)`; `147.4m 1340s 372 424,015 say: "All groups have landed. Reading what changed."` |
| P10 | 06:12:54–06:14:00 | 147.4–148.5m | 1.1 | Step 5. `git status --porcelain`, `git diff --stat HEAD`, four scoped `git diff HEAD -- <paths>`, 7 targeted `Read`s | `147.5m CALL Bash(command=git diff --stat HEAD)`; `147.6m CALL Bash(command=git diff HEAD -- packages/web/src/brokers) <- result 31,085 bytes` |
| P11 | 06:14:00–06:20:48 | 148.5–155.3m | 6.8 | Repair agent for two gaps the diff read found | `148.5m say: "Two small gaps to close before review."`; `149.0m CALL Agent(description=Give upload contract a reader …)` |
| P12 | 06:20:48–06:22:00 | 155.3–156.5m | 1.2 | One `modify-quest` writing 37 sign-offs | `155.3m say: "All work is landed. Recording my sign-offs before the review."`; `156.5m CALL mcp__dungeonmaster__modify-quest(…)` |
| P13 | 06:22:00–06:39:42 | 156.5–174.2m | 17.7 | Reviewer runs: reads the quest, opens every file, builds twice, wards twice, commits, pushes | `156.5m CALL Agent(description=Review web send-with-images slice prompt=Call get-agent-prompt({ agent: 'codeweaver-reviewer', … }) … OPERATION: …)`; `174.2m 1057s 459 474,505` |
| P14 | 06:39:42–06:40:04 | 174.2–174.6m | 0.4 | `git status --porcelain`, `git log --oneline -n 2`, `signal-back` | `174.3m say: "Tree is clean and the commit landed. Signalling."` |

### Time by category

Derived from a gap analysis over all 193 inter-assistant intervals in the main session
(`sum of ALL inter-assistant gaps: 174.5 min over 193 gaps`; `sum of gaps >= 60s: 151.2 min over 20 gaps`;
`sum of gaps < 60s (active-ish): 23.2 min`; `gaps >= 300s (5min+): 125.2 min over 10 gaps`).

| Category | Minutes | % of wall | Basis |
|---|---:|---:|---|
| Orientation / reading (P1 + P10) | 6.7 | 3.8% | P1 5.6 + P10 1.1 |
| Planning — the map (P2) | 2.2 | 1.3% | P2 |
| Sub-agent dispatch — **waiting** (builders + repairs) | 133.6 | 76.5% | 151.2 min of gaps ≥ 60s, less the reviewer's 1,057 s |
| Review cycle — waiting on the reviewer (P13) | 17.6 | 10.1% | the single 1,057 s gap at 174.2m |
| Sign-off recording (P12) | 1.2 | 0.7% | P12 |
| Verification / ward run by the operator | **0.0** | 0% | zero `npm run build` and zero `npm run ward` in the main session's 22 Bash calls — `[BUILD]` obeyed |
| Idle or stall | **0.0** | 0% | 0 `sleep` invocations across the main session and all 38 sub-agents |
| Other — brief authoring and return routing | 12.7 | 7.3% | 23.2 min of sub-60s active gaps, less the 10.5 min already attributed above |

The operator spent 23.2 minutes of the 174.6 doing anything at all. A helper was running for the other 86.6%
of the wall clock. None of that time was a poll, a sleep, or a re-run — the `[HELPERS]` rule (never poll,
never sleep, end the turn and wait for the notification) was followed exactly. Every long gap ends with the
operator's turn closing on a plain message, for example `"Ending the turn while they run; the notifications
bring me back."` at 9.1m, and eight more like it.

---

## 2. Chronological token buckets

Main session, verbatim (`python3 tmp/transcript-digest.py buckets 0db63e41-57e1-4ab4-b73f-5817849b334c --minutes 10`):

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/0db63e41-57e1-4ab4-b73f-5817849b334c.jsonl
LINES     593
START     2026-09-02T03:45:30.135000+00:00
END       2026-09-02T06:40:04.138000+00:00
WALL      2:54:34.003000  (174.6 min)

BUCKETS of 10 min
WINDOW              APIs  CALLS   OUT-TOK    CTX-IN-TOK  RESULT-BYTES  TOP TOOLS
09-02 03:45-03:55    79     51   129,511    13,529,989       442,959  Readx21, Bashx11, mcp__dungeonmaster__discoverx8, Agentx3
09-02 03:55-04:05    14      5    74,394     3,634,434        28,423  Agentx4, Bashx1
09-02 04:05-04:15     2      0        64       551,978             0  
09-02 04:15-04:25    13      7    88,956     3,707,354        40,924  Agentx4, Readx2, Bashx1
09-02 04:25-04:35     9      3     3,896     2,882,416         1,265  Bashx1, ToolSearchx1, mcp__dungeonmaster__modify-questx1
09-02 04:35-04:45     2      0       602       712,344             0  
09-02 04:45-04:55    10      4    74,811     3,647,959        34,259  Agentx4
09-02 04:55-05:05     2      0     1,302       765,204             0  
09-02 05:05-05:15     3      1    12,423     1,157,829         4,396  Readx1
09-02 05:15-05:25     4      1    15,870     1,573,106        10,372  Agentx1
09-02 05:25-05:35     6      2     5,827     2,410,862           263  ToolSearchx1, SendMessagex1
09-02 05:35-05:45     6      2     4,707     2,451,373         8,847  Readx1, Agentx1
09-02 05:45-05:55     6      2    21,562     2,502,591         9,323  Agentx1, SendMessagex1
09-02 06:05-06:15    25     14    20,899    10,984,256        95,779  Bashx6, Readx6, mcp__dungeonmaster__discoverx1, Agentx1
09-02 06:15-06:25     6      2    37,035     2,794,496           730  mcp__dungeonmaster__modify-questx1, Agentx1
09-02 06:35-06:45     7      3     3,371     3,324,825           844  Bashx2, mcp__dungeonmaster__signal-backx1
```

Two 10-minute windows are **absent from the table entirely** — `05:55–06:05` and `06:25–06:35`. The main session
made zero API calls in either. The first sits inside `agent-a4e9726b2fb2d4cb9`'s 22.9-minute run; the second
inside the reviewer's 17.5-minute run.

Sub-agent spend, attributed to the 10-minute bucket each sub-agent *started* in (main-session clock, minutes
from `START`):

| Bucket (elapsed min) | Agents started | Sub-agent OUT | Sub-agent CTX-IN |
|---|---:|---:|---:|
| 0–10 | 5 | 64,210 | 16,767,593 |
| 10–20 | 4 | 182,602 | 42,976,763 |
| 30–40 | 4 | 198,216 | 49,688,217 |
| 40–50 | 3 | 34,328 | 6,141,189 |
| 50–60 | 2 | 9,571 | 1,046,055 |
| 60–70 | 7 | 357,724 | 148,701,856 |
| 70–80 | 1 | 1,187 | 176,818 |
| 80–90 | 1 | 809 | 133,757 |
| 90–100 | 3 | 148,501 | 20,823,393 |
| 100–110 | 1 | 1,987 | 416,459 |
| 110–120 | 3 | 22,277 | 7,798,580 |
| 120–130 | 2 | 127,970 | 36,052,870 |
| 140–150 | 1 | 17,265 | 7,137,931 |
| 150–160 | 1 | 62,805 | 37,021,421 |
| **Total** | **38** | **1,229,452** | **374,882,902** |

The 60–70 minute bucket carries the whole quarter of the spend. Seven agents started there — the binding, the
cast repair, the composer, the panel, and four of the composer's own explorers. Together they carried
148,701,856 **context-in** tokens (everything fed into the model as prompt and history for a call, as opposed
to what it generates as output) — 39.7% of all sub-agent context. The reason: the composer agent alone ran
351 turns over 47 minutes.

### Totals — cache_read and cache_creation stated separately

Two kinds of context cost are broken out below. **cache_read** is context reused from an earlier cached
call, billed at a discount. **cache_creation** is new context written to the cache so a later call can reuse
it. Both count toward the context-in total.

| | input (uncached) | cache_read | cache_creation | context-in total | output | of which thinking |
|---|---:|---:|---:|---:|---:|---:|
| Main session | 388 | 55,573,617 | 1,057,011 | 56,631,016 | 495,230 | 163,426 |
| 38 sub-agents | 4,700 | 355,308,988 | 19,569,214 | 374,882,902 | 1,229,452 | not separated by the tool |
| **Grand total** | **5,088** | **410,882,605** | **20,626,225** | **431,513,918** | **1,724,682** | — |

Arithmetic: `388 + 55,573,617 + 1,057,011 = 56,631,016`; `4,700 + 355,308,988 + 19,569,214 = 374,882,902`;
`56,631,016 + 374,882,902 = 431,513,918`; `495,230 + 1,229,452 = 1,724,682`.

431.5 million context-in tokens went into a commit of 54 files and 3,492 insertions. 95.2% of that context
was `cache_read`, not fresh input. Even so, all of it is billed context, and producing it took 174.6 minutes.

The 18 depth-2 explorers together account for 98,498 output tokens (8.0% of sub-agent output) and 15,658,523
context-in tokens (4.2% of sub-agent context). Arithmetic on the roster figures:
`3,611+3,269+17,065+7,565+9,698+3,359+6,212+1,934+569+1,344+1,187+809+7,058+10,975+1,987+6,553+3,098+12,205 = 98,498`;
`742,786+540,478+2,935,655+1,071,213+2,134,321+376,644+669,411+611,928+116,184+208,986+176,818+133,757+746,561+1,919,932+416,459+1,526,207+276,413+1,054,770 = 15,658,523`.
Ten of the 18 ran under 1.0 minute; all 18 ran under 3.0 minutes.

---

## 3. Was the prompt fit for the work?

The rendered prompt is 34,127 characters as it arrived (`result 0db63e41… get-agent-prompt` → `LEN 34127`),
under the 50,000-char ceiling `codeweaverPromptStatics`' docblock names.

### What the prompt got right, and what the agent did about it

**Step 1 — "make ONE call: `get-quest({ questId: 'QUEST_ID', flowId: '<your flow>', packageName: '<your package>' })`."**
The session made exactly that call, with all three arguments:

```
{"questId": "1be07040-b9ec-476c-a439-0b4fbb0123cd", "flowId": "send-message-with-images", "packageName": "web"}
```

One call, a 28,430-character result, and no follow-up calls needed. Compliant.

**`[BUILD] You run no build, no ward and no test of any kind.`** The main session's 22 Bash commands contain
zero `npm run build` and zero `npm run ward`. Its only write is the map:
`MAIN SESSION Edit/Write calls: [('Write', '…/.quest-plans/e203cbe2-…-map.md')]`. Zero `Edit` calls.
**"You read code. You never write it"** and `[BUILD]` were both obeyed exactly.

**`[HELPERS] Never sleep. Never poll…  end your turn on a plain message and no tool call.`**
`sleep invocations across main + 38 subagents: 0`. Nine turns end on the pattern the rule names, e.g.
`9.1m say: "Group 1 is out — three agents on the contracts and statics. Ending the turn while they run; the notifications bring me back."`
This is the highest-leverage rule in the prompt, and it worked without exception.

**Step 3 — "A map, not an essay. One line per file."** The map is 9,899 bytes / 121 lines: five groups, a
`PROVES` block of 25 rows, and a six-line `TRAPS` block. Each `PROVES` row pairs one **observable** — one
specific behavior the map promises to prove — with the test that proves it, plus terminals and edges. The map
also carries a transport decision the prompt never asked for. That decision turned out to be the load-bearing
finding of the whole pass:

> Transport decision: `msw/node` (2.12) does NOT intercept XMLHttpRequest — grep of `node_modules/msw/lib/node`
> finds no `XMLHttpRequest`; only browser/native/iife carry it.

That was established by two `python3` probes at 4.8m, before a single sub-agent was briefed. It is the reason the
pass shipped a real XHR proxy instead of discovering the problem three groups in.

### Where the prompt did not match the work

**1. The scope block the prompt was designed to carry never rendered — because it is dead code.**
`codeweaverScopeBlockTransformer` exists to render the seams (each node this cell shares with another package,
and how far along that package's own half of the work is) and the shared homes. Neither appeared:

```
Seams -> []
Shared homes -> []
```

A repo-wide search finds the transformer referenced by **only its own test**:

```
packages/orchestrator/src/transformers/codeweaver-scope-block/codeweaver-scope-block-transformer.test.ts
packages/orchestrator/src/transformers/codeweaver-scope-block/codeweaver-scope-block-transformer.ts
```

`workItemToPromptTransformer` is the transformer that actually renders `$ARGUMENTS`, and it never calls the
scope-block transformer. The whole Operation Context this session received was:

```
Quest ID: 1be07040-b9ec-476c-a439-0b4fbb0123cd
Work Item ID: 7546da90-f77b-479a-9b70-96802f47bc2f
Operation Item ID: e203cbe2-c047-42c2-87cb-2973e93660c5
Your operation item: [codeweaver] Codeweaver: build this slice — package: web · flow: send-message-with-images
```

The file has existed since `13a4331ab 2026-08-14` and was last edited `4419d0d43 2026-08-30 21:09:19`, two days
before this run. It was never wired in. The session had to reconstruct the seam picture itself, from
`git log --name-only -n 6` at 0.5m and 12 `Read`s. It got this right — the map's opening paragraph is that seam
summary, written by hand. But nothing told the session where `server`'s half of the flow stood. The prompt
still asked step 5's question 4 ("Does the seam hold? … If that half is not built yet, write down what you
assumed") — with no data behind it to answer from.

**2. The prompt requires signing labelled edges by id, and `get-quest` does not print edge ids.**
`## Recording what you claim` demands `edges: [ { id: '<the labelled edge id>', codeweaverSignoff: { … } } ]`,
and step 1 promises "every edge with its branch label". The render carries labels but not ids — of the eight
edge ids this cell eventually signed, **seven are absent from the 28,430-char `get-quest` result**:

```
  shift-yes: ABSENT      yes-images: ABSENT     newline-back: ABSENT
  shift-no: ABSENT       rejected-back: ABSENT  accepted-no: ABSENT   accepted-yes: ABSENT
  no-images: PRESENT
```

(The four terminal node ids — `insert-newline`, `send-text-only`, `send-rejected`, `clear-composer` — are all
present.) The session recovered by hunting the quest file on disk across three consecutive Bash calls:

```
 3.5m CALL Bash(… description=Find the quest json file for this quest)
 3.6m CALL Bash(… description=Search dungeonmaster homes for the quest file)
 3.7m CALL Bash(… description=Print flow edges and nodes with ids)
```

That worked only because this is the dogfood repo, where `.dungeonmaster/` sits inside the checkout. It is a
workaround the prompt neither authorises nor anticipates.

**3. The brief template's `PROVE` line names a ward scope that is wrong for this package.**
The template says `npm run ward -- --only lint,test -- <this brief's own paths>`. `test` is the alias for
`unit,integration,e2e`, and `web` is `frontend-react` — e2e-eligible. The operator silently corrected it: the
first two briefs used `lint,test`, and every brief from #4 onward used `lint,unit`. Across all 38 sub-agents:

```
WARD --only SHAPES across all subagents:
    46  lint,unit
    35  unit
    17  (no --only)      <- all of these are `ward -- detail <runId>` plus the reviewer's --staged
     3  lint,test
     1  lint
```

The prompt was wrong and the agent was right, three briefs in.

**4. "Two changes go in one group only when they touch different files" is the wrong invariant.**
The map's GROUP 5 says "each agent owns different files", and it was true. The composer (`a155b8642d3022923`)
and the panel (`a6c5888344f994a6e`) went out in one message at 64.9m and 65.3m, touching disjoint files. They
still collided — on the *interface*, not the file:

> `74.7m 561s say: "A real seam issue surfaced: the composer passes \`onProgress\` on every send, so a text-only
> call is \`{ message, onProgress }\` rather than \`{ message }\`. That breaks three panel assertions and
> contradicts the same omit-what-isn't-needed rule \`images\` follows."`

The panel agent then sat for 50 minutes until a `SendMessage` at 124.6m told it the sibling had settled, and
returned `FILES: none (no edits this round — the sibling's fix alone resolved it)`.

**5. The `wall` routing table has no row for a scope wall.** `agent-acb9af1d389492b63` returned:

> `**NEXT: wall** — someone with \`packages/web/src/brokers/**\` / \`packages/web/src/adapters/xhr/**\` access
> needs to make \`xhrPostWithProgressAdapterProxy\` support multiple coexisting instances…`

The prompt's table says `wall` → "stop sending work out… then go to step 8", and step 8/9 say signal `blocked`.
Following that literally would have halted the quest over a proxy bug the session could fix in one dispatch.
The operator ignored the table, correctly, and dispatched the repair instead. Nothing in the prompt licenses
that decision: `[WALL]` defines a wall as environmental, but the brief template's own `RETURN` block invites a
sub-agent to write `wall — <what a person must change>` for anything outside its file list.

**6. `unconfirmable` was never used, in a browser package.** The prompt: *"a jsdom read proves nothing about
what a browser paints. Where the observable's own surface is somewhere a unit test cannot reach, record it
`unconfirmable`."* This cell signed 37 **units** — a unit being any one observable, node, or edge that needs
a sign-off — and marked all 37 `confirmed`, zero `unconfirmable`. That includes `check-progress-bar-shown`,
whose evidence is a jsdom `hasProgressBar()` read. This was vindicated in the event: every one of those
observables later carried `flowriderSignoff: confirmed` and `siegemasterSignoff: confirmed` too. But the
prompt asked for a distinction, and the session never drew it. The instruction bought nothing here.

**7. The session under-counted its own sign-offs.** `156.5m say: "All 35 units signed."` The actual write
landed 37 (`observables=25 nodes(terminals)=4 edges=8 TOTAL=37`, `verdicts: {'confirmed': 37}`). This caused no
harm. But the prompt tells the codeweaver "EVERY UNIT IN YOUR CELL CARRIES ONE OF THOSE TWO VERDICTS BEFORE YOU
SIGNAL" without giving it any tool to check that against — no way to know its **denominator**, the total count
of units it should be matching. `get-qa-checklist` is exactly that tool: the flowrider and siegemaster roles
already use it as their denominator check. The codeweaver prompt never mentions `get-qa-checklist`, and this
session never called it.

---

## 4. What went well

**1. Zero polling, zero sleeps, zero wasted turn-waits — 133.6 minutes of clean concurrency (0 tokens).**
`sleep invocations across main + 38 subagents: 0`. Nine turns end on a bare message. The 883-second wait at
22.3m, the 1,340-second wait at 125.1m and the 1,057-second wait at 156.6m each cost the session one
notification-resume turn, not a poll loop. Mechanism: the `[HELPERS]` rule plus the harness's task-notification
re-entry.

**2. The transport decision was made before any brief went out, at ~1 minute of cost.**
`4.8m CALL Bash(… description=Check whether msw node setup includes the XHR interceptor)` and
`4.8m CALL Bash(… description=Locate XHR interceptor files)`. Had this landed in group 3 instead, the three
broker agents would each have built against `StartEndpointMock` and each needed re-doing. Mechanism: step 2's
"Read the code… find what already exists" taken seriously, applied to `node_modules` and not just `packages/`.

**3. Sign-off evidence is genuinely falsifiable, on every one of the 37.** Sample:

> `check-text-only-body-has-no-images-key` — `packages/web/src/brokers/quest/chat/quest-chat-broker.test.ts:133-155
> — two cases … each asserting expect(proxy.getRequestBody()).toStrictEqual({ message: '<text>' }). toStrictEqual
> is what makes it bite: a stray images: [] fails it. Both watched red against \`images: images ?? []\`.`

> `check-composer-locked-in-flight` — `…chat-input-widget.test.tsx:1453 … Fails when either \`&& !isSending\` on
> contentEditable or \`disabled={isSending}\` on SEND_BUTTON is removed from the render.`

Every one carries a `file:line`, the assertion, and the mutation that turns it red. Mechanism: the brief
template's `PROVED:` shape (`<test file:line> · <the assertion, quoted> · <the wrong value that turns it red> ·
<the red I watched>`) transcribed verbatim into `evidence`, exactly as `## Recording what you claim` instructs.

**4. Four real defects were found by the operator reading returns, not by a test going red.** The closing
message at 174.6m lists all four:

- the adapter's `RangeError` on `status === 0`, which hung the promise forever
- the two-proxy `globalThis.XMLHttpRequest` collision
- the progress bar showing on text-only sends, because *"the test was green because its fake never invoked the
  handler — it proved the fake, not the widget"*
- the msw/node XHR gap

The operator caught three of the four by judging a sub-agent's own green report — precisely what the "read
what came back" step exists for.

**5. The `SendMessage` correction at 107.9m is the cheapest possible repair.** Rather than dispatching a fresh
agent against 989 lines of new test file, the operator resumed the agent that wrote it:

> `"Your work is right — this is a defect in the spec I gave you, not in what you built. … Your text-only companion
> case passes anyway, because the test's fake \`onSendMessage\` never invokes the \`onProgress\` it was handed. So
> the test proves the fake's behaviour, not the widget's."`

Cost: 1,416 output tokens on the operator's side, a 243-second wait, and the agent returned
`**NEXT:** pass. All 17 prior observables' evidence is unchanged; only \`check-progress-bar-shown\`'s text-only
companion and the one text-only call-shape assertion moved, both now proven red-then-green against the actual
defect described.` A fresh agent would have re-read the file and re-derived the context.

**6. The reviewer earned its 17.6 minutes.** It found a genuinely missing test — the create-surface's new
`throw err;` had nothing exercising it, and *"a regression back to swallowing would let a failed \`questNewBroker\`
call silently clear the composer as if the send had succeeded"* — and corrected a proxy comment that misdescribed
the XHR routing mechanism. Then `BUILD: green (npm run build, all 13 packages, run twice)`,
`WARD: npm run ward -- --staged — green on both runs`, `COMMIT: 3275de52b`, `NEXT: pass`. One review pass, no
rework loop.

**7. The work held downstream.** The quest's next ward gate (work item [10]) went red — but on
`packages/web/src/contracts/pasted-image-draft/pasted-image-draft-contract.test.ts` and
`packages/web/src/transformers/data-url-split/data-url-split-transformer.test.ts`, both belonging to work item
[7]'s cell. Not one of this cell's 54 files appears in the two `testFailures`.

---

## 5. What agents did that they should not have

**Finding 1 — 15 of 20 depth-1 sub-agents ran `npm run build`, 23 times, which every brief forbade.**
Every brief's `PROVE` block carried the literal line `no npm run build · no run-ward MCP tool · no commit ·
never widen the ward`, and the operator's own prompt explains why: *"a wave of sub-agents running it at once
hands each other type errors on correct code."* Measured:

```
TOTAL npm run build calls across all 38 subagents: 23
agent-a2e9daecce4e0d79d: builds=4      agent-a63170fa8e4b9623e: builds=2
agent-aea9161e3d5264efe: builds=2      agent-ae1d2690ddd38159c: builds=3  (the reviewer — permitted)
plus one each: a155, a1c7, a6c5, a70b, a7c2, a8f0, abcb, abe9, ac43, acab, acb9, aee2
```

Several announced it in their own returns, so the operator saw it and let it stand:
`a7c2cbd1869aacbd9`: *"a full repo build (\`npm run build\`) was also run and exited 0 before these changes"*;
`a2e9daecce4e0d79d`: *"\`npm run build\` (unpiped, full monorepo) also exits 0"*;
`acb9af1d389492b63`: *"\`npm run build\` is green (all 13 packages, 0 errors)"*.
**Cost:** not separable from those agents' wall clock, but a full `npm run build` in this repo is ~60–90 s and
20 of the 23 were run while at least one sibling agent was live. **The prompt forbade it, in every brief.**

**Finding 2 — two sub-agents ran `git stash push`, and no prompt in the chain forbids them.**

```
agent-a2e9daecce4e0d79d: git stash push -- packages/web/src/adapters/xhr/post-with-progress/xhr-post-with-progress-adapter.proxy.ts
agent-acb9af1d389492b63: git stash push -- packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts packages/web/src/bindings…
```

Both ran on a branch four sibling sub-agents were writing to, with the entire pass uncommitted. The operator's
own prompt bans `stash / reset / checkout -- / clean` under `NOT YOURS`. The reviewer's prompt bans them too,
under `[GIT]`. The **code-writing sub-agent brief template bans neither.** Its `TRAPS` guidance is only *"Put
both [GIT FORMS] refusals in every brief's `TRAPS`"* — which covers `git -C` and pipe-chaining, not destructive
verbs. **Cost:** none realised — both stashes were red-first diagnostics and were restored. But this is the one
class of session on the pass with write access that could silently destroy the other nineteen sub-agents' work,
and it is the only one with no written ban. **The prompt permitted it by omission.**

**Finding 3 — one sub-agent edited a file outside its `FILES` list, in a package outside the cell.**
`agent-abcbd55169db156af` (follow-up broker):

> `NEXT: pass. One thing worth the orchestrator's eyes: I touched \`packages/testing/src/index.ts\` (outside my
> assigned FILES list) and ran a scoped \`npm run build --workspace=@dungeonmaster/testing\`, since there was no
> way to produce a valid branded \`RequestCount\` for the new proxy otherwise.`

The operator handled it correctly — `48.8m CALL mcp__dungeonmaster__modify-quest(...)` adding `testing` to
`packagesAffected`, then `48.8m say: "The follow-up broker needed a \`RequestCountStub\` export from
\`@dungeonmaster/testing\`, so I've added \`testing\` to the quest's affected packages."` **Cost:** ~0.5 min of
operator time. But it caused Finding 4.

**Finding 4 — one whole sub-agent (`abe97a8d32fcbff5d`) exists only because two group-3 agents raced on a
missing export.** `agent-ae387319590d4830d` (chat broker), running at the same time as `abcbd55169db156af`, hit
the same missing `RequestCountStub` and worked around it:

> *"I used the codebase's allowed \`JSON.parse(x) as T\` pattern, since there's no exported contract/stub
> available cross-package to re-brand it properly. If \`@dungeonmaster/testing\` is meant to export
> \`RequestCountStub\` for cross-package use, that's a one-line addition to \`packages/testing/src/index.ts\`
> that's outside my edit scope."*

The operator saw both returns and dispatched a third agent to undo the workaround
(`61.5m CALL Agent(description=Replace RequestCount cast with stub …)`), which returned
`FILES: \`packages/web/src/brokers/quest/chat/quest-chat-broker.proxy.ts\` — replaced the bare \`as RequestCount\`
cast with \`RequestCountStub({ value: Number(xhrProxy.getRequestCount()) })\``. **Cost: 1.5 min of wall,
5,490 output tokens, 1,510,921 context-in tokens** — a whole session bootstrap for a one-line change. The
prompt's group model has no concept of two agents in one group needing the same not-yet-existing export.

**Finding 5 — group 5 was dispatched before group 4 had landed, and it cost 50 minutes of a live agent.**
`63.9m say: "Dispatching the composer work now — it depends only on the prop signature, not on the binding, so it
can run alongside."` The prompt is explicit: *"a group never goes out before the group it needs has landed."*
The judgement was defensible on files but wrong on interfaces (see §3.4). `a6c5888344f994a6e` was dispatched at
65.3m, reported the seam break at 74.7m, and then stayed alive doing nothing until the `SendMessage` at 124.6m
woke it. **Cost: 59.8 minutes of agent lifetime, 38,679 output tokens and 11,363,800 context-in tokens for a
final `FILES: none (no edits this round — the sibling's fix alone resolved it)`.** Its first-pass edits to
`chat-panel-widget.tsx` (+7/-…) and `.test.tsx` (+78/-…) did land, so the run was not worthless — but 50 of its
60 minutes were spent parked. **The prompt forbade the parallelism that caused it.**

**Finding 6 — the XHR-proxy collision was a design consequence of the map, not a sub-agent's mistake, and cost
32.4 minutes to unwind.** The map put all three broker proxies onto one `registerSpyOn(globalThis,
'XMLHttpRequest')`. Three agents implemented it in parallel in group 3. The binding agent in group 4 discovered
it and returned `NEXT: wall`. The operator diagnosed it (`90.3m say: "Confirmed — each proxy instance keeps its
own private \`state\`, and only the last-registered implementation is ever used."`) and dispatched the repair.
**Cost: `agent-a2e9daecce4e0d79d` ran 32.4 min, 130,468 output tokens, 18,156,900 context-in tokens, and spawned
5 explorers of its own** — the second-most expensive agent of the pass, for a collision the map created. The
prompt required exactly what happened; nothing in step 3 asks whether two files in different groups will share a
global.

**Finding 7 — 18 explorer sub-agents were spawned to look up things the three mandatory standards documents
name but do not explain.** Categorising the 18 questions, read verbatim from each explorer's own brief:
**4 ESLINT-RULE-LOOKUP, 6 REPO-CONVENTION-LOOKUP, 7 SIGNATURE-OR-PATH-LOOKUP, 1 OTHER.** Seventeen of the
eighteen were started after their parent had already fetched `get-architecture`, `get-syntax-rules` and
`get-testing-patterns`. That trio of calls is item 1 in every brief's `READ FIRST` block. Those three
documents total 94,985 characters and contain:

```
--- get-architecture (19,056 chars):     no-magic-numbers ABSENT · ban-primitives ABSENT ·
                                         forbid-non-exported-functions ABSENT · enforce-proxy-patterns ABSENT
--- get-syntax-rules (24,528 chars):     ban-primitives PRESENT x1; the other three ABSENT
--- get-testing-patterns (51,401 chars): ban-primitives x2 · forbid-non-exported-functions x1 ·
                                         enforce-proxy-patterns x1 · StubArgument x1 · registerSpyOn x11
```

**The four eslint-rule explorers were not redundant — the docs genuinely lack the answer.** Checked against the
tool-result text captured in the parents' own transcripts, `get-syntax-rules` carries exactly one relevant
passage and it is generic:

> `### Function Arguments vs Return Types **ban-primitives rule: Inputs allow primitives, returns require
> branded types** - Input args can use raw primitives (inline object types) - Return types must use branded
> types/contracts.`

It says nothing about type aliases, generic type arguments (`Map<string, X>`), or file-type exemptions. That
gap is exactly what `agent-a3a4cb92d86172c38` was sent to find, and what it found: *"The rule listens on
**every** `TSStringKeyword`/`TSNumberKeyword` node in the file, unconditionally — it is not scoped to function
signatures."* `forbid-non-exported-functions` and `enforce-proxy-patterns` appear nowhere in
`get-syntax-rules` or `get-architecture` at all. **Cost: 30,858 output tokens and 4,862,111 context-in tokens
for the four**, plus the 14 others. The cheapest of the 18 — `agent-a787e8e7eac5a8c11`, "Find ByteLengthStub
file path" — spent **133,757 context-in tokens and a full session bootstrap to return one file path.** The
prompt neither permitted nor forbade depth-2 explorers. The brief template says nothing about sub-agents at
all.

**Finding 7a — two explorers asked the identical question six seconds apart, from the same parent.**
`agent-a73a382864cf3e985` dispatched `a0dcfe4b29d1c66a3` at `0.8m` and `aca21aba097c39202` at `0.9m`. Their
second asks are the same search:

> a0dcfe4b — *"Find any existing zod contract in packages/web/src/contracts/** that uses `z.custom<...>()` for a
> function type"*
> aca21aba — *"search for \"z.custom\" across packages/web/src/contracts to see if any existing contract
> validates a function value with z.custom, and show its full file content if found"*

**Cost: 3,269 output tokens and 540,478 context-in tokens for the duplicate.** And the answer turned out moot —
the parent's own return says *"`onProgress` stayed required (not `.optional()`) — `z.custom<UploadProgressHandler>(...)`
compiled and typechecked fine as a required field, no `exactOptionalPropertyTypes` conflict surfaced."*

**Finding 7b — two explorers ninety-three minutes apart asked the same "does a URL brand exist" question, and
the second had to rediscover what the first one's parent had since created.**

> `aca21aba097c39202` (03:54, parent `a73a3828`) — *"I want to know if a Zod brand called 'RequestUrl' already
> exists anywhere (a `.brand<'RequestUrl'>()` call), to avoid creating a duplicate/conflicting brand name."*
> `a983e2c259e47e7de` (05:27, parent `a2e9daec`) — *"search for any EXISTING branded Zod string contract meant
> to represent a generic URL path, route, or endpoint string… Report back: does such a contract already exist?"*

The second's answer names the artifact the first parent built:
*"packages/web/src/contracts/upload-progress-post/upload-progress-post-contract.ts:25:
`url: z.string().min(1).brand<'RequestUrl'>()` — an inline field brand inside another contract, not a standalone
URL contract."* Nothing in the pass carries a fact from one cell of the tree to another. Each branch
re-discovers what another branch already found. **Cost: 1,987 output tokens, 416,459 context-in tokens.**

**Finding 8 — one explorer was spawned before its parent had read the standards it was told to read first.**
`agent-a4e9726b2fb2d4cb9` dispatched `a1f5d30f99732d43c` at `1.2m CALL Agent(description=Investigate
registerSpyOn dedup behavior for XMLHttpRequest …)`, then fetched `get-architecture` / `get-syntax-rules` /
`get-testing-patterns` at `1.4m`. Its brief's `READ FIRST` block names all three. 17 of 18 explorers were
spawned after; this is the one that was not. **The prompt required the order.**

**Finding 9 — three of nine sampled explorers show no evidence their answer was ever read.** Their parents
dispatched them, paid for them, and then never used what they found.

The `Agent` tool only returns a launch placeholder when a sub-agent starts — *"Async agent launched
successfully… You know nothing about its results until that notification arrives"* — so a parent has to come
back later and read the notification to actually collect the answer. For three explorers,
`a0dcfe4b29d1c66a3`, `aca21aba097c39202`, and `a1f5d30f99732d43c`, that never happened: their agentId and the
distinctive terms from their answers never appear again anywhere in the parent's transcript, and no
`SendMessage` ever retrieves the result.

`a1f5d30f99732d43c` is the clearest case. It was sent to settle whether a documented bug claim in a proxy
comment was still true. It found the claim was **false/stale**. That verdict never resurfaces anywhere in its
parent's transcript. Two levels up, the operator then spent 32.4 minutes and 18.2M tokens on
`agent-a2e9daecce4e0d79d` unwinding the very proxy-collision question that unread answer had already settled.

**Cost of the three unread explorers: 16,085 output tokens and 2,338,034 context-in tokens**
(`3,611+3,269+12,205` output; `742,786+540,478+1,054,770` context-in), paid for and thrown away. Nothing in
the prompt or the brief template tells a sub-agent's parent that it must read a helper's answer before acting
on it.

**Finding 10 — one explorer found a real precedent and the parent then wrote code that discards it.**
`agent-af6208a0486c8a2bf` was asked how existing proxies cast to `HTMLButtonElement` and answered *"Found one
clear match… type cast `as HTMLButtonElement`… chat-input-widget.proxy.tsx:176-177."* The parent's edit at that
exact location removes the pattern: `(screen.getByTestId('SEND_BUTTON') as HTMLButtonElement).disabled` becomes
`screen.getByTestId('SEND_BUTTON').hasAttribute('disabled')`. **Cost: 1,187 output tokens, 176,818 context-in
tokens** for a precedent the parent asked for and then declined to follow.

**Finding 11 — the composer agent ran 30 ward invocations and 351 turns for one file set.**
`agent-a155b8642d3022923`: `turns=351 out=185,561 ctx-in=99,529,046`, 47.0 minutes, `Edit: 93`, `Bash: 53`, and
30 of those Bash calls were `npm run ward`. It also carried the longest brief of the twenty, at 14,065 characters — three times the median. That directly
contradicts the prompt's own instruction: *"Write a FILE MAP and terse instructions. Never prose. … long
briefs are how adherence dies."* That brief is also one of three missing the required
`MUST BE TRUE` section (the others: `a4e9726b2fb2d4cb9`, and `aea9161e3d5264efe` which is missing both `DO` and
`MUST BE TRUE`). **Cost: 99,529,046 context-in tokens — 26.6% of all sub-agent context — in one agent.**
**The prompt forbade the brief length.**

**Finding 12 — `get-testing-patterns` alone cost 51,401 bytes of the operator's context at 0.4 minutes,
and was fetched again by all 19 code-writing sub-agents.** The `READ FIRST` line in every brief mandates it.
That is 20 fetches of a 51 KB document in one pass (plus `get-architecture` at 28,430 bytes and
`get-syntax-rules` at 24,528 bytes, also 20× each). ~2.1 MB of identical text pulled into 20 separate contexts.
**The prompt required it**, and it is the correct requirement — but the cost is not visible anywhere.

**Finding 13 — no `unconfirmable` verdicts, and no denominator check.** See §3.6 and §3.7. 37 units all
`confirmed`; the session announced 35. Nothing in the prompt gives the codeweaver a way to count its own cell,
and `get-qa-checklist` is never mentioned in the codeweaver prompt though it exists and takes exactly the
`operationItemId` this session held.

---

## 6. Suggested fixes

One fix per finding in §5 and per structural problem in §3. Each names the file and the concrete edit, with the
estimate shown. Roughly descending by saving, with the three largest being Fix 13 (~50M tokens), Fix 16
(32.4 min + 18.2M tokens) and Fix 8 (~4.9M tokens per cell).

**Fix 1 — Wire `codeweaverScopeBlockTransformer` into `workItemToPromptTransformer`, or delete it.**
*File:* `packages/orchestrator/src/transformers/work-item-to-prompt/work-item-to-prompt-transformer.ts`.
*Edit:* after the four `parts` lines, for `workItem.role === 'codeweaver'`, push
`...codeweaverScopeBlockTransformer({ quest, operationItem: linkedOperation })`. The transformer already returns
`[]` when there is nothing to say, so the empty case is already handled safely. If the block is not wanted, delete the
transformer and its test rather than leaving a 174-line file that only its own test imports.
*Saved:* the 5.6 minutes of P1 spent reconstructing the seam picture by hand from `git log` and 12 `Read`s, plus
the unanswerable step-5 question 4. **≈4 min and ~150k context tokens per codeweaver cell**, times 8 cells on
this quest. Addresses §3.1.

**Fix 2 — Print labelled-edge ids in the `get-quest` flow render.**
*File:* the flow text renderer behind `mcp__dungeonmaster__get-quest` (the same renderer that already prints
terminal node ids). *Edit:* render each labelled edge as `#<edgeId> "<label>"` the way nodes are rendered
`[#<nodeId>]`. *Saved:* three Bash probes and ~0.4 min here, but more importantly it removes a dependency on
`.dungeonmaster/` being readable from the worktree — which is true in this dogfood repo and not guaranteed for an
end-user install, where the same three probes would fail and the eight edge sign-offs the prompt demands could
not be written at all. **Correctness fix, not a time fix.** Addresses §3.2.

**Fix 3 — Change the brief template's `PROVE` line from `--only lint,test` to `--only lint,unit`.**
*File:* `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, the `PROVE` block
inside `## Briefing a sub-agent`. *Edit:* `npm run ward -- --only lint,unit -- <this brief's own paths>`, and add
one line: `never \`test\` — it expands to unit,integration,e2e and a sub-agent must never start a browser run`.
*Saved:* this operator corrected it itself by brief #4, so the direct cost here was two briefs — but a
frontend-react cell that did *not* notice would have 19 sub-agents each starting Playwright. **Prevents a
multi-minute-per-agent failure mode.** Addresses §3.3.

**Fix 4 — Add the destructive-git ban to the sub-agent brief template's `TRAPS`.**
*File:* `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, the paragraph
beginning *"Put both [GIT FORMS] refusals in every brief's `TRAPS`"*. *Edit:* extend it to
*"Put both [GIT FORMS] refusals AND this line in every brief's `TRAPS`: never `git stash`, `reset`,
`checkout --`, `clean` or `rebase` — the whole pass is uncommitted and several sessions share this tree."*
*Saved:* zero on this run (both stashes were restored), but this is the only session class on a pass with write
access to the tree and no written ban. **Risk elimination.** Addresses Finding 2.

**Fix 5 — Make the brief template's `PROVE` block state the build ban as a consequence, not a bare prohibition.**
*File:* same statics file, `PROVE` block. *Edit:* replace `no npm run build · no run-ward MCP tool · no commit ·
never widen the ward` with `no \`npm run build\` — ward's typecheck is \`tsc -b\`, which writes the shared
\`dist/\`; siblings are running right now and your build hands them type errors on correct code. Your reviewer
runs the build. Also: no run-ward MCP tool · no commit · never widen the ward.` *Saved:* 23 build invocations
were measured, ~20 of them concurrent with a live sibling. At ~60–90 s each that is **20–30 minutes of sub-agent
wall clock**, plus the type errors they hand each other. Addresses Finding 1.

**Fix 6 — Replace "touch different files" with "touch different files AND do not share an interface" in the
grouping rule, and add a wave-0 contract step.**
*File:* same statics file, step 4 (*"Two changes touching the same file never go out together"*) and step 3
(*"Two changes go in one group only when they touch different files"*). *Edit:* add — *"Two changes also never
go out together when one DEFINES a signature the other CALLS. Put the signature in an earlier group as a type-only
change, and brief both sides against the file that holds it."* *Saved:* the 50 parked minutes of
`agent-a6c5888344f994a6e` and the 243-second `SendMessage` round trip, plus its 11,363,800 context-in tokens.
**≈50 min of agent lifetime and ~11.4M tokens.** Addresses §3.4 and Finding 5.

**Fix 7 — Add a `wall` triage row to `## Reading a sub-agent's return`.**
*File:* same statics file, the four-row `NEXT:` table. *Edit:* split the `wall` row:
`wall — and the blocker is a FILE another session owns` → *"that is a rework, not a wall. Dispatch the change it
names."*; `wall — and the blocker is the ENVIRONMENT (a denied command, a missing credential, an unreachable
service)` → *"stop dispatching and go to step 8."* And in `## Briefing a sub-agent`'s `RETURN` block, change
`wall — <what a person must change>` to `wall — <what a person must change; a file outside your list is a
\`rework\`, not a wall>`. *Saved:* zero here — the operator ignored the table and got it right — but a session
that followed the table literally would have signalled `blocked` and halted the quest at 89.9m with 85 minutes of
work still to do. **Prevents a whole-quest halt.** Addresses §3.5.

**Fix 8 — Put the local eslint rule catalogue in `get-syntax-rules`.**
*File:* whatever statics back the `get-syntax-rules` MCP responder (`packages/mcp/src/responders/architecture/`).
*Edit:* add a section enumerating each rule in `@dungeonmaster/local-eslint` and `@dungeonmaster/eslint-plugin`
— name, what it forbids, its exemptions, and where the exemption list lives. Today the coverage is thin:

- `no-magic-numbers` appears in none of the three documents
- `forbid-non-exported-functions` and `enforce-proxy-patterns` each appear once, in `get-testing-patterns`, by
  name only
- `ban-primitives`' only statement in `get-syntax-rules` is the generic *"Input args can use raw primitives…
  Return types must use branded types/contracts"*, which says nothing about the type-alias and
  generic-argument cases that actually blocked an edit

*Saved:* the four eslint-rule explorers cost
30,858 output tokens and 4,862,111 context-in tokens on this pass alone, plus ~7.6 min of their parents' wall
clock. Across a quest with eight codeweaver cells this is the single largest recurring waste.
**≈4.9M tokens per cell.** Addresses Finding 7.

**Fix 9 — Cap depth-2 explorers in the brief template, and forbid the trivial ones.**
*File:* same statics file, `## Briefing a sub-agent`. *Edit:* add a line to the template:
`You may spawn AT MOST one Explore sub-agent, and only for a question that needs more than three files read.
A file path, a type signature or an existing stub's shape is a \`discover\` call, not an agent. Never dispatch
two helpers with overlapping questions in one message.` Ten of the 18 explorers ran under 1.0 minute;
`agent-a787e8e7eac5a8c11` spent 133,757 context-in tokens returning one file path; and one parent dispatched two
agents six seconds apart to run the same `z.custom` search. *Saved:* the 10 sub-minute explorers plus the
duplicate — **~14,300 output tokens and ~4.1M context-in tokens** — and the session-bootstrap latency of each.
Addresses Findings 7, 7a, 7b and 10.

**Fix 10 — Make the brief template require that a helper's answer is actually collected before acting on it.**
*File:* same statics file, `## Briefing a sub-agent`. *Edit:* add — `If you start a helper, you must READ its
answer before you write the code it was meant to inform. The Agent tool returns a launch receipt, not a result;
the result arrives as a notification. A helper you dispatch and never read is a helper you should not have
dispatched.` Three of nine sampled explorers (`a0dcfe4b29d1c66a3`, `aca21aba097c39202`, `a1f5d30f99732d43c`)
have no trace of their answer anywhere in the parent's later transcript, and `a1f5d30f99732d43c`'s finding —
that the proxy bug claim it was sent to verify was stale — went unread while the operator two levels up spent
32.4 minutes unwinding the same proxy question. *Saved:* **16,085 output tokens and 2,338,034 context-in tokens
outright**, plus whatever the unread `a1f5d30f` answer would have shortened off `agent-a2e9daecce4e0d79d`'s
32.4-minute repair. Addresses Finding 9.

**Fix 11 — Move `READ FIRST` ahead of dispatch in the brief template's ordering.**
*File:* same statics file, the `READ FIRST` block. *Edit:* promote it above `DO` in the template's section
order and word it as a gate: `READ FIRST (before any edit and before any helper you start)`. One explorer,
`a1f5d30f99732d43c`, was dispatched at its parent's `1.2m` and the three standards docs were fetched at `1.4m`
— so the question was framed by a session that had not yet been told the repo's rules. *Saved:* no measurable
minutes on this run; it is a correctness ordering. Addresses Finding 8.

**Fix 12 — Give the brief template a way to say "this was already looked up".**
*File:* same statics file, `## Briefing a sub-agent`, the `TRAPS` guidance. *Edit:* add — `Where an earlier
group already settled a repo question — a brand that exists, a convention, a rule's scope — write the ANSWER
into TRAPS rather than letting this sub-agent rediscover it.` Two explorers 93 minutes apart asked whether a
URL/route brand existed; the second's answer had to name the artifact the first one's parent had since created.
*Saved:* **1,987 output tokens and 416,459 context-in tokens** on this pass, and the pattern recurs once per
convention per cell. Addresses Finding 7b.

**Fix 13 — Cap the brief length, in the statics, with a number.**
*File:* same statics file, *"Write a FILE MAP and terse instructions. Never prose."* *Edit:* append
*"A brief over 6,000 characters is a brief that will be skimmed. If yours is longer, the change is two changes —
split it."* Three briefs broke the template's own section list: `a155b8642d3022923` at 14,065 characters, missing
`MUST BE TRUE`; `a4e9726b2fb2d4cb9` at 8,451 characters, missing `MUST BE TRUE`; and `aea9161e3d5264efe` at
5,698 characters, missing both `DO` and `MUST BE TRUE`. All three are cases where the operator was writing
prose rather than a map.
*Saved:* `a155b8642d3022923` consumed 99,529,046 context-in tokens — 26.6% of all sub-agent context — in 351
turns. Halving it is **~50M tokens**. Addresses Finding 11.

**Fix 14 — Name `get-qa-checklist` in the codeweaver prompt as the denominator call.**
*File:* same statics file, step 8 (*"EVERY UNIT IN YOUR CELL CARRIES ONE OF THOSE TWO VERDICTS BEFORE YOU
SIGNAL"*). *Edit:* add *"Your denominator is `get-qa-checklist({ questId: 'QUEST_ID', operationItemId:
'OPERATION_ITEM_ID' })`. Call it once at step 8 and reconcile what you signed against what it lists."* The tool
already derives track, flows and packages from the operation item id alone. *Saved:* not a time saving — the
session signed 37 and said 35, which is harmless — but it turns "every unit" from a claim into a check.
Addresses §3.7 and Finding 13.

**Fix 15 — Add a shared-export pre-check to step 3.**
*File:* same statics file, `#### When the code you need lives in another package`. *Edit:* add *"Before you brief
a group, ask which of its changes need a symbol the shared package does not export yet. Put that export in the
group AHEAD of them, as its own change. Two agents in one group discovering the same missing export will each
invent a different workaround, and undoing both costs a third agent."* *Saved:* the whole of
`agent-abe97a8d32fcbff5d` — 1.5 min, 5,490 output tokens, 1,510,921 context-in tokens — plus the
`packages/testing` build the follow-up agent ran mid-wave. Addresses Findings 3 and 4.

**Fix 16 — Make step 3 ask which changes will share a global or a singleton.**
*File:* `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, step 3, next to
*"Order comes from what a change needs, not from the flow's shape."* *Edit:* add — *"Before you group, ask which
changes will register on the SAME global, singleton or module-level registry — a spy on `globalThis`, a shared
route map, a process-wide cache. Two files are different files; one `globalThis` is one `globalThis`. Where
several changes share one, the registry itself is a change in an earlier group, and every one of them is briefed
against it."* The map put three broker proxies onto one `registerSpyOn(globalThis, 'XMLHttpRequest')`. Three
agents implemented it in parallel. The last registration silently won every call, and it took the binding
agent's `NEXT: wall`, two groups later, to surface the problem. *Saved:* the entirety of
`agent-a2e9daecce4e0d79d` —
**32.4 min, 130,468 output tokens, 18,156,900 context-in tokens, and the 5 explorers it spawned** — plus the
17.6-minute operator diagnosis (P7) that preceded it. The second-largest single saving in this list.
Addresses Finding 6.

**Fix 17 — Let a sub-agent inherit the standards instead of re-fetching 95 KB of them.**
*File:* the `get-architecture` / `get-syntax-rules` / `get-testing-patterns` responders under
`packages/mcp/src/responders/architecture/`, plus the `READ FIRST` block in
`codeweaver-prompt-statics.ts`. *Edit:* two options, either alone helps — (a) add a `folderTypes` /
`packageName` filter parameter so a contracts-only sub-agent fetches the contracts slice rather than all
51,401 bytes of `get-testing-patterns`; or (b) have the parent paste the handful of rules it already knows are
relevant into the brief's `TRAPS` and reduce `READ FIRST` to the one document the change actually needs. On
this pass the three documents (28,430 + 24,528 + 51,401 = 104,359 bytes) were fetched by the operator and by
all 19 code-writing sub-agents — **20 fetches, ~2.1 MB of identical text pulled into 20 separate contexts.**
*Saved:* even a 50% slice cut is **~1 MB of context per cell**. The requirement itself is correct and should
stay; it is the granularity that is wrong. Addresses Finding 12.

---

## 7. Raw figures appendix

### `python3 tmp/transcript-digest.py summary 0db63e41-57e1-4ab4-b73f-5817849b334c`

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/0db63e41-57e1-4ab4-b73f-5817849b334c.jsonl
LINES     593
START     2026-09-02T03:45:30.135000+00:00
END       2026-09-02T06:40:04.138000+00:00
WALL      2:54:34.003000  (174.6 min)
TYPES     {'queue-operation': 52, 'attachment': 146, 'user': 120, 'last-prompt': 41, 'atis-latch': 40, 'assistant': 194}
MODELS    {'claude-opus-5': 194}

TOKENS (this transcript only, excludes subagents)
  assistant API responses : 194
  input (uncached)        : 388
  cache_read              : 55,573,617
  cache_creation          : 1,057,011
  output                  : 495,230
  of which thinking       : 163,426
  TOTAL context-in        : 56,631,016

TOOL CALLS (97 total)
     31  Read
     22  Bash
     20  Agent
      9  mcp__dungeonmaster__discover
      3  ToolSearch
      2  mcp__dungeonmaster__modify-quest
      2  SendMessage
      1  mcp__dungeonmaster__get-agent-prompt
      1  mcp__dungeonmaster__get-quest
      1  mcp__dungeonmaster__get-architecture
      1  mcp__dungeonmaster__get-syntax-rules
      1  mcp__dungeonmaster__get-testing-patterns
      1  mcp__dungeonmaster__get-project-inventory
      1  Write
      1  mcp__dungeonmaster__signal-back

TOOL RESULT BYTES fed back: 678,384

SUBAGENTS 38  (run `subagents` subcommand for the roster)
```

### `python3 tmp/transcript-digest.py subagents 0db63e41-57e1-4ab4-b73f-5817849b334c`

```
09-02 03:53:49  +   5.6m  agent-a73a382864cf3e985  general-purpose/sonnet  turns= 66 out=24,390 ctx-in=6,866,921
           desc: Build upload progress contracts
           tools: {'ToolSearch': 1, 'Read': 14, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Agent': 2, 'Bash': 12, 'Write': 6, 'Edit': 1}
09-02 03:54:09  +   4.6m  agent-aee222949f244fe17  general-purpose/sonnet  turns= 51 out=20,466 ctx-in=4,562,296
           desc: Build composer send payload contract
           tools: {'ToolSearch': 2, 'Read': 12, 'Bash': 11, 'mcp__dungeonmaster__discover': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Write': 3}
09-02 03:54:33  +   3.4m  agent-a1c7ce3182a0ec06b  general-purpose/sonnet  turns= 44 out=12,474 ctx-in=4,055,112
           desc: Add pasted-image statics keys
           tools: {'Read': 13, 'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 2, 'Edit': 4, 'Bash': 6}
09-02 03:54:35  +   0.9m  agent-a0dcfe4b29d1c66a3  Explore/None  turns= 23 out=3,611 ctx-in=742,786
           desc: Find StubArgument type and z.custom optional pattern examples
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 10, 'Read': 2}
09-02 03:54:41  +   0.6m  agent-aca21aba097c39202  Explore/None  turns= 17 out=3,269 ctx-in=540,478
           desc: Check for existing RequestUrl brand and z.custom usage
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 6, 'Read': 2, 'Bash': 1}
09-02 04:00:18  +   3.3m  agent-a63170fa8e4b9623e  general-purpose/sonnet  turns= 46 out=13,173 ctx-in=3,883,769
           desc: Build upload percent transformer
           tools: {'ToolSearch': 1, 'Read': 11, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 3, 'Write': 3, 'Bash': 5, 'Edit': 2}
09-02 04:01:00  +  21.4m  agent-ac434c1e6802c8319  general-purpose/sonnet  turns=124 out=118,827 ctx-in=22,393,547
           desc: Build XHR progress POST adapter
           tools: {'ToolSearch': 1, 'Read': 30, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 26, 'Write': 5, 'Bash': 10, 'Edit': 5}
09-02 04:01:26  +   6.3m  agent-acab64e7db2bca014  general-purpose/sonnet  turns= 83 out=28,355 ctx-in=8,620,474
           desc: Build upload progress bar widget
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 17, 'mcp__dungeonmaster__discover': 9, 'Bash': 14, 'Write': 5}
09-02 04:01:43  +   5.8m  agent-a891bac099428259c  general-purpose/sonnet  turns= 78 out=22,247 ctx-in=8,078,973
           desc: Point overlay at statics
           tools: {'ToolSearch': 2, 'Read': 9, 'Bash': 15, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 5, 'Edit': 11}
09-02 04:23:46  +   7.1m  agent-a8f09f6eba76b1ace  general-purpose/sonnet  turns= 69 out=28,767 ctx-in=7,235,696
           desc: Harden XHR adapter ok-derivation
           tools: {'ToolSearch': 1, 'Read': 12, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Bash': 9, 'Edit': 11, 'mcp__dungeonmaster__discover': 1}
09-02 04:24:22  +  11.3m  agent-ae387319590d4830d  general-purpose/sonnet  turns=110 out=66,743 ctx-in=15,697,264
           desc: Wire images into quest chat broker
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 34, 'mcp__dungeonmaster__discover': 18, 'Bash': 7, 'Write': 4, 'Edit': 4}
09-02 04:24:49  +   9.0m  agent-abcbd55169db156af  general-purpose/sonnet  turns= 92 out=41,920 ctx-in=12,410,769
           desc: Wire images into followup broker
           tools: {'ToolSearch': 3, 'Read': 24, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 6, 'Bash': 11, 'Edit': 5, 'Write': 3}
09-02 04:25:18  +  20.4m  agent-a7c2cbd1869aacbd9  general-purpose/sonnet  turns= 96 out=60,786 ctx-in=14,344,488
           desc: Wire images into quest new broker
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 20, 'Agent': 5, 'Bash': 14, 'Write': 6, 'Edit': 9}
09-02 04:26:02  +   2.5m  agent-a8c856c8d928a8a63  Explore/sonnet  turns= 52 out=17,065 ctx-in=2,935,655
           desc: Locate contracts and stubs for quest-new-broker rewrite
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 18, 'Read': 23}
09-02 04:29:10  +   1.2m  agent-ac070ee6e3c67701d  Explore/sonnet  turns= 26 out=7,565 ctx-in=1,071,213
           desc: Find errorBodyContract usage pattern in web brokers
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 8, 'Read': 10}
09-02 04:31:05  +   2.1m  agent-a7cb04b825c71ba68  Explore/sonnet  turns= 42 out=9,698 ctx-in=2,134,321
           desc: Check if brokers ever inline a zod schema directly
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 19, 'Bash': 3, 'Read': 5}
09-02 04:35:47  +   0.6m  agent-a56d92c86a21c251d  Explore/sonnet  turns= 17 out=3,359 ctx-in=376,644
           desc: Check GuildIdStub, QuestIdStub, ProcessIdStub, UserInputStub signatures
           tools: {'Bash': 1, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 2, 'Read': 7}
09-02 04:40:05  +   1.1m  agent-a3320f175ff9e1e7a  Explore/sonnet  turns= 18 out=6,212 ctx-in=669,411
           desc: Check no-magic-numbers eslint rule scope for test files
           tools: {'Read': 4, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 5, 'Bash': 1}
09-02 04:46:39  +  27.8m  agent-acb9af1d389492b63  general-purpose/sonnet  turns=149 out=124,147 ctx-in=35,360,991
           desc: Thread images through chat binding
           tools: {'ToolSearch': 1, 'Read': 25, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 9, 'Edit': 33, 'Bash': 14}
09-02 04:46:57  +   1.5m  agent-abe97a8d32fcbff5d  general-purpose/sonnet  turns= 21 out=5,490 ctx-in=1,510,921
           desc: Replace RequestCount cast with stub
           tools: {'ToolSearch': 1, 'Read': 5, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Edit': 2, 'Bash': 2}
09-02 04:50:24  +  47.0m  agent-a155b8642d3022923  general-purpose/sonnet  turns=351 out=185,561 ctx-in=99,529,046
           desc: Lock composer and show progress
           tools: {'ToolSearch': 2, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 45, 'Agent': 5, 'Edit': 93, 'Bash': 53}
09-02 04:50:47  +  59.8m  agent-a6c5888344f994a6e  general-purpose/sonnet  turns= 81 out=38,679 ctx-in=11,363,800
           desc: Thread send signature through panel
           tools: {'ToolSearch': 2, 'Read': 16, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Edit': 14, 'Bash': 7, 'mcp__dungeonmaster__discover': 7}
09-02 04:51:02  +   0.7m  agent-a548dfd6d199650aa  Explore/None  turns= 20 out=1,934 ctx-in=611,928
           desc: Check chat-panel-widget onSendMessage usage
           tools: {'Bash': 3, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 6, 'Read': 2}
09-02 04:52:31  +   0.2m  agent-a47c8f6d041f7e0ab  Explore/None  turns=  4 out=569 ctx-in=116,184
           desc: Check domComposerInsertTextAdapter signature
           tools: {'Read': 1}
09-02 04:53:06  +   0.4m  agent-ac9cf1da1fabd7f09  Explore/None  turns= 10 out=1,344 ctx-in=208,986
           desc: Check userInputContract constraints
           tools: {'Bash': 1, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 2, 'Read': 1}
09-02 04:58:33  +   0.4m  agent-af6208a0486c8a2bf  Explore/None  turns=  8 out=1,187 ctx-in=176,818
           desc: Check for HTMLButtonElement cast patterns in proxies
           tools: {'Bash': 1, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 1, 'Read': 1}
09-02 05:06:25  +   0.3m  agent-a787e8e7eac5a8c11  Explore/None  turns=  6 out=809 ctx-in=133,757
           desc: Find ByteLengthStub file path
           tools: {'Bash': 2, 'Read': 1}
09-02 05:16:36  +  32.4m  agent-a2e9daecce4e0d79d  general-purpose/sonnet  turns=100 out=130,468 ctx-in=18,156,900
           desc: Route XHR proxy by URL
           tools: {'ToolSearch': 2, 'Read': 12, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Agent': 5, 'Write': 6, 'Edit': 9, 'Bash': 17}
09-02 05:17:36  +   1.6m  agent-abb9b5b1d2ddbb28d  Explore/None  turns= 20 out=7,058 ctx-in=746,561
           desc: Find forbid-non-exported-functions rule definition
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 5, 'Bash': 1, 'Read': 4}
09-02 05:23:06  +   2.1m  agent-a3a4cb92d86172c38  Explore/None  turns= 37 out=10,975 ctx-in=1,919,932
           desc: Find ban-primitives exemptions for Map and type aliases
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 11, 'Bash': 2, 'Read': 9}
09-02 05:27:37  +   0.4m  agent-a983e2c259e47e7de  Explore/None  turns= 10 out=1,987 ctx-in=416,459
           desc: Search for existing branded URL/route contracts in web package
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 4, 'Read': 1}
09-02 05:38:08  +   3.4m  agent-a70bba6b7f06ba04f  general-purpose/sonnet  turns= 45 out=12,626 ctx-in=5,995,960
           desc: Widen followup send prop
           tools: {'ToolSearch': 2, 'Read': 10, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Edit': 4, 'Bash': 5, 'mcp__dungeonmaster__discover': 2}
09-02 05:40:23  +   1.8m  agent-a2db38136efabb132  Explore/None  turns= 26 out=6,553 ctx-in=1,526,207
           desc: Understand enforce-proxy-patterns constructor side-effect rule
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 5, 'Read': 6, 'Bash': 3}
09-02 05:42:48  +   0.7m  agent-a40e14624f8b4fbd5  Explore/None  turns= 11 out=3,098 ctx-in=276,413
           desc: Check fs-read-file-sync-adapter.proxy.ts for lint-disable convention
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 2, 'Bash': 1, 'Read': 2}
09-02 05:49:55  +  22.9m  agent-a4e9726b2fb2d4cb9  general-purpose/sonnet  turns=134 out=115,765 ctx-in=34,998,100
           desc: Forward images on create surface
           tools: {'Read': 33, 'Agent': 1, 'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 3, 'Edit': 22, 'Bash': 14}
09-02 05:51:09  +   2.3m  agent-a1f5d30f99732d43c  Explore/sonnet  turns= 24 out=12,205 ctx-in=1,054,770
           desc: Investigate registerSpyOn dedup behavior for XMLHttpRequest
           tools: {'Bash': 3, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 5, 'Read': 7}
09-02 06:14:31  +   5.5m  agent-aea9161e3d5264efe  general-purpose/sonnet  turns= 63 out=17,265 ctx-in=7,137,931
           desc: Give upload contract a reader
           tools: {'ToolSearch': 2, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 8, 'mcp__dungeonmaster__discover': 3, 'Edit': 10, 'Bash': 9}
09-02 06:22:02  +  17.5m  agent-ae1d2690ddd38159c  general-purpose/sonnet  turns=176 out=62,805 ctx-in=37,021,421
           desc: Review web send-with-images slice
           tools: {'ToolSearch': 3, 'mcp__dungeonmaster__get-agent-prompt': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__get-quest': 1, 'Bash': 43, 'Read': 44, 'mcp__dungeonmaster__discover': 12, 'Edit': 3}

SUBAGENT TOTALS  agents=38 turns=2350 output=1,229,452 context-in=374,882,902
```

### Depth-1 classification, `NEXT:` line and brief shape

Sections checked against the template's required set (`FILES / DO / MUST BE TRUE / TRAPS / DO NOT TOUCH /
READ FIRST / PROVE / RETURN`). "missing" lists what the brief omitted.

| # | Agent | Class | Brief chars | Missing sections | `NEXT:` line (verbatim, trimmed) |
|---|---|---|---:|---|---|
| 1 | `a73a382864cf3e985` | builder | 5,739 | — | `NEXT: pass` |
| 2 | `aee222949f244fe17` | builder | 5,202 | — | `NEXT: pass` |
| 3 | `a1c7ce3182a0ec06b` | builder | 6,040 | — | `NEXT: pass` |
| 4 | `a63170fa8e4b9623e` | builder | 5,132 | — | `NEXT: pass` |
| 5 | `ac434c1e6802c8319` | builder | 10,114 | — | `**NEXT: pass.** \`npm run build\` exits 0; \`npm run ward -- --only lint,unit -- packages/web/src/adapters/xhr/post-with-progress\` is green (lint 3/3, unit 8/8).` |
| 6 | `acab64e7db2bca014` | builder | 5,965 | — | `NEXT: pass — widget, proxy, and test are complete and green under the scoped ward run` |
| 7 | `a891bac099428259c` | builder | 4,166 | — | `NEXT: pass` |
| 8 | `a8f09f6eba76b1ace` | **repair** of #5 | 6,445 | — | `**NEXT:** pass.` |
| 9 | `ae387319590d4830d` | builder | 8,433 | — | `**NEXT:** pass — all three files are done, ward (lint+unit, scoped) is green` |
| 10 | `abcbd55169db156af` | builder | 7,945 | — | `NEXT: pass. One thing worth the orchestrator's eyes: I touched \`packages/testing/src/index.ts\` (outside my assigned FILES list)…` |
| 11 | `a7c2cbd1869aacbd9` | builder | 8,951 | — | `## NEXT` / `pass — scoped ward … is green; a full repo build (\`npm run build\`) was also run and exited 0` |
| 12 | `acb9af1d389492b63` | builder | 7,656 | — | `**NEXT: wall** — someone with \`packages/web/src/brokers/**\` / \`packages/web/src/adapters/xhr/**\` access needs to make \`xhrPostWithProgressAdapterProxy\` support multiple coexisting instances` |
| 13 | `abe97a8d32fcbff5d` | **repair** of #9 | 4,226 | — | `NEXT: pass` |
| 14 | `a155b8642d3022923` | builder | **14,065** | `MUST BE TRUE` | `**NEXT:** pass. All 17 prior observables' evidence is unchanged` (second pass, after `SendMessage`) |
| 15 | `a6c5888344f994a6e` | builder | 5,555 | — | `NEXT: pass` · `FILES: none (no edits this round — the sibling's fix alone resolved it)` |
| 16 | `a2e9daecce4e0d79d` | **repair** of #9/#10/#11 | 9,664 | — | `**NEXT: pass.**` |
| 17 | `a70bba6b7f06ba04f` | builder | 6,169 | — | `NEXT: pass` |
| 18 | `a4e9726b2fb2d4cb9` | builder | 8,451 | `MUST BE TRUE` | `**NEXT:** pass.` |
| 19 | `aea9161e3d5264efe` | **repair** of #1/#9 | 5,698 | `DO`, `MUST BE TRUE` | `NEXT: pass — both fixes are landed, tested, ward-green on the scoped run` |
| 20 | `ae1d2690ddd38159c` | **reviewer** | 241 | n/a (reviewer brief) | `NEXT: pass` |

**Counts: 15 builders, 4 repairs, 1 reviewer, 18 explorers.** Plus 2 `SendMessage` in-place corrections
(to #14 and #15), which brings repairs to **6 of 22 dispatch actions**.

Repair proof, quoted:

- **#8** — operator at `37.7m`: *"Group 2 is complete. One defect in the XHR adapter needs fixing before the
  brokers rely on it — dispatching that alongside group 3."*
- **#13** — operator at `50.3m`: *"Chat broker landed with red-first proofs. One note: it used an
  `as RequestCount` cast because the stub wasn't exported yet — the follow-up agent has since added that export,
  so I'll clean that up."* Agent's own `FILES:` — *"replaced the bare `as RequestCount` cast with
  `RequestCountStub({ value: Number(xhrProxy.getRequestCount()) })`"*.
- **#16** — operator at `89.9m`: *"The binding hit a real collision I introduced: two broker proxies both stage
  `globalThis.XMLHttpRequest` at `calledWith([])`, and the later registration silently wins every call."*
- **#19** — brief text: *"FIX 1 — `uploadProgressPostContract` has no runtime reader … Six files import its
  `UploadProgressHandler` TYPE, but nothing calls `uploadProgressPostContract.parse` outside the contract's own
  test. An exported zod schema nobody parses is dead weight."* Operator at `149.1m`: *"Two gaps closed: an
  exported contract nothing parsed, and a `PURPOSE` line claiming the follow-up broker doesn't carry images."*

### Depth-2 explorer roster — question, category, parent, cost

Questions quoted verbatim from each explorer's own brief (excerpted).

| # | Explorer | Parent | Dur | Turns | Out | Ctx-in | Category | Question |
|---|---|---|---:|---:|---:|---:|---|---|
| 1 | `a0dcfe4b29d1c66a3` | `a73a3828` contracts | 0.9m | 23 | 3,611 | 742,786 | SIGNATURE/PATH | *"Find the definition of `StubArgument` type… 2. Find any existing zod contract in packages/web/src/contracts/** that uses `z.custom<...>()` for a function type"* |
| 2 | `aca21aba097c39202` | `a73a3828` contracts | 0.6m | 17 | 3,269 | 540,478 | REPO-CONVENTION | *"I want to know if a Zod brand called 'RequestUrl' already exists anywhere… to avoid creating a duplicate/conflicting brand name."* |
| 3 | `a8c856c8d928a8a63` | `a7c2cbd1` new broker | 2.5m | 52 | 17,065 | 2,935,655 | SIGNATURE/PATH | *"Is there an existing \"quest-new-response-contract\" file anywhere…? 2. Show the exact contents of …fetch-post-with-status-result-contract.ts"* |
| 4 | `ac070ee6e3c67701d` | `a7c2cbd1` new broker | 1.2m | 26 | 7,565 | 1,071,213 | REPO-CONVENTION | *"I need to see how `errorBodyContract`… is actually consumed by broker files that use `fetchPostWithStatusAdapter`"* |
| 5 | `a7cb04b825c71ba68` | `a7c2cbd1` new broker | 2.1m | 42 | 9,698 | 2,134,321 | REPO-CONVENTION | *"does ANY file under packages/web/src/brokers/** define a zod schema… directly inline in the broker file itself, rather than importing a schema from a `contracts/` file?"* |
| 6 | `a56d92c86a21c251d` | `a7c2cbd1` new broker | 0.6m | 17 | 3,359 | 376,644 | SIGNATURE/PATH | *"read these stub files… and report their exact function signatures… guild-id.stub.ts, quest-id.stub.ts… user-input.stub.ts"* |
| 7 | `a3320f175ff9e1e7a` | `a7c2cbd1` new broker | 1.1m | 18 | 6,212 | 669,411 | **ESLINT-RULE** | *"whether raw numeric HTTP status code literals… are allowed directly inline inside `*.test.ts` files, or whether ESLint's `no-magic-numbers` rule… forbids them there too."* |
| 8 | `a548dfd6d199650aa` | `a155b864` composer | 0.7m | 20 | 1,934 | 611,928 | SIGNATURE/PATH | *"Find every place in packages/web/src/** that renders `<ChatInputWidget` and passes `onSendMessage`"* |
| 9 | `a47c8f6d041f7e0ab` | `a155b864` composer | 0.2m | 4 | 569 | 116,184 | SIGNATURE/PATH | *"read the file …dom-composer-insert-text-adapter.ts and report… 1. The exact function signature… 2. The return type"* |
| 10 | `ac9cf1da1fabd7f09` | `a155b864` composer | 0.4m | 10 | 1,344 | 208,986 | SIGNATURE/PATH | *"find and read the file defining `userInputContract`… its exact zod chain (min length, max length, any transforms)"* |
| 11 | `af6208a0486c8a2bf` | `a155b864` composer | 0.4m | 8 | 1,187 | 176,818 | REPO-CONVENTION | *"Search …*.proxy.tsx for any existing pattern that reads `.disabled` off a testid-queried element, or that casts `screen.getByTestId(...)` to a more specific HTML element type"* |
| 12 | `a787e8e7eac5a8c11` | `a155b864` composer | 0.3m | 6 | 809 | 133,757 | SIGNATURE/PATH | *"find the stub file for the ByteLength contract… 1. The exact file path of the .stub.ts file 2. The exact exported function name and its parameter shape"* |
| 13 | `abb9b5b1d2ddbb28d` | `a2e9daec` XHR routing | 1.6m | 20 | 7,058 | 746,561 | **ESLINT-RULE** | *"I need to understand the exact scope of the `@dungeonmaster/forbid-non-exported-functions` ESLint rule… Does the rule flag ANY locally-declared function expression/arrow function assigned to a `const` inside another exported function's body"* |
| 14 | `a3a4cb92d86172c38` | `a2e9daec` XHR routing | 2.1m | 37 | 10,975 | 1,919,932 | **ESLINT-RULE** | *"hit a pre-edit-lint block from a rule that flags \"Raw number/string type is not allowed\"… I need to understand the EXACT scope of this \"ban-primitives\"… ESLint rule."* |
| 15 | `a983e2c259e47e7de` | `a2e9daec` XHR routing | 0.4m | 10 | 1,987 | 416,459 | REPO-CONVENTION | *"search for any EXISTING branded Zod string contract meant to represent a generic URL path, route, or endpoint string"* |
| 16 | `a2db38136efabb132` | `a2e9daec` XHR routing | 1.8m | 26 | 6,553 | 1,526,207 | **ESLINT-RULE** | *"I hit a pre-existing ESLint rule `@dungeonmaster/enforce-proxy-patterns` firing on a `.proxy.ts` file… \"Proxy constructor must only create child proxies and setup mocks. Found side effect: routes.set()\""* |
| 17 | `a40e14624f8b4fbd5` | `a2e9daec` XHR routing | 0.7m | 11 | 3,098 | 276,413 | REPO-CONVENTION | *"find the file `fs-read-file-sync-adapter.proxy.ts`… does it contain an ESLint disable comment… used to acknowledge a known gap in the `@dungeonmaster/enforce-proxy-patterns` rule"* |
| 18 | `a1f5d30f99732d43c` | `a4e9726b` create surface | 2.3m | 24 | 12,205 | 1,054,770 | OTHER — runtime behaviour verification | *"research (read-only, no edits) a specific behavior in this repo's `@dungeonmaster/testing` package, to settle whether a documented bug claim in a comment is currently still true."* |

**Category counts: ESLINT-RULE-LOOKUP 4 · REPO-CONVENTION-LOOKUP 6 · SIGNATURE-OR-PATH-LOOKUP 7 · OTHER 1 = 18.**

Cost arithmetic:
`3,611+3,269+17,065+7,565+9,698+3,359+6,212+1,934+569+1,344+1,187+809+7,058+10,975+1,987+6,553+3,098+12,205 = 98,498` output
(= 98,498 / 1,229,452 = **8.01%** of sub-agent output);
`742,786+540,478+2,935,655+1,071,213+2,134,321+376,644+669,411+611,928+116,184+208,986+176,818+133,757+746,561+1,919,932+416,459+1,526,207+276,413+1,054,770 = 15,658,523` context-in
(= 15,658,523 / 374,882,902 = **4.18%** of sub-agent context).
**10 of 18 ran under 1.0 min; 18 of 18 under 3.0 min** (longest: `a8c856c8d928a8a63` at 2.5m).

Standards-doc timing per parent (elapsed minutes within each parent's own transcript):

```
a73a382864cf3e985  docs @0.2m · explorers @0.8m, 0.9m                          2/2 after
a7c2cbd1869aacbd9  docs @0.2m · explorers @0.7m, 3.9m, 5.8m, 10.5m, 14.8m      5/5 after
a155b8642d3022923  docs @0.2m · explorers @0.6m, 2.1m, 2.7m, 8.1m, 16.0m       5/5 after
a2e9daecce4e0d79d  docs @0.3m · explorers @1.0m, 6.5m, 11.0m, 23.8m, 26.2m     5/5 after
a4e9726b2fb2d4cb9  explorer @1.2m · docs @1.4m                                 0/1 — BEFORE
                                                                     TOTAL:  17/18 after
```

Explorer answer consumption, sampled 9 of 18:

| Explorer | Consumed? | Evidence |
|---|---|---|
| `a983e2c259e47e7de` | **used** | answered *"No `RoutePath`, `ApiRoute`, or generic `Url` brand exists… it would need to be created new"*; parent's next Write uses a plain `route: string` and creates no contract |
| `a47c8f6d041f7e0ab` | **used** | answered *"`editor` is typed as `HTMLElement`… and not nullable — no `\| null`"*; parent's next edit adds `const editor = editorRef.current; if (editor === null) return;` |
| `a787e8e7eac5a8c11` | **used** | answered the stub path and `ByteLengthStub({ value }: { value?: number } = {})`; parent's next turn: *"Now let's update the test file's imports"* |
| `a2db38136efabb132` + `a40e14624f8b4fbd5` | **used** | a40e1462 answered *"No [precedent]… a plain prose comment… but never actually suppresses the lint check"*; parent then wrote `void routes.set(route, state);` with a comment saying `void` documents the intent *"rather than dodging the rule"* |
| `abb9b5b1d2ddbb28d` | **used** | same repair; informed the same `void` decision |
| `a3320f175ff9e1e7a` | used as a confirmatory check | answered *"`detectObjects: false`… `{ status: 404 }` is never flagged"*; parent's ensuing ward reds were unrelated (empty-function lint, GuildId slug format) |
| `af6208a0486c8a2bf` | **found, then discarded** | answered *"Found one clear match… `as HTMLButtonElement`… chat-input-widget.proxy.tsx:176-177"*; parent's edit at that exact location removes the cast in favour of `.hasAttribute('disabled')` |
| `a0dcfe4b29d1c66a3` | **no evidence of consumption** | parent's tool result is only *"Async agent launched successfully… You know nothing about its results until that notification arrives"*; no later mention of `StubArgument`, `z.custom` or the agentId, and no `SendMessage` retrieval |
| `aca21aba097c39202` | **no evidence of consumption** | same placeholder; parent's return then states *"`onProgress` stayed required (not `.optional()`)… no `exactOptionalPropertyTypes` conflict surfaced"* — the question was moot |
| `a1f5d30f99732d43c` | **no evidence of consumption** | same placeholder; zero later hits for `isDispatcher`, `mockStagedBestMatchTransformer`, `DISPATCHER` or the agentId anywhere in the parent's transcript |

### Forbidden-command audit across the 38 sub-agents

```
TOTAL npm run build calls across all 38 subagents: 23
TOTAL npm run ward calls across all 38 subagents: 102
sleep invocations across main + 38 subagents: 0

git stash push -- packages/web/src/adapters/xhr/post-with-progress/xhr-post-with-progress-adapter.proxy.ts   (agent-a2e9daecce4e0d79d)
git stash push -- packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts …                        (agent-acb9af1d389492b63)
git add -A · git commit -m "…" · git push                                                                     (agent-ae1d2690ddd38159c — the reviewer; permitted)
```

### Main-session compliance audit

```
MAIN SESSION Bash commands (22):
   git log --name-only -n 6
   ls .dungeonmaster/guilds/*/quests/ …
   python3 -c " import os,glob home=os.path.expanduser('~/.dungeonmaster') …
   python3 - <<'EOF' import os, json roots = [os.path.expanduser('~/.dungeonmaster'), …
   python3 - <<'EOF' import json p='…/.dungeonmaster/guilds/…/quest.json' …        (print flow edges + node ids)
   python3 -c " import json p='packages/web/package.json' …
   python3 -c " import json d=json.load(open('packages/testing/package.json')) …
   python3 - <<'EOF' import os, re base='node_modules/msw/lib/node' …               (msw XHR interceptor)
   python3 - <<'EOF' import os, re hits=[] for base in ['node_modules/msw/lib']: …
   python3 - <<'EOF' import os,re for root,dirs,files in os.walk('packages/testing/src') …
   python3 - <<'EOF' for p in ['packages/testing/src/flows/endpoint-mock-setup/…
   git log --oneline -n 3
   python3 - <<'EOF' import os,re for root,dirs,files in os.walk('packages/testing/src') …
   python3 - <<'EOF' import json p='…/quest.json' …
   git status --porcelain
   git diff --stat HEAD
   git diff HEAD -- packages/testing/src/index.ts packages/web/src/statics packages/web/src/w…
   git diff HEAD -- packages/web/src/brokers
   git diff HEAD -- packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.tsx
   git diff HEAD -- packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts
   git status --porcelain
   git log --oneline -n 2

MAIN SESSION Edit/Write calls: [('Write', '…/.quest-plans/e203cbe2-c047-42c2-87cb-2973e93660c5-map.md')]
```

Zero `npm run build`, zero `npm run ward`, zero `Edit`, one `Write` — to the one path the prompt permits.

### Rendered prompt vs. static template

```
LEN 34127
Seams -> []
Shared homes -> []
Work item context -> []
Dev Server -> []
Operation Context -> [656, 1095, 1628, 8167, 33811]
```

Rendered `## Operation Context`, verbatim and complete:

```
Quest ID: 1be07040-b9ec-476c-a439-0b4fbb0123cd
Work Item ID: 7546da90-f77b-479a-9b70-96802f47bc2f
Operation Item ID: e203cbe2-c047-42c2-87cb-2973e93660c5
Your operation item: [codeweaver] Codeweaver: build this slice — package: web · flow: send-message-with-images
```

Production call sites for `codeweaverScopeBlockTransformer`:

```
packages/orchestrator/src/transformers/codeweaver-scope-block/codeweaver-scope-block-transformer.test.ts
packages/orchestrator/src/transformers/codeweaver-scope-block/codeweaver-scope-block-transformer.ts
```

(none — the only importer is its own test).

### `get-quest` render coverage of the units this cell had to sign

```
  shift-yes: ABSENT        insert-newline: PRESENT
  shift-no: ABSENT         send-text-only: PRESENT
  no-images: PRESENT       send-rejected: PRESENT
  yes-images: ABSENT       clear-composer: PRESENT
  newline-back: ABSENT
  rejected-back: ABSENT
  accepted-no: ABSENT
  accepted-yes: ABSENT
```

### Standards-document coverage of the four eslint-rule explorer questions

```
--- mcp__dungeonmaster__get-architecture (19,056 chars)
    no-magic-numbers: ABSENT · ban-primitives: ABSENT · forbid-non-exported-functions: ABSENT
    enforce-proxy-patterns: ABSENT · StubArgument: ABSENT · registerSpyOn: ABSENT
--- mcp__dungeonmaster__get-syntax-rules (24,528 chars)
    ban-primitives: PRESENT x1 · everything else above: ABSENT
--- mcp__dungeonmaster__get-testing-patterns (51,401 chars)
    ban-primitives: PRESENT x2 · forbid-non-exported-functions: PRESENT x1
    enforce-proxy-patterns: PRESENT x1 · StubArgument: PRESENT x1 · registerSpyOn: PRESENT x11
    no-magic-numbers: ABSENT
```

### Sign-offs written

```
signoffs by workItem 7546da90-f77b-479a-9b70-96802f47bc2f: observables=25 nodes(terminals)=4 edges=8 TOTAL=37
verdicts: {'confirmed': 37}
```

Sample evidence (all 37 carry this shape):

```
[check-text-only-body-has-no-images-key] verdict=confirmed
   evidence: packages/web/src/brokers/quest/chat/quest-chat-broker.test.ts:133-155 — two cases (no images
   argument, and images: []) each asserting expect(proxy.getRequestBody()).toStrictEqual({ message: '<text>' }).
   toStrictEqual is what makes it bite: a stray images: [] fails it. Both watched red against `images: images ?? []`.

[check-composer-locked-in-flight] verdict=confirmed
   evidence: packages/web/src/widgets/chat-input/chat-input-widget.test.tsx:1453 — with isStreaming false and an
   onSendMessage promise the test has not settled, isEditorEditable() is false and isSendButtonDisabled() is true.
   Fails when either `&& !isSending` on contentEditable or `disabled={isSending}` on SEND_BUTTON is removed.
```

### The commit

```
commit 3275de52b05889760bb1da5f6cfc469b39316a7d
    codeweaver-reviewer: web's half of send-message-with-images — XHR upload-progress transport,
    composer settled-transaction locking, create/chat/followup image wiring
…
 54 files changed, 3492 insertions(+), 370 deletions(-)
```

Reviewer's own edits within that commit (the only two of the 54 files that did not survive exactly as a builder
wrote them):

```
Edit  packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.test.tsx   (added a missing ERROR case)
Edit  packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.proxy.ts       (corrected a misleading comment)
```

### Downstream survival — the next ward gate's two failures

```
projectFolder: @dungeonmaster/web
  packages/web/src/contracts/pasted-image-draft/pasted-image-draft-contract.test.ts
    "INVALID: {dataBase64 decoding over the byte ceiling} => throws for oversized payload"
    Expected substring: "Decoded image exceeds 5242880 bytes"  Received message: "Maximum call stack size exceeded"
  packages/web/src/transformers/data-url-split/data-url-split-transformer.test.ts
    "byte ceiling INVALID: {payload decoding over maxBytesPerImage} => throws"
    RangeError: Maximum call stack size exceeded
```

Both files belong to work item [7] (`web · paste-image-into-composer`). None of this cell's 54 files appears.

### Gap analysis (main session)

```
main session wall: 174.6 min
sum of ALL inter-assistant gaps: 174.5 min over 193 gaps
sum of gaps >= 60s: 151.2 min over 20 gaps
sum of gaps < 60s (active-ish): 23.2 min
gaps >= 300s (5min+): 125.2 min over 10 gaps

BIGGEST 12 GAPS (seconds, at elapsed-min):
     1340s  at  125.1m        613s  at   50.3m
     1057s  at  156.6m        561s  at   65.3m
      981s  at   91.1m        461s  at  116.1m
      914s  at   74.7m        372s  at  149.1m
      883s  at   22.3m        332s  at   39.9m
                              243s  at  108.0m
                              234s  at   18.2m
```

### Ward invocation shapes across all 38 sub-agents

```
    46  lint,unit
    35  unit
    17  (no --only)     — 14 are `ward -- detail <runId>`; 3 are the reviewer's `--staged`
     3  lint,test
     1  lint
```

# Work items 10-12 — ward → spiritmender → ward — the repair cycle on `@dungeonmaster/web`

## 0. Identity

This report covers three work items in a row — a work item is one unit of dispatched work tracked in
the quest's queue. The first work item ran ward, this repo's automated quality check (it runs lint,
typecheck, and tests), and ward failed. The second work item ran spiritmender, the role that reads a
failed ward run and repairs it, and it succeeded. The third work item re-ran ward to confirm the
repair, and it passed. Together the three form one ward-red repair cycle.

The combined window is `2026-09-02T08:28:53.076Z -> 2026-09-02T09:00:10.620Z`, which is
**31 min 17.5 s (31.3 min)**.

| # | Work item id | Role | spawnerType | Session | Status | Window | Wall |
|---|---|---|---|---|---|---|---|
| [10] | `27667fc2-f783-434e-825f-980f1cbb41ff` | ward | `command` | none | **failed** | 08:28:53.076 → 08:33:53.628 | 5.01 min |
| [11] | `4c5e9e8a-10e2-4208-b087-2d60ee7c4c07` | spiritmender | `agent` | `b1461af5-4c03-4275-ab03-cc6f384e1745` | complete | 08:33:53.690 → 08:57:28.368 | 23.58 min |
| [12] | `b58d6606-7613-4515-902c-24daa4442bc1` | ward | `command` | none | complete | 08:57:28.391 → 09:00:10.620 | 2.70 min |

The quest's queue also tracks operation items one level above work items — an operation item is the
larger task a work item is one step of. `quest.json` records three operation items for this cycle.
The two ward operation items both run in `changed` mode: ward's `--changed` flag, which scopes the
check to files that differ from the repo's default branch rather than to every file in the tree.

```json
{ "id": "4e6dcd85-2738-43d7-8ad6-7da9bf8ca664", "role": "ward",
  "text": "Ward gate (changed files)", "status": "complete", "locked": true, "wardMode": "changed" }
{ "id": "9c5fe04d-38e2-4038-a745-3c1920d47368", "role": "spiritmender",
  "text": "Spiritmender: fix ward (changed) failures — wardResult 229c5454-3b1c-4f04-aa67-97350a357b20",
  "status": "complete", "locked": true }
{ "id": "dd89ddb5-2c33-44e2-a383-d6b504f135af", "role": "ward",
  "text": "pt 2: Ward gate (changed files)", "status": "complete", "locked": true, "wardMode": "changed" }
```

- **Work item [10]** depends on `71c1fd22-93e9-4b28-afad-f937fffbb039` (codeweaver [9]). Its
  `lastWardRunId` is `1788337745350-9780` and its `errorMessage` is `"ward_failed"`. Its
  `relatedDataItems` are `["operations/4e6dcd85-…", "wardResults/229c5454-3b1c-4f04-aa67-97350a357b20"]`.
  It started at `08:29:04.557` — 11.5 s of dispatch latency, then 4 min 49.1 s of ward running. It has
  no model, because it is an MCP `run-ward` command, not an agent.
- **Work item [11]** ran on model **`claude-sonnet-5`** (`roleToModelStatics` puts spiritmender on
  sonnet; `get-agent-prompt` echoed `"model": "sonnet"`). It depends on `27667fc2-…` (work item [10]).
  Its `startRef` is `9f8ab692a9f3ac109f4beb0c98e8c064237d66e4`, codeweaver [9]'s commit.
  **Its `retryCount` is 1, `resume` is true, and it started at `08:38:22.618`** — this session was
  killed once mid-item and recovered by `recover-orphaned-work-items-layer-broker`; see §5 finding 3.
  Its `actualSignal` is `"complete"`, and the signal it sent was:
  ```json
  { "questId": "1be07040-b9ec-476c-a439-0b4fbb0123cd",
    "workItemId": "4c5e9e8a-10e2-4208-b087-2d60ee7c4c07", "signal": "complete",
    "operationItemId": "9c5fe04d-38e2-4038-a745-3c1920d47368", "operationStatus": "done" }
  ```
- **Work item [12]** depends on `4c5e9e8a-…` (work item [11]). Its `lastWardRunId` is
  `1788339452894-54de`, and `wardResults/4e51f7ae-1d05-4a66-8036-913fd3452b0c` recorded
  `exitCode: 0`. It started at `08:57:32.094` — 3.7 s of dispatch latency, then 2 min 38.5 s of ward
  running.

**No work item in this cycle spawned a sub-agent.** The two ward items are commands, so they cannot
spawn anything. For the spiritmender, `python3 tmp/transcript-digest.py subagents b1461af5-…` returns
literally `no subagents dir`, and no `b1461af5-…/subagents/` directory exists on disk. This matches
its prompt: `spiritmenderPromptStatics` contains no delegation step and never tells the session to
brief a helper. But the prompt still ships an eight-line `[DELEGATION]` rule about the `Agent`/Task
tool anyway. See §3 and §5 finding 4.

---

## 1. Chronological breakdown — where the time went

The two ward items have no transcript. They have no `sessionId`, because `run-ward` streams its
output to `onLine` and saves a results blob instead of running as a session. Their rows below are
reconstructed from `quest.json` timestamps and the two ward-result blobs.

| Phase | Clock window | Elapsed (in-item) | Min | What happened | Evidence |
|---|---|---|---|---|---|
| **[10] A** dispatch latency | 08:28:53.076 → 08:29:04.557 | — | 0.19 | Work item created by advance; `run-ward` MCP tool picked it up | `createdAt` vs `startedAt` on `27667fc2-…` |
| **[10] B** ward `changed` run | 08:29:04.557 → 08:33:53.628 | — | 4.82 | lint PASS (6 pkgs) · typecheck PASS (13 pkgs) · unit PASS (6 pkgs) · **integration FAIL — `@dungeonmaster/web`, 2 failures** · e2e skip | blob `229c5454-…`, `runId 1788337745350-9780`, `exitCode 1` |
| **[11] 1** hunt the ward blob | 08:33:54 → 08:35:36 | 0.0 → 1.7m | 1.7 | 10 Bash/Read attempts to locate and read `<questFolder>/ward-results/…` — every one refused | `0.9m tool-result "Error: Claude requested permissions to read from …/.dungeonmaster/quests/1be07040-…/ward-results/229c5454-….json, but you haven't granted it yet."`; `1.3m "cat in '…' was blocked. For security, Claude Code may only concatenate files from the allowed working directories for this session: '…/worktrees/try-2-…-1be07040'"` |
| **[11] 2** git orientation | 08:35:36 → 08:35:42 | 1.7 → 1.8m | 0.1 | `git log --oneline -15`, `git diff master...HEAD --name-only` (21,817-byte result) | timeline `1.7m CALL Bash(git log --oneline -15)` |
| **[11] 3** build | 08:35:42 → 08:36:06 | 1.8 → 2.2m | 0.4 | `npm run build 2>&1 \| tail -80` — passed | `2.2m "Build passes."` |
| **[11] 4** ward `--changed` #1 — **lost** | 08:36:06 → 08:38:16 | 2.2 → 4.4m | **2.2** | Whole-repo `--changed` run; process died with the run in flight, producing nothing | `4.4m "The ward run auto-backgrounded past the timeout. I'll wait for its completion notification rather than polling."` |
| **[11] 5** cut-off recovery | 08:38:31 → 08:39:00 | 4.4 → 5.1m | 0.7 | Orphan recovery re-dispatched with `claude --resume`; session re-established state (`git status`, `git log -5`) and read the dead run's partial output file | `4.6m ### INJECTED PROMPT: <task-notification> … <status>stopped</status> … it may have been running when the previous Claude Code process exited`; `4.6m ### INJECTED PROMPT: You were CUT OFF mid-work on this item` |
| **[11] 6** ward `--changed` #2 | 08:39:00 → 08:41:30 | 5.1 → 7.6m | 2.5 | Same whole-repo run, this time it finished and named the failures | `7.6m "Found the failure: one unit test in data-url-split-transformer.test.ts"` |
| **[11] 7** diagnosis | 08:41:30 → 08:44:18 | 7.6 → 10.4m | 2.8 | `ward detail 1788338343137-60f3 <file>` (33,064-byte result), read 4 source files, two `node -e` repros (plain node and a `vm` cross-realm context), read zod's `types.cjs:630-670`, `discover(grep=imageDataUrlContract)` | timeline 7.6m–10.4m |
| **[11] 8** first fix attempt — **disproved** | 08:44:18 → 08:46:24 | 10.4 → 12.5m | 2.1 | Dropped the `u` flag from `imageDataUrlContract`'s regex; the 1-file scoped run went green, the 13-file scoped run came back **`lint FAIL require-unicode-regexp Use the 'u' flag. (line 20)`** plus **7 unit failures** | `11.6m` ward result, quoted in §5 finding 5 |
| **[11] 9** build a jest-level diagnostic | 08:46:24 → 08:49:48 | 12.5 → 15.9m | 3.4 | `tmp/regex-repro.js` + four rewrites of a scratch `zzz-repro.test.ts` inside `packages/web/src/contracts/image-data-url/`, then `ward --only unit -- …/zzz-repro.test.ts` (93 s) | timeline 12.6m–14.4m |
| **[11] 10** standards + the real fix | 08:49:48 → 08:52:06 | 15.9 → 18.2m | 2.3 | `get-syntax-rules`, `get-architecture`, two `discover(superRefine…)` calls, rewrote `image-data-url-contract.ts` as a chunked `superRefine`, deleted the scratch test | `15.9m "Before implementing the real fix, let me check the project's syntax/testing rules"` |
| **[11] 11** scoped verify (web) | 08:52:06 → 08:53:00 | 18.2 → 19.1m | 0.9 | `ward --only lint,typecheck,unit --` 13 web files — green | timeline 18.2m |
| **[11] 12** widen to shared | 08:53:00 → 08:55:00 | 19.1 → 21.1m | 2.0 | Found the same shape in `pastedImageUploadContract` and `base64ByteLengthTransformer`, edited both, `npm run build --workspace=@dungeonmaster/shared` | `19.1m "Let me check whether the shared package's pastedImageUploadContract has the same regex-over-huge-string pattern"` |
| **[11] 13** scoped verify (shared/web/server) | 08:55:00 → 08:57:06 | 21.1 → 23.2m | 2.1 | Two more scoped ward runs (54 s, 16 s) plus three `discover` consumer sweeps | timeline 21.4m, 22.7m |
| **[11] 14** commit + signal | 08:57:06 → 08:57:28 | 23.2 → 23.6m | 0.4 | Read both fixed files back, `git status`, `git add` 3 paths, commit `e0ffce3b2`, `git status`, `signal-back` | `23.5m "Committed as e0ffce3b2."` |
| **[12] A** dispatch latency | 08:57:28.391 → 08:57:32.094 | — | 0.06 | — | `createdAt` vs `startedAt` on `b58d6606-…` |
| **[12] B** ward `changed` run | 08:57:32.094 → 09:00:10.620 | — | 2.64 | All five checks green (e2e skip); the two previously-failing suites are in `passingTests` under **both** `unit` and `integration` for `@dungeonmaster/web` | blob `4e51f7ae-…`, `runId 1788339452894-54de`, `exitCode 0` |

Phase sums: [10] 0.19 + 4.82 = **5.01 min** ✓ · [11] 1.7+0.1+0.4+2.2+0.7+2.5+2.8+2.1+3.4+2.3+0.9+2.0+2.1+0.4 = **23.6 min** ✓ · [12] 0.06 + 2.64 = **2.70 min** ✓ · total **31.3 min** ✓

### Time by category (whole 31.3-min cycle)

| Category | Minutes | % | Which phases |
|---|---:|---:|---|
| Verification / ward (command items) | 7.46 | 23.8% | [10] B, [12] B |
| Verification / ward (inside the spiritmender) | 8.6 | 27.5% | [11] 4, 6, 8-partial, 9-partial, 11, 13 |
| Orientation / reading | 4.6 | 14.7% | [11] 1, 2, 7 |
| Diagnosis that produced the fix | 3.4 | 10.9% | [11] 9 |
| Editing (the three real fixes) | 4.3 | 13.7% | [11] 10, 12 |
| Build | 0.4 | 1.3% | [11] 3 |
| Idle / stall / re-establish after the kill | 0.7 | 2.2% | [11] 5 |
| Dispatch latency | 0.25 | 0.8% | [10] A, [12] A |
| Commit + signal | 0.4 | 1.3% | [11] 14 |
| Planning | 0.0 | 0.0% | none — no planning phase exists in this prompt |

**Ward runs consumed 16.1 of the 31.3 minutes (51.4%).** Of that 16.1 minutes, the session spent
4.7 min re-discovering failures the ward blob already listed (phases 4 and 6). It threw away 2.2 min
of that entirely when the process died.

---

## 2. Chronological token buckets

The two ward items are command runs with no API calls and no tokens. All token spend in this cycle
belongs to work item [11]. The tables below use context-in for the total tokens fed into the model as
input on a given call — both freshly read text and anything pulled back from cache.

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/b1461af5-4c03-4275-ab03-cc6f384e1745.jsonl
LINES     563
START     2026-09-02T08:33:54.362000+00:00
END       2026-09-02T08:57:31.963000+00:00
WALL      0:23:37.601000  (23.6 min)

BUCKETS of 2 min
WINDOW              APIs  CALLS   OUT-TOK    CTX-IN-TOK  RESULT-BYTES  TOP TOOLS
09-02 08:33-08:35    39     21    14,760     2,098,765        46,293  Bashx14, ToolSearchx3, Readx3, mcp__dungeonmaster__get-agent-promptx1
09-02 08:35-08:37     2      1       308       143,550         2,598  Bashx1
09-02 08:37-08:39    16      7     8,351     1,214,646        11,112  Bashx6, Readx1
09-02 08:39-08:41     8      4     3,238       769,366        44,542  Readx3, Bashx1
09-02 08:41-08:43    16      9    19,388     1,894,566        16,962  Bashx5, Readx2, ToolSearchx1, mcp__dungeonmaster__discoverx1
09-02 08:43-08:45     9      4    12,280     1,187,839         7,345  Bashx2, Readx1, Editx1
09-02 08:45-08:47    15      8    23,429     2,208,412        17,169  Writex4, Readx2, Bashx2
09-02 08:47-08:49     9      5    26,567     1,435,997        46,964  Writex1, Bashx1, ToolSearchx1, mcp__dungeonmaster__get-syntax-rulesx1
09-02 08:49-08:51    16      8    20,798     3,040,680        15,422  mcp__dungeonmaster__discoverx2, Readx2, Bashx2, Writex2
09-02 08:51-08:53    11      5    11,660     2,225,802        15,704  Bashx2, Readx2, mcp__dungeonmaster__discoverx1
09-02 08:53-08:55    14      7    18,342     3,033,832        20,679  Editx3, Bashx3, mcp__dungeonmaster__discoverx1
09-02 08:55-08:57    21     10     9,843     4,946,183        29,068  Bashx5, mcp__dungeonmaster__discoverx2, Readx2, mcp__dungeonmaster__signal-backx1
```

### Sub-agent spend attributed to the bucket each sub-agent started in

| Bucket | Sub-agents started | Sub-agent output tokens | Sub-agent context-in |
|---|---|---|---|
| all buckets | **0** | **0** | **0** |

`subagents b1461af5-4c03-4275-ab03-cc6f384e1745` then `no subagents dir`. Nothing to attribute.

### Totals

| Figure | Value |
|---|---|
| Main-session assistant API responses | 176 |
| Main-session input (uncached) | 352 |
| Main-session **cache_read** | **23,700,197** |
| Main-session **cache_creation** | **499,089** |
| Main-session total context-in (uncached + cache_read + cache_creation) | 24,199,638 |
| Main-session output | 168,964 |
| — of which thinking | 119,947 (71.0% of output) |
| Sub-agent output | 0 |
| Sub-agent context-in | 0 |
| **Grand total context-in** | **24,199,638** |
| **Grand total output** | **168,964** |
| Tool-result bytes fed back | 273,858 |

This spend has two notable shapes.

First, `cache_read` is 98.0% of context-in (23,700,197 / 24,199,638). The session re-read one
growing context 176 times and created almost no new cache.

Second, **thinking is 71% of all output tokens.** The spiritmender's prompt frames the work as a
lookup — "the blob names the failures for it" — so this reasoning load is far above what a
lookup-shaped repair should need. §3 explains why: the blob was unreadable, so nothing named
anything to look up.

The busiest bucket by context-in is the last one, `08:55-08:57`, at 4,946,183. That is when the
session did the read-back, the consumer sweep, the commit, and the signal — all at the maximum
context depth.

---

## 3. Was the prompt fit for the work?

### 3.1 The rendered prompt differs from the template in exactly one place, and it is the load-bearing one

`spiritmenderPromptStatics.prompt.template` is 100% present in the rendered prompt — nothing was cut.
The renderer made exactly one substitution: `$ARGUMENTS` became the Operation Context block, and the
`${ptBudget}` interpolation rendered as `3`. Here is the Operation Context that arrived:

```
## Operation Context

Quest ID: 1be07040-b9ec-476c-a439-0b4fbb0123cd
Work Item ID: 4c5e9e8a-10e2-4208-b087-2d60ee7c4c07
Operation Item ID: 9c5fe04d-38e2-4038-a745-3c1920d47368
Your operation item: [spiritmender] Spiritmender: fix ward (changed) failures — wardResult 229c5454-3b1c-4f04-aa67-97350a357b20

Failed ward result: 229c5454-3b1c-4f04-aa67-97350a357b20 (mode: changed, runId: 1788337745350-9780)
Ward detail blob: <questFolder>/ward-results/229c5454-3b1c-4f04-aa67-97350a357b20.json
```

**`<questFolder>` rendered as a literal text string, not a real folder path.** This is not a
placeholder the renderer forgot to fill in. The code at
`packages/orchestrator/src/transformers/work-item-to-prompt/work-item-to-prompt-transformer.ts:171`
writes it out exactly like this, on purpose:

```ts
contentTextContract.parse(
  `Ward detail blob: <questFolder>/ward-results/${String(latestFailedWard.id)}.json`,
),
```

The test file `work-item-to-prompt-transformer.test.ts` asserts that same literal string at lines 742
and 800. So the defect is pinned in place by its own test, sitting right next to the code.

### 3.2 The prompt's step 1 is unexecutable in this repo, and the whole first phase is the consequence

The prompt opens by promising the blob three separate times:

> Your Operation Context below carries a **Failed ward result** id and a **Ward detail blob** path.
> That blob holds the full error output of the ward run that went red. Fix the failures it lists at
> their root cause.

> | **Ward detail blob** | A `<questFolder>/ward-results/<id>.json` path. `Read` it for the full error output: files, error messages, jest diffs. |

> Signal `done` when both of these hold: 1. Every failure named in the blob is fixed.

The blob actually lives at
`<repoRoot>/.dungeonmaster/guilds/21523917-83f7-4e23-a6de-8db1cae2ad96/quests/1be07040-…/ward-results/229c5454-….json`.
The session, though, is sandboxed to its own worktree and cannot reach that path. It tried every
route, and each one was refused:

```
0.9m  "Error: Claude requested permissions to read from /home/brutus-home/projects/codex-of-consentient-craft/.dungeonmaster/quests/1be07040-b9ec-476c-a439-0b4fbb0123cd/ward-results/229c5454-3b1c-4f04-aa67-97350a357b20.json, but you haven't granted it yet."
0.9m  "Error: cat in '…' was blocked. For security, Claude Code may only concatenate files from the allowed working directories for this session: '/home/brutus-home/projects/codex-of-consentient-craft/worktrees/try-2-paste-images-into-web-chat-render-inline-s-1be07040'."
0.5m  "Error: ls in '/home/brutus-home/.dungeonmaster/quests/' was blocked. For security, Claude Code may only list files in the allowed working directories for this session: …"
```

The session spent 1.7 minutes and 10 tool calls on this before it correctly concluded:

> `1.7m` — "The ward-results blob lives outside this worktree's sandbox and I can't read it directly.
> I'll reproduce the failure myself instead by running ward in `changed` mode, which is exactly the
> mode that produced the failed result."

That judgement is exactly what the prompt's `[WALL]` rule asks for — *"A denied command is a wall only
if the JOB has no other route"* — and it is the one instruction in the prompt that the session
followed to the letter under pressure. But the route it fell back to is one the prompt's own `[WARD]`
rule forbids, and that cost 4.7 minutes (phases 4 and 6). The prompt offers no third option. Nothing
in it tells the session that the failing files are also recoverable from `run-ward`'s own output, or
from a scoped ward run over the `git diff master...HEAD --name-only` list it had already fetched at
1.7m.

### 3.3 The `[WARD]` rule and step 2 contradict each other once the blob is missing

> **[WARD] Run ward scoped, in the foreground, with `timeout: 600000`. Never run the bare whole-repo `npm run ward`.**
> …
> ### 2. Reproduce the Failures Yourself
> Re-run ward SCOPED to the failing files **the blob names**, so you see the errors live.

Step 2's scope is defined entirely by the blob. With the blob unreadable, the phrase "scoped to the
failing files" points at nothing, and a whole-repo mode is the only discovery mechanism left. The
session picked `--changed`, the closest legal stand-in for the run that went red. That run took 126 s
before it was killed, then 151 s on the retry. Both runs did carry `timeout: 600000`, so the session
obeyed the `[WARD]` rule's timeout clause. It could not obey the scoping clause, because there was
nothing left to scope to.

Step 2 also says *"the blob names one check type per failure"*. But the blob recorded these failures
under **`integration`**, even though both files are plain `*.test.ts` files, and the spiritmender's
own `--changed` run reported the same failures under **`unit`**. Had the blob been readable, following
that sentence literally would have sent the session to `--only integration`, which runs a different
jest project for these files. See §5 finding 6.

### 3.4 Step 4 was partly ignored, and the omission is the one the prompt shouts about

> **Always call `get-testing-patterns`.** Test failures are the most common error type.

The session called `get-syntax-rules` and `get-architecture` at 15.9m, but it **never called
`get-testing-patterns`.** The tool histogram confirms this: `mcp__dungeonmaster__get-syntax-rules 1`,
`mcp__dungeonmaster__get-architecture 1`, and no `get-testing-patterns` call at all. It did load that
tool's schema — `ToolSearch(query=select:…get-syntax-rules,…get-testing-patterns,…get-architecture)`
at 15.9m — and then called only two of the three tools it had just loaded. The omission was harmless
here, because the fix touched no test file. But the rule is written as unconditional, and the session
did not follow it.

The session likewise never called `get-folder-detail`, which step 4 also names ("once per folder type
you work in"), even though it edited two `contracts/` files and one `transformers/` file.

### 3.5 The `[DELEGATION]` rule has no referent in this prompt, and its advice is wrong for a headless dispatch

Eight lines of the prompt govern the `Agent`/Task tool:

> **[DELEGATION] The `Agent`/Task tool is ASYNCHRONOUS, and so is a backgrounded command.** …
> **With everything you can do done and a helper still out, end your turn on a plain message and no tool call.** The notification brings you back. …
> If your prompt tells you to delegate isolated work, decide EARLY.

Nothing later in the spiritmender prompt tells the session to delegate anything, and the session
spawned zero sub-agents — that part is correct behaviour. The damage comes from the rule's second
clause, which the session applied to a backgrounded *command* instead:

> `4.4m` — "The ward run auto-backgrounded past the timeout. I'll wait for its completion
> notification rather than polling."
> `4.4m CALL Bash(command=true description=noop)`
> `4.4m` — "Waiting for the backgrounded ward run to finish — I'll pick up when the notification
> lands rather than polling."

The session then ended its turn. But this quest runs under **Node dispatch mode**
(`.dungeonmaster.json` read at 0.8m: `"orchestrationMode": "node"`), so the session is a headless
`claude -p` child process. Ending the turn ends that process, and the backgrounded shell dies with it.
The next thing in the transcript is the proof:

> `4.6m ### INJECTED PROMPT: <task-notification> … <status>stopped</status> <summary>No completion
> record was found for this background shell command from the previous session. … or it may have
> been running when the previous Claude Code process exited.</summary>`
> `4.6m ### INJECTED PROMPT: You were CUT OFF mid-work on this item — your session was killed, not
> paused cleanly.`

`quest.json` records the result: `retryCount: 1`, `resume: true`, `startedAt: 08:38:22.618`. The
prompt's promise that "the notification brings you back" is true for a `/dumpster-launch` Task
sub-agent. It is false for a Node-dispatched headless child, where being brought back costs one of
only three orphan-recovery resets.

### 3.6 What the prompt got right

- **`[CLEAN TREE]`** was obeyed exactly: `git status` at 23.2m, `git add` of exactly the three
  changed paths, one commit, `git status` again at 23.4m to confirm clean, then `signal-back`.
- The `## Scope` rule says: *"Fix wherever the fix actually lives. If clearing an error means touching
  a file the blob does not name, touch it."* That rule is what produced the shared-package fix
  described in §4.
- **`Do NOT: 1. Weaken a test to make it pass … 3. Delete code to avoid an error.`** The commit
  touches **zero test files** — `git show --stat e0ffce3b2` lists 3 files, all production or contract
  code. The commit message says the messages were preserved on purpose: *"Preserved the exact
  ZodIssueCode.invalid_string / custom shapes and messages so no downstream test assertion needed to
  change."*
- **`[GIT FORMS]`** — no `git -C`, no chained git, one git command per Bash call throughout.

---

## 4. What went well

1. **The scope-widening clause paid for itself.** At 19.1m (context-in 201,901) the session said:
   *"Let me check whether the shared package's `pastedImageUploadContract` has the same
   regex-over-huge-string pattern, since `dataUrlSplitTransformer` also parses through it."* That
   check turned out to be necessary, not just cautious. `pastedImageDraftContract` — the blob's
   *first* failure — declares `dataBase64: pastedImageUploadContract.shape.dataBase64`, so the shared
   contract **is** the root cause of failure #1. The session found this without ever reading the blob
   that named that failure. It got there through the `## Scope` clause quoted above, plus three
   `discover` sweeps (`pastedImageUploadContract|base64ImageDataContract`,
   `pastedImageUploadListContract`, `maxBytesPerImage`) costing about 2.0 min and about 19k output
   tokens across buckets `08:53-08:55` and `08:55-08:57`.

2. **The session refused to accept its own first green.** At 10.4m it tried the cheap fix — dropping
   the `u` flag — and the single-file scoped run at 10.6m went green. Instead of committing there, it
   ran the wider 13-file batch at 10.9m, which came back red on both lint *and* seven unit tests. It
   then said, at 12.6m: *"Let me build a more rigorous repro to nail down exactly what triggers the
   overflow, so the fix is principled rather than guessed."* That 3.4-minute diagnostic (phase 9,
   23,429 + 26,567 output tokens across buckets `08:45-08:47` and `08:47-08:49`) is what turned a flag
   tweak into bounded chunking. The commit message records the reasoning verbatim: *"a bare `u`-flag
   drop 'fixed' it in isolation but still crashed once other files in the batch ran first, so this is
   bounded regex chunking rather than a flag tweak."*

3. **The session made the right call next to `blocked`.** Facing a hard sandbox refusal on the one
   artifact its prompt is built around, it did not signal `blocked` (which would have halted the quest
   for a human), and it did not signal `partial` (which would have spent one of three attempts on a
   successor guaranteed to hit the same wall). Instead it found another route, following the `[WALL]`
   rule's *"A denied command is a wall only if the JOB has no other route."*

4. **The commit message is a genuine handoff.** It names the wardResult id, both crashing files, the
   size of the string (`~7M characters`), the fact that it reproduced under jest+jsdom and not plain
   node, the disproved first hypothesis, and an explicit fifteen-file verification list. Cost: one
   `git commit` call at 23.4m.

5. **Ward [12]'s green run confirms the repair at the same batch depth that found the bug.** Blob
   `4e51f7ae-…` lists both `data-url-split-transformer.test.ts` and
   `pasted-image-draft-contract.test.ts` in `passingTests` for `@dungeonmaster/web`, under **both**
   `unit` and `integration`, at `filesCount` 120 and 128 respectively. Those are the same wide batches
   that cost 2.7 minutes of ward-run when they crashed earlier.

---

## 5. What agents did that they should not have

### Finding 1 — The prompt handed the session a placeholder instead of a path, and the session spent 1.7 min proving it

**What happened.** The rendered Operation Context read
`Ward detail blob: <questFolder>/ward-results/229c5454-….json`. `<questFolder>` is not a real folder
— it is the literal placeholder text, rendered as-is. The session did not know that yet, so it
guessed. It tried `<repoRoot>/.dungeonmaster/quests/<questId>/…` first, which is not even the real
layout — the real path carries an extra `guilds/<guildId>/` segment. It then tried
`~/.dungeonmaster/quests/`, then `<worktree>/.dungeonmaster-quests/`, then read `.dungeonmaster.json`,
then ran `env | grep -i dungeon`. All ten calls came back refused or empty.

**Citation.** Timeline `0.3m` then `1.7m`; errors at `0.4m`, `0.5m` (2 times), `0.7m` (2 times), `0.9m` (2 times),
`1.0m`, `1.3m`.

**Cost.** 1.7 minutes. Bucket `08:33-08:35` totals 14,760 output tokens, 2,098,765 context-in, and 21
tool calls — most of that bucket is this one search.

**Prompt disposition.** The prompt's own step, `### 1. Read the Ward Failure`, **required** this and
made it impossible at the same time. This is a defect in the renderer that built the prompt, not a
mistake by the session.

### Finding 2 — Two whole-repo `--changed` ward runs, where the rule says scoped and once

**What happened.** The session ran `npm run ward -- --changed 2>&1 | tail -300` at 2.2m, then ran
`npm run ward -- --changed` again at 5.1m.

**Citation.** Extracted tool inputs: `2.2m BASH timeout=600000 :: npm run ward -- --changed 2>&1 | tail -300`
and `5.1m BASH timeout=600000 :: npm run ward -- --changed`.

**Cost.** 2.2 min + 2.5 min = **4.7 min**, 20% of the session.

**Prompt disposition.** **Forbidden in spirit, unreachable in practice.** The `[WARD]` rule says
*"Run ward scoped … Never run the bare whole-repo `npm run ward`"* and *"pick one mode, run it
once"*. Step 2 says to scope the run to *"the failing files the blob names"*. But there was no blob,
so there were no file names to scope to. The first run also **piped its output into `tail -300`**,
which discards the exit code — the same trap the `<dungeonmaster-wardDiscipline>` snippet flags for
`npm run build`. The second run was unpiped. That is why it produced a usable `runId` for
`ward -- detail`.

### Finding 3 — Ending the turn on a backgrounded command killed the process and cost an orphan-recovery reset

**What happened.** At 4.3m the session issued `Bash(command=true, description=noop)`, a no-op tool
call. It followed that with a plain message, then ended its turn to wait for a notification. In Node
dispatch mode, ending the turn killed the child process, and the in-flight ward run died with it.
Orphan recovery flipped the item back to `pending` and re-dispatched it with `claude --resume` at
08:38:22.618.

**Citation.** `4.3m BASH timeout=None :: true`; `4.4m "Waiting for the backgrounded ward run to
finish — I'll pick up when the notification lands rather than polling."`; `4.6m` task-notification
`<status>stopped</status>`; `quest.json` `27667fc2` then `4c5e9e8a`: `"retryCount": 1, "resume": true`.

**Cost.** The 2.2-min ward run was destroyed and had to be repeated, costing 2.5 min. Add 0.7 min to
re-establish state after the cut-off (phase 5), plus one of only three `orphanRecovery.maxResets`
spent. **roughly 5.4 min total.**

**Prompt disposition.** **The `[DELEGATION]` rule required this:** *"With everything you can do done
and a helper still out, end your turn on a plain message and no tool call. The notification brings
you back."* The session did exactly what it was told, and was punished for it. The `Bash(true)`
no-op is the one part the prompt explicitly rules out — *"and no tool call"* — a trivial extra call,
but it shows how easy the rule is to half-follow.

To its credit, the session did **not** commit any of the classic ward-discipline violations. It did
not `sleep`. It did not `tail` a ward output file while the run was live. It did not re-run the check
just to see whether the first attempt had finished. Its one read of the dead run's output file, at
4.8m, was a direct response to the task-notification's own instruction — *"Check the output file for
partial results before assuming it completed."* — and it came after the run was already dead.

### Finding 4 — Zero sub-agents, in a 23.6-minute session with 2.8 min of pure investigation

**What happened.** The session delegated nothing. Phases 7 and 9 (6.2 min combined) are
self-contained, read-only investigation, built around one clean question: *does this regex shape
overflow under jest+jsdom, and which variant does not?* That is exactly the kind of question a
briefed helper can answer in parallel while the parent session reads consumers.

**Citation.** `subagents b1461af5-…` then `no subagents dir`; the tool histogram shows no `Agent`/`Task`
calls among the 89 tool calls.

**Cost.** Not a loss on this run — the investigation was serial, and the fix depended on its result.
But the prompt still carries eight lines of `[DELEGATION]` machinery that it never activates, and the
session pays the token cost of carrying that text on all 176 of its API calls.

**Prompt disposition.** **The prompt permits this, and arguably invites it.** The spiritmender prompt
has no delegation step, and `[DELEGATION]` only applies conditionally — *"If your prompt tells you to
delegate…"*. The finding is about the prompt carrying a rule with nothing for it to attach to, not
about anything the session did wrong.

### Finding 5 — A scratch test file written into `packages/web/src/`

**What happened.** The session made four `Write` calls to
`packages/web/src/contracts/image-data-url/zzz-repro.test.ts`, at 13.4m, 13.7m, 13.9m, and 14.2m. It
ran a ward check over that file at 14.3m (93 s), then deleted it with `rm` at 18.1m. A companion
scratch file went to the correct place instead — `tmp/regex-repro.js`, written at 12.7m.

**Citation.** Extracted tool inputs at 13.4m–14.3m and `18.1m BASH :: rm …/zzz-repro.test.ts …`.

**Cost.** About 1.6 min of the 3.4-min diagnostic phase. The residual cost is zero: `git status` at
23.2m was clean, and the file is absent from commit `e0ffce3b2`.

**Prompt disposition.** **The prompt says nothing about this at all.** The repo's `CLAUDE.md` says
scratch files go in `<repoRoot>/tmp`, but the spiritmender prompt never mentions scratch files. The
choice was deliberate: the file had to sit inside the jest `roots` to run under the real jsdom
environment, and `tmp/` sits outside `packages/web/src`. The session cleaned the file up afterward.
This is a gap in the prompt, not misconduct.

### Finding 6 — The ward blob and the spiritmender's own run disagree about which files and which check type failed, and neither is wrong

**What happened.** Three separate runs produced three different views of the same defect:

| Source | Check type | Failing files |
|---|---|---|
| Blob `229c5454-…` (ward [10]) | **integration**, `@dungeonmaster/web`, 128 files | `pasted-image-draft-contract.test.ts`, `data-url-split-transformer.test.ts` |
| Spiritmender `--changed` at 5.1m | **unit** | `data-url-split-transformer.test.ts`, `pasted-image-downscale-broker.test.ts` |
| Spiritmender scoped 13-file run at 10.9m | **unit**, 29 files | `data-url-split-transformer.test.ts` (1) + `pasted-image-downscale-broker.test.ts` (6) |

**Citation.** Blob `checks[3]` = `{"checkType": "integration", "status": "fail"}`, with
`@dungeonmaster/web` `filesCount: 128` and two `testFailures`. The commit message says
*"data-url-split-transformer.test.ts and pasted-image-downscale-broker.test.ts (unit, changed
mode)"*. The 11.6m ward result reads:

```
--- lint ---
packages/web/src/contracts/image-data-url/image-data-url-contract.ts
  require-unicode-regexp Use the 'u' flag. (line 20)

--- unit ---
packages/web/src/transformers/data-url-split/data-url-split-transformer.test.ts
  FAIL "dataUrlSplitTransformer byte ceiling INVALID: {payload decoding over maxBytesPerImage} => throws"
    RangeError: Maximum call stack size exceeded
packages/web/src/brokers/pasted-image/downscale/pasted-image-downscale-broker.test.ts
  FAIL "pastedImageDownscaleBroker caps the longest edge on the first re-encode VALID: {widthPx: 6000, heightPx: 4000, over the byte ceiling} => …"
    RangeError: Maximum call stack size exceeded
  … (5 more)
```

**Why this happens.** `RangeError: Maximum call stack size exceeded` depends on stack depth, so
*which* file in a jest worker's batch trips the error first changes with the batch's composition and
order. On top of that, the same plain `*.test.ts` files run under **both** ward check types for
`@dungeonmaster/web`. `packages/web/jest.config.cjs` has one shared `testMatch`
(`['**/src/**/*.test.[jt]s?(x)', '<rootDir>/test/**/*.test.[jt]s?(x)']`), and the green blob
`4e51f7ae-…` lists `pasted-image-draft-contract.test.ts` in `passingTests` under both `unit`
(120 files) and `integration` (128 files).

**Cost.** Directly: the prompt confidently states *"There is nothing here to guess: the blob names
one check type per failure"*. Following that literally would have sent a blob-reading session to
`--only integration`, the wrong check. Indirectly: this same nondeterminism is why three earlier
verification gates missed the defect entirely — see §5 findings 7 and 8.

**Prompt disposition.** The prompt asserts a determinism that the ward output does not actually have.

### Finding 7 — The codeweaver-reviewer that authored the failing tests graded **6 of the 99 files** it then committed

This finding answers the question "why did the codeweavers' own verification let these through". It
is a structural hole in the process, not a one-off mistake.

**What happened.** One single commit introduced both failing test files and the contract that caused
them to fail:

```
$ git log --oneline --diff-filter=A -- packages/web/src/contracts/pasted-image-draft/pasted-image-draft-contract.test.ts
061e49064 codeweaver-reviewer: web's half of paste-image-into-composer — contenteditable composer, downscale ladder, IndexedDB drafts
$ git log --oneline --diff-filter=A -- packages/web/src/transformers/data-url-split/data-url-split-transformer.test.ts
061e49064 …
$ git log --oneline --diff-filter=A -- packages/web/src/contracts/image-data-url/image-data-url-contract.ts
061e49064 …
```

`061e49064` is **work item [7]** — `codeweaver`, `package: web · flow: paste-image-into-composer` (a
flow is the named feature thread a quest's work items are building toward), session
`d1b89f89-6f71-40c8-aaf3-094dedb15b8d`, window `2026-09-02T00:05:20 → 03:45:15`. The shared half,
`pasted-image-upload-contract.ts`, came from a different commit, `bebca45c3` = work item **[2]**,
`codeweaver · shared · send-message-with-images`.

That one commit touched **99 files: 6 modified, 93 added.**

```
$ git show --name-only --diff-filter=M --format= 061e49064
packages/web/src/widgets/chat-input/chat-input-widget.proxy.tsx
packages/web/src/widgets/chat-input/chat-input-widget.test.tsx
packages/web/src/widgets/chat-input/chat-input-widget.tsx
packages/web/src/widgets/chat-panel/chat-panel-widget.proxy.tsx
packages/web/src/widgets/chat-panel/chat-panel-widget.test.tsx
packages/web/src/widgets/chat-panel/chat-panel-widget.tsx
$ git show --name-only --diff-filter=A --format= 061e49064 | wc -l
93
```

The commit's own `codeweaver-reviewer` — a sub-agent, `agent-ac365463e43217efe`, "Review web
paste-image-into-composer" — ran its `[BUILD]` gate (a check that must pass before the pass can
proceed) at 8.0m of its own run, using ward's `--staged` flag, which scopes the check to files git
shows as staged with `git add` but not yet pushed. It got:

```
> dungeonmaster-ward --staged

lint        @dungeonmaster/web   PASS  6 files, 6 discovered (7.2s)
typecheck   @dungeonmaster/web   PASS  1200 files, 1200 discovered (7.5s)
unit        @dungeonmaster/web   PASS  10 files, 389 discovered (27.3s)
integration @dungeonmaster/web   PASS  16 files, 8 discovered (40.1s)
e2e         @dungeonmaster/web   skip (0.0s)
run: 1788320520089-3af5  (82.3s)
```

**`lint PASS 6 files` is exactly the 6 files that were already tracked and modified.** None of the 93
brand-new files was in scope. The reason is the order the reviewer worked in: it ran ward at 8.0m and
only staged its files afterward, at 10.4m:

```
  0.3m :: git status
  ...
  7.5m :: npm run build
  8.0m :: npm run ward -- --staged
 10.4m :: git status --porcelain=v1
 10.4m :: git add -A && git status --porcelain=v1 | head -5
 10.7m :: git commit -m "$(cat <<'EOF' codeweaver-reviewer: web's half of paste-image-into-composer …
 10.7m :: git push
```

Ward's own implementation explains why that ordering matters.
`packages/ward/src/brokers/git/diff-unpushed/git-diff-unpushed-broker.ts` resolves `--staged` as:

```ts
const diffResult = await childProcessSpawnCaptureAdapter({
  ...
  args: ['diff', '--name-only', '--diff-filter=d', mergeBase],
```

`git diff --name-only` **never lists an untracked file** — a file git has never seen, meaning it was
never staged and never committed. So a reviewer that runs its gate before `git add -A` — which is the
order its own prompt prescribes, step 6 build-and-ward before step 7 commit-and-push — grades only the
files that already existed before this pass. The repo already knows this trap elsewhere: the
`signal-back` commit gate uses `gitWorkingTreeFilesBroker`, which explicitly *"unions
`git diff HEAD --name-only` with `git ls-files --others --exclude-standard`"*, precisely because *"a
bare diff reports TRACKED paths only"*. Ward's `--staged` path has no such union.

**What in the codeweaver prompt should have caught it.** The reviewer's prompt
(`codeweaver-reviewer-statics.ts`) has the right instinct, but the wrong tripwire:

> **A ward reporting that the file scope resolved to 0 source files is EMPTY, not green.** Nothing was
> staged for it to grade. Report it as `WARD: empty — 0 files`, never as green.

That guard only fires when the scope is exactly zero. Here the scope was 6, not 0, so it read as an
ordinary green pass. The prompt also makes a claim about what that run proves:

> Your `--staged` ward is what typechecks every package this pass touched.

That claim was false for this pass. `typecheck PASS 1200 files` runs `tsc -b` over the whole package,
which does cover the new files. But `lint`, `unit`, and `integration` were scoped to only 6, 10, and
16 files respectively.

**Cost.** Three codeweaver passes — [7], [8], and [9] — and their reviewers ran between the defect
landing and ward [10] finding it: from 00:05:20 to 08:28:53, **8 h 23 min** of quest wall-clock. The
repair cycle that followed then cost another 31.3 min.

### Finding 8 — The code-writing sub-agent's own ward gate was green, honestly, and could not have caught this

**What happened.** The sub-agent that wrote `data-url-split-transformer.test.ts`
(`agent-a6beb9a367f91ce74`, "Build data-url split and build transformers") ran the gate its brief
prescribed, and it passed:

```
  5.1m :: npm run ward -- --only lint,unit -- packages/web/src/transformers/data-url-split packages/web/src/transformers/data-url-build
  5.4m RESULT: lint  @dungeonmaster/web PASS  6 files, 6 discovered (7.7s)
                unit  @dungeonmaster/web PASS  2 files, 373 discovered (6.0s)
                run: 1788309270531-1ed1  (13.9s)
```

`ward -- detail 1788309270531-1ed1` confirms **13 tests, all passing** — including the byte-ceiling
test that later crashed. In a 2-file batch, the stack never gets deep enough to overflow.

**Prompt disposition.** The codeweaver prompt's brief template *requires* exactly this run and no
more:

```
PROVE
  npm run ward -- --only lint,test -- <this brief's own paths>
  no npm run build · no run-ward MCP tool · no commit · never widen the ward
```

> - **`--only lint,test` keeps typecheck out, and typecheck is the one that builds.** Ward runs it as
>   `tsc -b`, which writes the shared `dist/`, so a wave of sub-agents running it at once hands each
>   other type errors on correct code. Your reviewer's `--staged` run is the typecheck.

The rule `never widen the ward` matters for concurrency, and it is correct. But it has a consequence:
**no session on a codeweaver pass ever runs the new tests in a wide batch.** The reviewer's `--staged`
run was supposed to be that wide batch, and finding 7 shows it was not. The first wide batch in this
quest's entire history was `run-ward --changed` at work item [10] — and it found the defect on its
first try. The gate chain is working exactly as designed. It simply has a hole at the one place a
stack-depth-dependent failure can hide.

(The sub-agent also passed **directory** paths — `packages/web/src/transformers/data-url-split` —
where its brief says `<this brief's own paths>`, and the wardDiscipline snippet says *"Prefer explicit
FILE paths"*. That did not matter here. Noted for completeness.)

**One more thing the reviewer prompt should ask, and does not.** Nothing in
`codeweaver-reviewer-statics.ts` or `standardsReviewConcernsStatics` asks whether a test fixture is
*pathologically sized*. The fixture that caused all of this is, verbatim from
`pasted-image-downscale-broker.test.ts` at `e0ffce3b2^`:

```ts
const overCeilingBase64 = 'A'.repeat(
  Math.ceil(((pastedImageStatics.maxBytesPerImage + 1) * 4) / 3),
);
const dataUrl = ImageDataUrlStub({ value: `data:image/png;base64,${overCeilingBase64}` });
```

That is a **6,990,508-character** string, handed to a branded zod contract, in five separate test
files. Every one of those tests reads as a perfectly ordinary boundary test.

### Finding 9 — Ward discipline across the two command runs: nothing to report

Work items [10] and [12] are `spawnerType: "command"` — MCP `run-ward` invocations with no session and
no agent behind them. There is no sleep-polling, no output-file tailing, no re-run, and no `cd` to
find, because there is no agent present to commit any of those mistakes. Both ran with `attempt: 0`,
`maxAttempts: 1`, `retryCount: 0` — each ran exactly once. Dispatch latency was 11.5 s and 3.7 s. The
only notable difference is duration: 4 min 49 s for the red run versus 2 min 38 s for the green one,
over the same `changed` file set plus three files. That gap is consistent with a jest worker that
dies on a stack overflow running slower than one that simply finishes.

**Across the whole cycle, the classic ward-discipline violations did not occur.** No `sleep` sat
beside any ward run. No `tail` watched a live ward output file — the one output-file read, at 4.8m,
was of a *dead* run, done at the task-notification's own instruction. No `cd` moved into a package;
every ward invocation ran from the worktree root. `npm run build` ran first, at 1.8m. The two
violations that *did* happen are the two scoped-vs-whole-repo runs from finding 2, and the piping of
the first one into `tail -300`.

---

## 6. Suggested fixes

Ranked by minutes-or-tokens saved per quest.

### Fix 1 — Make the codeweaver-reviewer's ward gate see untracked files (addresses finding 7)

**This is the biggest saving in this report.** There are two options, and the first is better because
it fixes every caller.

**File:** `packages/ward/src/brokers/git/diff-unpushed/git-diff-unpushed-broker.ts`
**Edit:** Union the diff with untracked paths, exactly the way `gitWorkingTreeFilesBroker` already
does it. After the existing `git diff --name-only --diff-filter=d <mergeBase>` spawn, add a second
`childProcessSpawnCaptureAdapter({ args: ['ls-files', '--others', '--exclude-standard'] })` call and
concatenate its output before `parseDiffOutputTransformer`. Make the same change for the `--changed`
path in `git-diff-files-broker.ts`.

**File (belt and braces):** `packages/orchestrator/src/statics/codeweaver-reviewer/codeweaver-reviewer-statics.ts`, step 6.
**Edit:** Move `git add -A` to before the build/ward pair. Or, at minimum, add a sentence: *"Run
`git add -A` BEFORE the pair. `--staged` resolves through `git diff`, which lists no untracked file,
so a pass whose files are all new grades as 6 files out of 99 and reads green."*

**Estimated saving:** this defect cost **8 h 23 min of latency plus 31.3 min of repair cycle** on this
quest alone. It applies to every codeweaver, flowrider, and siegemaster pass in every quest — which is
where most new files are born. Conservatively, that is **one spiritmender cycle (about 30 min) per
quest**, plus the compounding risk of a defect surviving all the way to the `full` ward gate.

### Fix 2 — Render a real, reachable path for the ward detail blob (addresses findings 1 and 2)

**File:** `packages/orchestrator/src/transformers/work-item-to-prompt/work-item-to-prompt-transformer.ts:171`
**Edit:** Replace the literal with the resolved absolute path. The broker already resolves the quest
cwd (`questCwdResolveBroker`) and the quest folder for `startRef`. Pass the quest folder in and emit
`Ward detail blob: ${questFolder}/ward-results/${id}.json` instead. Update the two assertions at
`work-item-to-prompt-transformer.test.ts:742` and `:800` to match the resolved shape.

**Follow-on, and the harder half:** even the resolved path is still **outside the worktree sandbox**
in dogfood mode — it points to `<repoRoot>/.dungeonmaster/guilds/…`, while the session is confined to
`<repoRoot>/worktrees/<slug>/`. There are two routes past that:
 (a) copy the blob into the worktree, at `<worktree>/.quest-plans/ward-results/<id>.json`, when the
     spiritmender item is spliced, and name *that* path in the prompt; or
 (b) serve the failures through MCP instead — a `get-ward-detail({ questId, wardResultId })` tool, so
     no filesystem grant is needed at all. This second option is the cleaner one. It also removes the
     1.9 MB blob's size problem, since the tool can return just the `testFailures` entries.

**Estimated saving:** 1.7 min of hunting, **plus** the 4.7 min of whole-repo `--changed` runs that
only happened because there was nothing to scope to. That totals **about 6.4 min and about 35k output
tokens per spiritmender dispatch**.

### Fix 3 — Tell the spiritmender what to do when the blob is unreachable (addresses findings 1, 2)

**File:** `packages/orchestrator/src/statics/spiritmender-prompt/spiritmender-prompt-statics.ts`, `### 2. Reproduce the Failures Yourself`
**Edit:** Add a fallback paragraph:

> **If the blob will not open, do NOT reach for `--changed` or `--staged`.** Get the file list from
> git instead — `git diff <main-or-master>...HEAD --name-only` — and run
> `npm run ward -- --only lint,typecheck,unit -- <those files>`. A whole-repo mode costs minutes and
> tells you what a scoped run over the same files tells you. Then say in your commit message that the
> blob was unreadable, so the next session does not repeat the search.

**Estimated saving:** about 3-4 min per dispatch whenever fix 2 is not yet in place. This is also the
correct behaviour even after fix 2 lands, since a blob can still be truncated or stale.

### Fix 4 — Correct `[DELEGATION]`'s wait advice for headless dispatch (addresses finding 3)

**File:** `packages/orchestrator/src/statics/spiritmender-prompt/spiritmender-prompt-statics.ts`,
`[DELEGATION]` (and the identical clause wherever it is shared).
**Edit:** Make two changes. First, since this prompt never asks the session to delegate, cut the
`Agent`/Task half entirely and keep only the backgrounded-command half. Second, replace *"end your
turn on a plain message and no tool call. The notification brings you back"* with mode-aware wording:

> **A command the harness backgrounds is NOT safe to end your turn on.** In a dispatched session the
> process ends with your turn and the command dies with it, costing an orphan-recovery reset. Keep
> the turn alive with real work you can do meanwhile. If there is nothing, the command was too wide —
> re-scope it so it finishes in the foreground.

**Estimated saving:** the killed run, the recovery, and the re-run cost **about 5.4 min and one of
three `orphanRecovery.maxResets`** here. Removing the dead `Agent`/Task paragraphs also trims about
600 characters that ride along on all 176 API calls of every spiritmender session.

### Fix 5 — Stop the prompt promising the blob names one check type (addresses finding 6)

**File:** `packages/orchestrator/src/statics/spiritmender-prompt/spiritmender-prompt-statics.ts`, `### 2.`
**Edit:** replace *"There is nothing here to guess: the blob names one check type per failure"* with:

> The blob records a check type per failure, but the same file can be graded by more than one check —
> in this repo a plain `*.test.ts` under a browser package runs under BOTH `unit` and `integration`.
> When a failing file has no `.integration.` in its name, pass `lint,typecheck,unit` and add
> `integration` only if the blob's red entry names a `*.integration.test.ts`.

**Estimated saving:** small in minutes — about 1 min of a mis-scoped run. But it removes a
confidently-stated falsehood, and a blob-reading session, which is what fix 2 creates, would hit that
falsehood every time.

### Fix 6 — Add a "fixture size" question to the reviewer's reading pass (addresses finding 8)

**File:** `packages/orchestrator/src/statics/codeweaver-reviewer/codeweaver-reviewer-statics.ts`
(reviewer-specific, not the shared `standardsReviewConcernsStatics` — this is a codeweaver question
about unit tests, and the shared block is contracted to three readers).
**Edit:** add one bullet to the reading questions:

> **A fixture built by arithmetic on a statics ceiling is a real allocation.** `'A'.repeat(ceiling)`
> at a 5 MB ceiling is a 7-million-character string, and every contract, regex and transformer on its
> path runs against it for real. Where a test builds one, check that the code under it stays bounded —
> a single `regex.test()`/`.replace()` over the whole value overflows V8's stack under jsdom, and
> the crash surfaces in whichever file in the batch happens to be deepest.

**Estimated saving:** this fix saves the defect class, not minutes. It is the one question that would
have caught this bug at authoring time, and right now no prompt in the tree asks it.

### Fix 7 — Raise the reviewer's empty-scope tripwire above zero (addresses finding 7)

**File:** `packages/orchestrator/src/statics/codeweaver-reviewer/codeweaver-reviewer-statics.ts`, step 6.
**Edit:** Extend the existing rule from a `0 files` check to a *proportion* check:

> **Compare the ward's file count against `git status --porcelain=v1`.** A pass that touched 99 paths
> and a ward that graded 6 is not a green — it is a scope that missed the pass. Report it as
> `WARD: scope mismatch — graded N of M paths` and re-run with the paths named explicitly.

**Estimated saving:** this is a cheap, independent backstop for fix 1. It catches the same class of
bug if the ward change ever regresses, and it is effectively free — the reviewer already runs the
`git status` it needs at step 3.

### Fix 8 — Give the spiritmender a scratch-file rule (addresses finding 5)

**File:** `packages/orchestrator/src/statics/spiritmender-prompt/spiritmender-prompt-statics.ts`,
`## Scope` then `Do NOT:` list, as item 5.
**Edit:**

> 5. Leave a diagnostic file behind. A repro you need jest to run has to sit inside the package's
>    test roots — name it so nothing collects it as part of the suite, and delete it before you
>    commit. `git status` before `git add`, always.

**Estimated saving:** near zero minutes on this run, since the file was already cleaned up. But the
failure mode this guards against — a `zzz-repro.test.ts` surviving into a commit — would cost a
whole extra ward cycle.

---

## 7. Raw figures appendix

### `python3 tmp/transcript-digest.py summary b1461af5-4c03-4275-ab03-cc6f384e1745`

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/b1461af5-4c03-4275-ab03-cc6f384e1745.jsonl
LINES     563
START     2026-09-02T08:33:54.362000+00:00
END       2026-09-02T08:57:31.963000+00:00
WALL      0:23:37.601000  (23.6 min)
TYPES     {'queue-operation': 6, 'attachment': 203, 'user': 92, 'last-prompt': 32, 'atis-latch': 30, 'assistant': 176, 'mode': 24}
MODELS    {'claude-sonnet-5': 176}

TOKENS (this transcript only, excludes subagents)
  assistant API responses : 176
  input (uncached)        : 352
  cache_read              : 23,700,197
  cache_creation          : 499,089
  output                  : 168,964
  of which thinking       : 119,947
  TOTAL context-in        : 24,199,638

TOOL CALLS (89 total)
     44  Bash
     18  Read
      7  mcp__dungeonmaster__discover
      7  Write
      5  ToolSearch
      4  Edit
      1  mcp__dungeonmaster__get-agent-prompt
      1  mcp__dungeonmaster__get-syntax-rules
      1  mcp__dungeonmaster__get-architecture
      1  mcp__dungeonmaster__signal-back

TOOL RESULT BYTES fed back: 273,858
```

### `python3 tmp/transcript-digest.py subagents b1461af5-4c03-4275-ab03-cc6f384e1745`

```
no subagents dir
```

### Ward blob `229c5454-3b1c-4f04-aa67-97350a357b20` (work item [10], `exitCode 1`, `runId 1788337745350-9780`)

```
==== lint pass
    @dungeonmaster/eslint-plugin pass files= 3 disc= 3 errs= 0 fails= 0
    @dungeonmaster/orchestrator pass files= 33 disc= 33 errs= 0 fails= 0
    @dungeonmaster/server pass files= 54 disc= 54 errs= 0 fails= 0
    @dungeonmaster/shared pass files= 17 disc= 17 errs= 0 fails= 0
    @dungeonmaster/testing pass files= 1 disc= 1 errs= 0 fails= 0
    @dungeonmaster/web pass files= 159 disc= 159 errs= 0 fails= 0
==== typecheck pass    (13 packages, 7404 files, all pass)
==== unit pass
    @dungeonmaster/web pass files= 120 disc= 401 errs= 0 fails= 0   (5 other packages pass)
==== integration fail
    @dungeonmaster/eslint-plugin pass files= 6 disc= 7 errs= 0 fails= 0
    @dungeonmaster/orchestrator pass files= 48 disc= 36 errs= 0 fails= 0
    @dungeonmaster/server pass files= 33 disc= 15 errs= 0 fails= 0
    @dungeonmaster/shared pass files= 43 disc= 1 errs= 0 fails= 0
    @dungeonmaster/testing pass files= 1 disc= 5 errs= 0 fails= 0
    @dungeonmaster/web fail files= 128 disc= 8 errs= 0 fails= 2
==== e2e skip   (all packages)
```

The two `testFailures`, verbatim from the blob:

```
suitePath: …/packages/web/src/contracts/pasted-image-draft/pasted-image-draft-contract.test.ts
testName: pastedImageDraftContract invalid inputs INVALID: {dataBase64 decoding over the byte ceiling} => throws for oversized payload
message:  Error: expect(received).toThrow(expected)

          Expected substring: "Decoded image exceeds 5242880 bytes"
          Received message:   "Maximum call stack size exceeded"

                 7 |   ...props
                 8 | }: StubArgument<PastedImageDraft> = {}): PastedImageDraft =>
              >  9 |   pastedImageDraftContract.parse({
                   |                            ^
                10 |     attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                11 |     mediaType: 'image/png',
                12 |     dataBase64: 'iVBORw0KGgo=',

                at ZodString._parse (../../../../node_modules/zod/v3/types.cjs:656:48)
                at ZodEffects._parse (../../../../node_modules/zod/v3/types.cjs:3275:48)
                at ZodBranded._parse (../../../../node_modules/zod/v3/types.cjs:3500:31)
                at PastedImageDraftStub (src/contracts/pasted-image-draft/pasted-image-draft.stub.ts:9:28)
                at src/contracts/pasted-image-draft/pasted-image-draft-contract.test.ts:48:40
```

```
suitePath: …/packages/web/src/transformers/data-url-split/data-url-split-transformer.test.ts
testName: dataUrlSplitTransformer byte ceiling INVALID: {payload decoding over maxBytesPerImage} => throws
message:  RangeError: Maximum call stack size exceeded
              at RegExp.test (<anonymous>)
              at ZodString._parse (…/node_modules/zod/v3/types.cjs:656:48)
              at ZodBranded._parse (…/node_modules/zod/v3/types.cjs:3500:31)
              at ImageDataUrlStub (…/packages/web/src/contracts/image-data-url/image-data-url.stub.ts:5:24)
              at Object.<anonymous> (…/packages/web/src/transformers/data-url-split/data-url-split-transformer.test.ts:46:39)
          Error: Test "dataUrlSplitTransformer byte ceiling INVALID: {payload decoding over maxBytesPerImage} => throws" has no assertions. Add expect() calls or remove the test.
              at Object.<anonymous> (…/packages/testing/src/jest.setup.js:70:11)
```

### Ward blob `4e51f7ae-1d05-4a66-8036-913fd3452b0c` (work item [12], `exitCode 0`, `runId 1788339452894-54de`)

```
==== lint pass         (6 packages)
==== typecheck pass    (13 packages, 7404 files)
==== unit pass         @dungeonmaster/web files=120 disc=401 passing=1187
==== integration pass  @dungeonmaster/web files=128 disc=8   passing=1206
==== e2e skip
```

Both previously-failing suites appear in `passingTests` under **`unit`** and again under
**`integration`** for `@dungeonmaster/web`. This is evidence for finding 6.

### The root-cause code, before and after

Before (`git show e0ffce3b2^:packages/web/src/contracts/image-data-url/image-data-url-contract.ts`):

```ts
export const imageDataUrlContract = z
  .string()
  .regex(new RegExp(`^data:(?:${MEDIA_TYPE_ALTERNATION});base64,[A-Za-z0-9+/]+={0,2}$`, 'u'))
  .brand<'ImageDataUrl'>();
```

Before (`packages/shared/src/contracts/pasted-image-upload/pasted-image-upload-contract.ts`):

```ts
const base64ImageDataContract = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9+/]+={0,2}$/u)
  .refine(
    (value) =>
      Math.floor(
        (value.replace(/[=]+$/u, '').length * BASE64_BYTES_PER_GROUP) / BASE64_CHARS_PER_GROUP,
      ) <= pastedImageStatics.maxBytesPerImage,
    { message: `Decoded image exceeds ${String(pastedImageStatics.maxBytesPerImage)} bytes` },
  )
  .brand<'Base64ImageData'>();
```

After: both replaced with a `superRefine` that walks the payload in `BASE64_CHUNK_SIZE = 65536`
chunks against `/^[A-Za-z0-9+/]*$/u`, with padding handled by `String#endsWith` instead of a
trailing-anchored regex.

### `git show --stat e0ffce3b2` (the spiritmender commit)

```
 .../pasted-image-upload-contract.ts                | 62 +++++++++++++++++++---
 .../image-data-url/image-data-url-contract.ts      | 56 ++++++++++++++++++-
 .../base64-byte-length-transformer.ts              | 20 ++++---
 3 files changed, 123 insertions(+), 15 deletions(-)
```

**Was the fix minimal? Two of three files were required. The third is prophylactic.**

| File | Required by a named failure? | Evidence |
|---|---|---|
| `packages/web/src/contracts/image-data-url/image-data-url-contract.ts` | **Yes** | Blob failure #2's stack ends at `ImageDataUrlStub → ZodBranded._parse → ZodString._parse → RegExp.test` |
| `packages/shared/src/contracts/pasted-image-upload/pasted-image-upload-contract.ts` | **Yes** | Blob failure #1 expected `"Decoded image exceeds 5242880 bytes"`, which exists only in this file, reached via `pastedImageDraftContract`'s `dataBase64: pastedImageUploadContract.shape.dataBase64` |
| `packages/web/src/transformers/base64-byte-length/base64-byte-length-transformer.ts` | **No** | Same `/[=]+$/u` shape over the same 7 MB payload, on the code path the crashing `pasted-image-downscale-broker` tests exercise — but no failure trace named it. Covered by the prompt's *"Fix wherever the fix actually lives"* |

No test file was touched. The change preserves every assertion by construction: the commit message
records that *"Preserved the exact ZodIssueCode.invalid_string / custom shapes and messages so no
downstream test assertion needed to change."* The `Do NOT weaken a test` rules were fully respected.

### Origin of each failing file (`cd <worktree> && git log --oneline --diff-filter=A -- <path>`)

```
packages/web/src/contracts/pasted-image-draft/pasted-image-draft-contract.test.ts   → 061e49064  [work item 7]
packages/web/src/transformers/data-url-split/data-url-split-transformer.test.ts     → 061e49064  [work item 7]
packages/web/src/contracts/image-data-url/image-data-url-contract.ts                → 061e49064  [work item 7]
packages/web/src/transformers/base64-byte-length/base64-byte-length-transformer.ts  → 061e49064  [work item 7]
packages/shared/src/contracts/pasted-image-upload/pasted-image-upload-contract.ts   → bebca45c3  [work item 2]
```

`061e49064` = *"codeweaver-reviewer: web's half of paste-image-into-composer — contenteditable
composer, downscale ladder, IndexedDB drafts"*, the commit made by work item **[7]**'s reviewer.
`bebca45c3` = *"codeweaver: shared's half of send-message-with-images — pasted-image statics,
media-type and upload contracts, quest images dir key"*, work item **[2]**.

### Ward invocations inside the spiritmender session (9 total, with timeouts as passed)

```
 2.2m  timeout=600000  npm run ward -- --changed 2>&1 | tail -300      (killed with the process)
 5.1m  timeout=600000  npm run ward -- --changed                        (151 s)
 7.6m  timeout=120000  npm run ward -- detail 1788338343137-60f3 <file>
10.6m  timeout=120000  npm run ward -- --only unit --onlyTests "byte ceiling" -- <1 file>
10.9m  timeout=180000  npm run ward -- --only lint,typecheck,unit -- <13 web files>   (83 s, RED)
14.3m  timeout=120000  npm run ward -- --only unit -- …/zzz-repro.test.ts             (93 s)
18.2m  timeout=180000  npm run ward -- --only lint,typecheck,unit -- <13 web files>   (52 s, green)
21.4m  timeout=300000  npm run ward -- --only lint,typecheck,unit -- <shared+web+server> (54 s)
22.6m  timeout=180000  npm run ward -- --only lint,typecheck,unit -- <server responders> (16 s)
```

Plus `npm run build 2>&1 | tail -80` at 1.8m (`timeout=300000`) and
`npm run build --workspace=@dungeonmaster/shared 2>&1 | tail -30` at 21.0m (`timeout=120000`).

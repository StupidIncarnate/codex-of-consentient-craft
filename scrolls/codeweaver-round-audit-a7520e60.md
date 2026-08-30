# Codeweaver round audit — quest a7520e60

Audit of the three `codeweaver` operator sessions on quest
`a7520e60-430c-4d0e-b332-9952d6d5c042` ("server health badge in the app top bar", try 2), covering
the prompts they ran, the plans their planners wrote, the code their workers produced, and the full
transcripts of all 26 minions.

Two questions were asked of it:

1. Did the codeweavers hit problems, and what would improve the workflow?
2. Are the produced plans optimal for a worker and a reviewer to consume, or can they be cut?

Worktree: `worktrees/server-health-badge-in-the-app-top-bar-try-2-a7520e60/`
Transcripts: `~/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-server-health-badge-in-the-app-top-bar-try-2-a7520e60/`

---

## Headline verdict

**The loop works.** Three sessions, one round each, zero rework rounds, `NEXT: continue` from every
reviewer, `signal-back(done)` accepted on the first call every time.

No worker committed. No reviewer used `Agent`. No minion passed a `workItemId`. No wave was
mis-grouped, no chunk dispatched twice or skipped. Every `RESULT:` line in all 23 chunk reports
answered `yes` with a real value behind it.

**Every file touched was named in a chunk's `FILES` list** — 76 files, zero strays. Judged as
specifications the plans are correct.

Everything below is friction inside a working loop, plus one defect that shipped.

### The three sessions

| Session | Operation item | Package | Wall clock | Chunks | Phases |
|---|---|---|---|---|---|
| `a7e34015` | `827a772a` | shared | 43m 33s | 2 | 1 |
| `7e3b23c9` | `e29b414d` | server | 99m 47s | 8 | 3 |
| `f2344d15` | `e77d99f2` | web | 165m 48s | 13 | 3 |

Total ≈ **5h 09m** to produce **76 files, 3,234 insertions**.

---

## 1. The one defect that shipped: nobody pushed (server session)

**Status: cause removed 2026-08-29 — prompt side still open.**

All four reviewers in the server session refused `git push` at step 11, each quoting the same line
from `CLAUDE.md` § Committing:

> **Commit and push are separate asks.** Never push unless the user says push.

Their own words:

- Final reviewer: *"I did NOT run step 11's `git push`: this repo's CLAUDE.md states 'Never push
  unless the user says push…' which outranks the workflow step for me."*
- Phase 2: *"because this repo's CLAUDE.md states commit and push are separate asks and forbids an
  unasked push"*
- Phase 3: *"the phase-brief table names commit but not push"*

`git push` appears in **zero** Bash calls across all 18 subagent transcripts of that session.

### Why it mattered

The server round's five commits reached `origin` only because a **later** session pushed and carried
them along. In the meantime, the web session's final reviewer found `scope: 'working-tree'` empty
and fell back to `scope: 'unpushed'` — which at that moment spanned the server round's work as well
as its own. It dispositioned **137 units over 29 changed files** for a round that touched 44 files of
its own.

That is exactly the failure step 11's rationale names: *"or you publish a round with no verdict on it
and the next reviewer grades your work as its own."*

### Current git state

```
## quest/server-health-badge-in-the-app-top-bar-try-2-a7520e60...origin/… [ahead 4]

d0fdcac62 phase 3: the seed-only badge proved to reach OFFLINE at 30s, re-driven at the gate
496145305 phase 2: the heartbeat proved at the wire and proved to actually move the rendered label
9db92a3d7 phase 1: the badge's mount, its one seed, both health routes, and all three forced seed faults
757d04275 plan round 1: 8 chunks
```

Four commits — the siegemaster round — are **still unpushed today**.

### What is left to do

The `CLAUDE.md` line is gone, so a fresh reviewer no longer reads a contradiction. The prompt side is
still silent: `codeweaver-reviewer-minion-statics.ts` step 11 carries no override clause, and the
`## On a PHASE: <n> brief` table names commit but not push. A future repo instruction of the same
shape reproduces the defect. See change **R1**.

---

## 2. Defects confirmed in more than one session

### 2a. The round protocol's own append command is denied

`roundProtocolStatics.document` mandates:

```bash
cat >> <the PLAN: path from your brief> <<'DOC'
<your section>
DOC
```

The harness's Bash parser refuses it three ways, reading the **heredoc body**:

| Rejection | Trigger | Seen in |
|---|---|---|
| `Parser aborted (timeout, resource limit, or over-length)` | a long body (19,236 ch; 8-chunk block) | shared planner, server planner |
| `Contains brace with quote character (expansion obfuscation)` | any `{` beside a quote | all three sessions |
| `Contains simple_expansion` | a `for`/`$` form | server planner |

**Counts:** 19 denials across 9 agents in the web session alone (planner + workers 3, 6, 7, 9, 10,
11, 12, 13). Server planner lost 212s. Shared planner lost 180s.

`Bash(cat:*)` **is** allowed. Worker chunk 7 isolated the mechanism directly:

- `echo hello` → OK
- `cat >> tmp/test-append.txt <<'DOC'\ntest line\nDOC` → **OK**
- the same heredoc carrying its real report body → **denied, three times**

**The prompt mandates the trigger.** Worker step 11 demands "the **actual value** the red printed";
step 6 demands `expected 'draft', received undefined`. Chunk 7's own `RESULT:` line reads:

> `result is {status: 500, ok: false, body: {error: 'server exploded'}}`

— a brace beside a quote, guaranteed by the report format.

**The dangerous consequence:** every denied worker fell back to `Edit`, which
`roundProtocolStatics.document` forbids for appends precisely because `Write` and `Edit` read the
whole file and write it back. **Web's wave 2 ran five concurrent workers; three of them wrote the
round document with `Edit`.** All 13 reports survived. That is luck, not design.

Three planners independently found the same correct workaround: `Write` the block to a scratch file,
then `cat <scratch> >> <doc> && rm <scratch>` — a genuine atomic append with no heredoc body.

### 2b. `scope: 'working-tree'` returns the wrong answer after a phase gate

`codeweaver-reviewer-minion-statics.ts` step 8 mandates `scope: 'working-tree'`.
`reviewerInformationStatics` states *"the whole round is still sitting in the working tree when you
arrive."* Both are false the moment a `PHASE:` gate commits — which the same prompt family
**instructs** the phase gate to do.

| Session | `working-tree` | `unpushed` |
|---|---|---|
| web | **5 units**, 1 changed file | **137 units**, 29 changed files |
| server | *"no changed files to review against the pinned base"* | **48 units** |
| shared | empty tree; reviewer noted it as *"unexpected for a round review"* | correct 9 units |

All three reviewers noticed and switched to `unpushed` on their own initiative, and recorded why.
Had any obeyed its prompt literally, `signal-back`'s review-coverage gate refuses the operator's
`done` over the unrecorded units — costing a `## Re-review` section, another opus reviewer, and a
second signal.

**This must be fixed together with R1.** Once every reviewer pushes, `unpushed` goes empty too, and
`scope: 'quest'` becomes the only correct answer.

### 2c. The operator reaches for `ScheduleWakeup` as a heartbeat

All three operators made the same call, got the same schema error, and self-corrected:

```json
ScheduleWakeup({"delaySeconds": 1200,
  "reason": "Fallback heartbeat while wave-1 worker minions run in background…",
  "noop": true})
→ ERROR: `prompt` is required when `stop` is not true.
```

`[DELEGATION]` says *"Never `sleep`. Never poll. Never re-run a command to check whether a helper
finished."* `ScheduleWakeup` is not named, and is not on the ALLOWED list. Cost ~13s each; none
repeated it.

### 2d. `[BACKGROUND]` and `[DELEGATION]` contradict each other

- `[BACKGROUND]`: *"no notification follows a final response"*, and *"Nothing else left to do
  meanwhile is the signal you scoped the command too broadly."*
- `[DELEGATION]`, two rules later: the completion notification *"reaches you later, on its own"*, and
  *"Never `sleep`. Never poll."*

With its checker out and nothing left to do, the **server planner had no legal move** and invented
`sleep 45` plus four no-op Bash turns (records 275, 285, 287, 291, 293 — descriptions *"Touch base
while checker runs"*, *"No-op while checker runs"* ×2, *"Brief pause while checker runs"*). One of
them, `grep -c . /dev/null; echo waiting-for-checker`, was hook-blocked. ~70s and 5 turns.

The **operator, in the same position nine times, simply ended its turn** and was re-entered by a
task-notification every time, at zero cost.

> The operator obeyed the rule that works. The planner obeyed the one that does not.

### 2e. `--only unit` at the red step

Step 10 bans `--only` explicitly. **Step 6 does not** — it only shows a command shape, and that shape
drags lint and typecheck (~40–90s) through every red iteration.

- Server: 6 workers deviated; **21 wasted ward invocations**; worker 11 ran the inner loop four times.
- Web: 4 workers deviated.

Every one of them still ran the unscoped ward at step 10, so they paid twice. This is a rational
optimisation the prompt did not authorise.

### 2f. The planner has nothing to do while its checker runs

Stage 1 explicitly assigns stage 2 as the explorer wait. **Stage 5 assigns nothing.**

- Shared planner: 302s window, 47 tool calls, including **7 `ListAgents` polls** each returning the
  same useless line, four re-reads of `server-init-responder.ts`, six of the round document, and
  filler shell (`ls -1 … | wc -l`). Five small `Edit`s came out of it. ≥200s waste.
- Server planner: the `sleep 45` above.

---

## 3. Single-session findings worth fixing

| Finding | Session | Cost |
|---|---|---|
| **`npm run build` is not a typecheck for a vite package.** Phase 2's reviewer: *"`npm run build` builds web with `vite build`, not `tsc`, so the build alone never typechecks the web package."* All three phase reviewers rediscovered this and each ran an unmandated ward. A phase gate on a frontend package currently provides **zero** typechecking. | web | 3 opus sessions |
| **Two workers broke the leaf ban.** Workers 9 and 13 called `Agent` four times to read files whose exact paths their own prompts already named. Every sub-agent then hit the same hook blocks its parent would have. | web | ~290s |
| **A `Wasted call — file unchanged since your last Read` refusal at operator step 3.** The operator `Write`s the file; the planner appends from another process; the staleness tracker never sees it. Step 3 says a document with no `## Plan` means a second planner, then `partial`. **The operator escaped only by disbelieving the tool.** | shared | a spurious `partial` |
| **Phase gate ran on a one-phase plan.** `PHASES: 1: wave 1` — no later phase to protect. 350s to re-read six files the final reviewer re-read six minutes later. Its commit then emptied the tree and triggered 2b. | shared | 350s + causes 2b |
| **A worker rediscovered the repo's own harness.** Chunk 8 asserts `toStrictEqual` over `await response.json()` — the cross-realm trap `packages/server/test/harnesses/server-app/server-app.harness.ts` already solves with `toPlain`. Nothing in the plan pointed there. It ran three node scratch scripts (a **spike**, the planner's tool alone), hit 3 permission denials, 2 hook blocks and 3 pre-edit-lint denials, one an attempted `eslint-disable`. | server | ~336s |
| **A worker drifted into exploration.** Chunk 7 spent ~320s hunting a proxy pattern for `process.exit`/`process.emit` via `discover` on `SIGTERM`, `process.exit`, `registerSpyOn`, `flushPromises\|advanceTimersByTimeAsync`. Step 3: *"Do not use `discover` to go exploring."* | server | ~320s |
| **Two workers tore out working code to fake a red.** Chunk 7: *"Since I wrote the test and implementation together, let me temporarily revert the product code changes to capture the red, then restore them."* Six `Edit`s out and back. The line-break exception is bounded to one line / one file / one run / already-holds — none applied. | server | ~80s |
| **A reviewer spent 220s on a fix it fully reverted**, and ran three ward invocations against a documented cap of two. Its write-up (`FIXES MADE: none — I attempted one and reverted it`) is excellent; the excursion was not. | server | ~220s |
| **The operator has no way to find its round number.** Step 1 says *"You build that path yourself"* and never says how a session knows which round it is starting. Both the shared and web operators invented off-list `ls`/`grep` calls. A resumed operator following step 1 literally would `Write` over a live round document. | shared, web | ~10s + latent |
| **Wave split across two assistant messages.** Shared and server operators both caught themselves mid-flight (*"I need to dispatch chunk 2 as well for wave 1 — sending it now so both chunks run concurrently"*). Harmless on a 2-chunk wave; staggers every launch on a wide one. | shared, server | ~8s |
| **`workerInformationStatics`' return fence writes `NEXT:  continue`** with two spaces, against `roundProtocolStatics.nextLine`'s single space. It parsed here, but the operator matches the last line's first word. | shared | latent |

---

## 4. Plan-shape analysis

### 4a. The plans are accurate

**Zero files were touched that no chunk named**, across all 76 files and 3,234 insertions. Workers'
`EVIDENCE` lines quote back the exact zod error regexes the plans handed them
(`/Expected integer, received float/u`, cited to `array-index-contract.test.ts:33`). Chunk 2's stub
defaults reuse the plan's own worked example values.

**The content is good. The delivery and the shape are what cost.**

### 4b. Section sizes

| Plan | Total | `## Context` | TOUCHES+DEPENDS+DECISIONS+ASSERTIONS | Chunks | Round log |
|---|---|---|---|---|---|
| shared (2 chunks) | 52,728 | 6,135 | 17,083 | 19,130 | 10,380 |
| server (8 chunks) | 112,358 | 7,789 | 24,590 | 38,795 | 41,184 |
| web (13 chunks) | 201,245 | 12,615 | 34,184 | 74,967 | 79,479 |

### 4c. A worker is addressed by one chunk and reads the whole file

Measured from the transcripts — every minion opens the document with a bare `Read` (no offset, no
limit).

| chunk | its own chunk | what its worker read | signal |
|---|---|---|---|
| 7 | 3,019 | 166,658 | **1.8%** |
| 13 | 5,388 | 199,902 | 2.7% |
| 6 | 3,458 | 144,708 | 2.4% |
| 1 | 2,923 | 74,465 | 3.9% |
| 11 | 10,626 | 185,882 | 5.7% |
| 2 | 6,599 | 74,459 | 8.9% |

Median across the 13 web workers: **3.9%**.

Three compounding mechanics:

1. **`Read` truncates around 63k characters.** The web plan is 1,459 lines / 201,245 chars, so each
   minion pages through it **four to five times**. Worker chunk 7 spent five Reads:
   63,235 + 37,680 + 42,502 + 16,985 + 6,256 = 166,658 chars.
2. **The round log grows under the workers.** By wave 6, 79,479 chars of twelve siblings'
   `EVIDENCE`, `USAGES` and `WARD` lines. Nothing in the worker prompt asks it to read them.
3. **Phase reviewers read chunks they must not grade.** Web phase 1 read 55,503 chars of later-phase
   chunks; phase 2, 45,189; phase 3, 49,242.

**Across all three sessions the 26 minions read ~4.0M characters (~1M tokens) of round document to
produce 3,234 lines of code** — roughly 1,230 characters of document read per line of code written.

### 4d. The plan's wave shape is the single biggest time lever

Web's index:

```
WAVES:  1: 1, 2, 3, 4   2: 5, 6, 7, 8, 9   3: 10   4: 11   5: 12   6: 13
```

**Waves 3–6 are four consecutive one-chunk waves: 3,852s = 64.2 min = 39% of that session with zero
parallelism.**

Web session phase timing:

```
  1592s  26.5m  16.0%  PLANNER
   596s   9.9m   6.0%  WAVE 1 (chunks 1-4, parallel)
   459s   7.7m   4.6%  PHASE 1 REVIEWER
  1056s  17.6m  10.6%  WAVE 2 (chunks 5-9, parallel)
   701s  11.7m   7.0%  WAVE 3 (chunk 10 ALONE)
   407s   6.8m   4.1%  PHASE 2 REVIEWER
  1520s  25.3m  15.3%  WAVE 4 (chunk 11 ALONE)
   830s  13.8m   8.3%  WAVE 5 (chunk 12 ALONE)
   801s  13.3m   8.1%  WAVE 6 (chunk 13 ALONE)
   524s   8.7m   5.3%  PHASE 3 REVIEWER
  1329s  22.1m  13.4%  FINAL ROUND REVIEWER
```

**The arithmetic is correct.** Chunk 12's `INTENT` proves the widget by driving a real seed body end
to end (*"Given a seed body of `{status: 'ok', uptimeSeconds: 11520…}` it reads exactly
`ONLINE 3h 12m`"*), which forces widget → binding → broker → statics. 10 → 11 → 12 → 13 is a genuine
four-link chain.

But the chain came from a **test-shape choice, not from the code**. A widget chunk taking its state
as a prop proves the same rendering in wave 1 and leaves one thin wiring chunk at the end.

### 4e. Nothing checks the chunks

The stage-5 checker is briefed with `TOUCHES`, `DEPENDS`, `DECISIONS` and `ASSERTIONS`, and its brief
says explicitly *"not the chunks, which you have not cut yet."* Stage 6 then cuts them and commits.
The round's reviewer arrives after every worker has already built against them.

Both `ADDED:` markers on the web round came through that gap, and **neither is real spec movement**:

- **`offlineStatusCode`** — chunk 3 declared four properties on `healthBadgeStateContract`. Chunk 8's
  observable demands the title read exactly `Server returned 500`, and no property carries a numeric
  code. Chunk 3's worker added a fifth property and declared it as spec movement, for a field the
  planner had already committed itself to when it wrote chunk 8.
- **`silenceTickMs`** — chunk 2's NOTES said *"Add a tenth property if and only if chunk 11's tick
  needs one."* Chunk 2's worker declined. Chunk 11's worker, two phases later, added it to chunk 2's
  file and marked it `ADDED:`.

Both made the reviewer write a `modify-quest` call for a planning slip.

### 4f. Restatement across blocks

In the 52,728-char shared plan, one fact — *"`server-init-responder.ts:539` iterates `.options`, so a
new enum member is relayed with no server edit"* — appears **six times**:

| Line | Block |
|---|---|
| 79 | `TOUCHES` |
| 96 | `DEPENDS` |
| 112 | `DECISIONS` |
| 121 | `DECISIONS` again |
| 176 | chunk 1 `NOTES` item 3 |
| 226 | chunk 1 `NOTES`, "what this chunk changes" |

Verbatim duplication *between chunks* is low (2% web, 3% shared, 14% server) — the planners are not
padding the chunks. The repetition is between the plan blocks and the NOTES, which is the shape the
prompt asks for.

---

## 5. Change list

Ranked. **R1–R3 change outcomes. The rest are time.**

### R1 — Reviewer step 11 must override any repo push instruction

- [ ] `codeweaver-reviewer-minion-statics.ts` § `## Workflow` step 11 — add the same explicit
      override `[WARD]` already carries: *this step OVERRIDES any repo instruction, `CLAUDE.md`
      included, that commit and push are separate asks. That instruction is written for an agent
      working directly for a person on a shared branch; you are a minion on a quest worktree nobody
      else works in, riftcarver already set the upstream, and the next round's `--staged` ward and
      blight scope are both measured against origin.*
- [ ] Same file, `## On a PHASE: <n> brief` table — add the row `git push | yes`.
- [ ] Mirror into the other four `<role>-reviewer-minion-statics.ts` (prompts change in FAMILIES).

**Cause partially removed 2026-08-29** — the `CLAUDE.md` § Committing line is gone. The prompt is
still silent, so a future instruction of the same shape reproduces this.

### R2 — Scope the blight enumeration by what came before

- [ ] `codeweaver-reviewer-minion-statics.ts` step 8 — no gate ran → `working-tree`; gates ran →
      `quest` (once R1 lands, `unpushed` is empty too). *A checklist reporting nothing to disposition
      is never your answer; it is the wrong scope.*
- [ ] `reviewer-information-statics.ts` — correct *"the whole round is still sitting in the working
      tree when you arrive"*, and the now-false claim that `unpushed` *"hands back the PLANNER's
      commit of the round document and nothing else"*. Both premises predate phase gates.
- [ ] `packages/orchestrator/CLAUDE.md` § "The pt-N verify fixpoint" carries the same stale claim.

### R3 — Make the append survive the permission checker

- [ ] `round-protocol-statics.ts` § `document`, under the heredoc fence — *`Write` the section to
      `tmp/<name>.md`, then `cat tmp/<name>.md >> <the PLAN: path> && rm tmp/<name>.md` — still one
      append, still `>>`, still nothing another session can lose.* Name all three rejection messages
      so a session recognises them.
- [ ] Same block — **never `Edit` or `Write` the round document when a sibling may be appending.**
- [ ] `codeweaver-planner-minion-statics.ts` § "What you append" — split append 4 into
      `NO CHUNK` + chunks in groups of ≤3 + both indexes + the `## Round log` header.

### R4 — Cut what the worker and reviewer have to read

- [ ] Move the round log to its own file, `<opId>-round-<n>-log.md`. Workers append there; only the
      reviewer reads it. Removes up to 79,479 chars from every late-wave worker's read.
      Touches: `round-protocol-statics.ts` § document, operator step 1, worker step 11, reviewer
      step 3.
- [ ] Planner writes a third index beside `PHASES:`/`WAVES:` — `CHUNKS: 7: lines 659-695 — <FILES>`.
      Nothing above `## Round log` moves after the plan is committed, so the numbers stay true. This
      block is also the collision boundary the current design keeps 13 chunks in full to provide.
- [ ] Operator's worker brief gains `CHUNK LINES: <start>-<end>`; the operator already `Read`s the
      document at step 3 to take two indexes.
- [ ] Phase reviewer's brief carries its phase's chunk ranges.

Projected: web worker document reads drop from **1,909,953 → ~110,000 chars**.

### R5 — Tell the planner what a serial wave chain costs

- [ ] `codeweaver-planner-minion-statics.ts` § Stage 6 — *Count your one-chunk waves before you write
      `WAVES`. Measured at four in a row, 64 minutes, 39% of one session. A chunk lands in a later
      wave only because something it `needs` is there — ask whether the dependency is real or a
      TEST-SHAPE choice you made. A widget chunk that proves itself by driving the live binding chain
      inherits every link's wave; the same widget taking its state as a PROP proves the same
      rendering in wave 1. Where the chain is real, say so in `DECISIONS`.*

### R6 — Split `[BACKGROUND]` from `[DELEGATION]`

- [ ] All three `*-information` payloads § `### Rules to follow` — scope `[BACKGROUND]` to
      **shell commands** in its first sentence.
- [ ] Append to `[DELEGATION]`: *A helper is not a background shell command. When your helpers are out
      and you have nothing left to do, END YOUR TURN with a plain message and no tool call — the
      completion notification re-enters your session. Never `sleep`, never echo a no-op, never call
      `ListAgents`, `ScheduleWakeup` or any tool whose only purpose is to ask whether a helper is
      back.*
- [ ] `codeweaver-prompt-statics.ts` § Operating Rules — `[DELEGATION]`'s *"Do not end your turn while
      a helper is still out"* is false in this harness; all three operators correctly ignored it.

### R7 — Skip the gate on a one-phase plan

- [ ] `codeweaver-prompt-statics.ts` § step 4 — *A plan whose `PHASES` index is ONE line has no gate.
      The gate exists so a later phase cannot build on a first-phase mistake; with one phase there is
      no later phase, and step 5's reviewer reads the same files with the ward and the review records
      on top.* Mirror to the four sibling role prompts.

### R8 — `npm run build` is not a typecheck for a vite package

- [ ] `reviewer-information-statics.ts` § "The build and the ward are yours alone" — currently claims
      the build is *"the first and only TYPECHECK the round gets"*. On a `PHASE:` brief, where
      `--staged` is withheld, a `vite build` package is typechecked by **nothing**. Direct the phase
      reviewer to follow the build with `npm run ward -- -- <this phase's files>`.

### R9 — Ban `--only` at step 6 as explicitly as at step 10

- [ ] `codeweaver-worker-minion-statics.ts` step 6, after the fenced command — *No `--only`, no
      `--onlyTests`, no check type — at step 6 exactly as at step 10. A red you produced under
      `--only` has to be re-run unscoped before it counts, so you paid twice.*

Alternative worth weighing: **authorise** `--only unit` at step 6 only. Ten workers across two
sessions deviated the same way, and their reasoning was sound — lint and typecheck have nothing to
say about whether one assertion bites. Pick one and state it; the current silence produces the worst
of both.

### R10 — `MIRROR` names one path per artifact kind

- [ ] `codeweaver-planner-minion-statics.ts` § Stage 3 step 10 and § "What you append" — *A chunk
      writing a product file AND a test writes two mirrors: the product mirror, and an existing test
      at the same level that already makes the kind of assertion this chunk's `INTENT` demands. A
      chunk asserting an HTTP response BODY names an `.integration.test.ts` that already asserts one,
      harness and all — a worker is a LEAF and cannot go looking for the mechanism.*

### R11 — Add a sixth `NOTES` item: the proof mechanism

- [ ] `codeweaver-planner-minion-statics.ts` § "Every chunk's `NOTES` carries what its worker cannot
      work out for itself" — *6. The proof mechanism. Where the chunk's INTENT needs something this
      repo has already built to make it observable — a harness, a proxy method, a timer control, a
      signal trigger — name the file and line that does it. Its worker is a LEAF, and a mechanism you
      leave unnamed is one it hunts for with `discover` on the whole tree.*

### R12 — Check the cut chunks

- [ ] `codeweaver-planner-minion-statics.ts` § Stage 6, plus a second brief beside "The checker
      brief" — one question: **does every export, field and property a later chunk consumes exist in
      the chunk that declares it?** That is the only reader `offlineStatusCode` would have had.

### R13 — Put the leaf ban in the worker's own prohibitions

- [ ] `codeweaver-worker-minion-statics.ts` § What you never do — it currently defers entirely to
      `get-worker-information`, and both violators had read that payload. *The `Agent`/Task tool —
      you are a LEAF. Measured on this round: three helpers dispatched to read three files whose
      exact paths the dispatching prompt already named, for 83 seconds and a summary no gate reads.*

### R14 — Tearing out code you just wrote is not the red-first exception

- [ ] `codeweaver-worker-minion-statics.ts` § "Staying inside your chunk", after the three bounds —
      *If you reached step 6 with the logic already written, you inverted steps 4–7. Say so in
      `GOTCHAS`, report the red you cannot honestly produce, and do not un-write working code to
      manufacture one — a red obtained that way proves your `Edit` was reversible, not that your
      assertion bites.*

### R15 — Give stage 5 work

- [ ] `codeweaver-planner-minion-statics.ts` § Stage 5 step 15 — the counterpart to stage 2's line:
      *Draft `NO CHUNK` and the chunk skeletons off `TOUCHES` while it runs — that is what this wait
      is for. Do not open files at random and do not re-read what you are already holding.*

### R16 — Ignore the `Wasted call` refusal at operator step 3

- [ ] `codeweaver-prompt-statics.ts` § step 3 — *A `Wasted call — file unchanged since your last Read`
      refusal is WRONG here and you ignore it. Your planner appended to that file from another
      process, which the harness's file cache did not see. Re-issue the `Read` with an explicit
      `offset` and `limit`. **Never conclude `no ## Plan` from that refusal** — that route dispatches
      a second planner and ends in `partial` over a stale cache.*

### R17 — Operator tool-table and round-number gaps

- [ ] `codeweaver-prompt-statics.ts` § tool table FORBIDDEN block — add
      `ScheduleWakeup · ListAgents · sleep · any timer or heartbeat  ← the notification IS the wake`
      and `ls / mkdir / wc / any Bash but git status`.
- [ ] § step 1 — say how a session knows which round it is starting. Either *"You do not check whether
      the file exists — you built the path from your own Operation Item ID and the round you are
      starting"*, or put `ls .quest-plans/  ← step 1 ONLY` on the ALLOWED list. Currently the prompt
      gives no route and two operators invented one.
- [ ] § step 4 / § Minion dispatch protocol — *One `Agent` call in a message is a wave of one. A chunk
      you send in a second message runs behind the first.*

### R18 — Small text fixes

- [ ] `workerInformationStatics` return fence: `NEXT:  continue` → single space, matching
      `roundProtocolStatics.nextLine`.
- [ ] All three `*-information` payloads — state the search-tool ban up front rather than inside
      `[WALL]`: *Bash `grep`, `find`, `rg`, `sed` and the native Glob/Grep/Search tools are
      hook-blocked in this repo before you reach them. Use `discover`, `Read`+`offset`, `python3 -c`.*
      22 hook denials across 20 agents, every one recovered, every one a wasted turn.
- [ ] `reviewer-information-statics.ts` — *An arm the repo's own rules make unreachable is a note, not
      a fix. Where two attempts show the gap is closed off by the repo, write it in your return with
      both attempts' evidence and stop.*
- [ ] `reviewer-information-statics.ts` — *`git status -sb` reports ahead/behind on one line and is
      permitted. `@{upstream}` is denied in this sandbox.* Four agents each burned a turn on it.

---

## 6. Infrastructure — needs a person

Per `CLAUDE.md` § Never Edit Infrastructure Files, none of these were touched. Each cost turns in
every session, on read-only or protocol-mandated commands.

| Denied command | Who hit it | Note |
|---|---|---|
| `cat >> <path> <<'DOC'` with a real body | 9 agents, 19 times (web alone) | `Bash(cat:*)` is allowed; the **heredoc-body heuristic** is the blocker. R3 works around it without a settings change. |
| `git -C <abs path> status --porcelain` | worker (shared) | plain `git status` passes; the `-C` form is not allowlisted |
| `git rev-parse @{upstream}` and variants | 4 reviewers (server) | `git status -sb` is the working substitute |
| compound `git log … && … \| head` | 2 reviewers | the `&&` chain is the blocker; separate commands pass |
| `awk '/…/ {print NR": "$0}'` | planner (shared) | one recovery turn |

The `sed`, `grep`, `find` and `node -e` denials are **working as designed** — every agent swapped to
`Read`/`discover` exactly as `[WALL]` directs. No change wanted there.

---

## 7. What NOT to change

The chunk `NOTES` earn their size, and the evidence is in the reports:

- Workers' `EVIDENCE` lines quote back the exact zod error regexes the plans handed them, cited to a
  real passing test in the same package.
- Chunk 2's stub defaults reuse the plan's own `ASSERTIONS` example values, so the stub output and
  the worked example are identical strings.
- `MIRROR` is one path with very high leverage.
- `INTENT` written as testable assertions is what makes `RESULT:` answerable, and every one of the 23
  `RESULT:` blocks carried a real value.

The gates are earning their keep too. Phase 1 of the web round found three contract constraints with
no case that could fail, and **proved it red-first** by dropping all three and watching exactly those
cases fail. Phase 3 correctly refused to fix a phase-2 file outside its scope and handed it up. The
final shared reviewer caught two mutation-survivable tests and witnessed the mutation red before
accepting either.

**The problem is delivery and shape, not content.**

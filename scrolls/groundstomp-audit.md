# Groundstomper audit — quest a7520e60, operation item 585709ba

**Audited:** the groundstomper operation item on quest `a7520e60-430c-4d0e-b332-9952d6d5c042`
("server health badge in the app top bar"), which ran 2026-08-29T00:11:39Z → 03:28:46Z — **197
minutes** — across two rounds and produced six files: five `.e2e.ts` browser walks and one
`.harness.ts`.

**How:** six sub-agents read the operator's own transcript, all thirteen minion transcripts and all
five helper transcripts the two planners launched, plus both round documents, the seven commits and
the specs in the worktree. Every prompt quoted below is the **as-run** text, recovered from each
session's own `get-agent-prompt` tool result. The post-run prompt edits (`UNITS` folded into
`INTENT`, `NOTES` renamed `TRAPS`, two `MIRROR` lines, `DECISIONS: none` legalised, id-bearing
subtraction) are excluded from the findings except where they made something worse or left it
half-done.

---

## 1. The answer in one paragraph

Nothing stalled, hung, retried or slept. The 197 minutes are **thirteen minion sessions run strictly
one after another**, and every second is accounted for. Three prompt rules produced that
serialization, and one plan line bought a whole second round:

| Cause | Cost |
|---|---:|
| The planner cuts one chunk per `.e2e.ts`, then puts every chunk in its own wave | 31.7 min |
| One `INTENT` row widened the unit's own number, so the assertion could not fail | 33.4 min |
| A phase gate ran on a one-chunk round and found nothing | 4.7 min |
| The final reviewer's ward budget was spent on its first fix, so its second defect became a round | (inside the 33.4) |

Fix those and the same work lands in roughly **128 minutes** — a 35% cut — without weakening a single
assertion. The remainder is real work: writing six files, proving eleven mutations, and opening every
file twice.

---

## 2. Where the 197 minutes went

### 2.1 The full ledger

| Line item | Minutes | % |
|---|---:|---:|
| Round 1 planner (3 parallel explorers + 1 checker inside it) | 16.6 | 8.4 |
| Round 1 workers ×5 (36.6 + 24.4 + 13.9 + 11.4 + 20.5) | **106.8** | **54.2** |
| Round 1 phase gates ×2 (7.2 + 9.2) | 16.4 | 8.3 |
| Round 1 final reviewer | 20.7 | 10.5 |
| **Round 1 subtotal** | **160.3** | **81.3** |
| Round 2 planner (1 explorer + 1 checker inside it) | 10.9 | 5.5 |
| Round 2 worker | 6.8 | 3.5 |
| Round 2 phase gate | 4.7 | 2.4 |
| Round 2 final reviewer | 11.0 | 5.6 |
| **Round 2 subtotal** | **33.4** | **17.0** |
| **All minion time** | **193.7** | **98.3** |
| Operator's own 23 turns | 2.9 | 1.5 |
| Bootstrap + closing message | 0.3 | 0.2 |
| Harness delivery overhead across 13 dispatches | 0.08 | 0.04 |
| **TOTAL** | **197.0** | **100** |

By role: workers **113.5 min (58.6%)**, reviewers **52.7 min (27.2%)**, planners **27.6 min (14.2%)**.

The largest gap between one minion returning and the next going out is **32.0 seconds**. Every other
gap is under 28 seconds.

### 2.2 The session index

| # | Session | Start (UTC) | Min | Turns | Peak ctx | Output tok |
|---|---|---|---:|---:|---:|---:|
| — | operator | 00:11:39 | 197.2 | 58 | 95,136 | 38,869 |
| 1 | planner r1 | 00:12:38 | 16.6 | 92 | 237,699 | 69,162 |
| 1a | explorer: app-shell specs | 00:13:42 | 2.8 | 41 | 127,070 | 13,001 |
| 1b | explorer: harnesses + config | 00:13:49 | 3.4 | 41 | 106,448 | 17,135 |
| 1c | explorer: fault recipes | 00:13:56 | 2.6 | 37 | 108,553 | 12,777 |
| 1d | checker | 00:21:22 | 2.4 | 42 | 96,887 | 10,354 |
| 2 | **worker chunk 1** | 00:29:49 | **36.6** | **213** | **538,779** | **163,321** |
| 3 | reviewer PHASE 1 | 01:06:29 | 7.2 | 81 | 239,429 | 25,978 |
| 4 | worker chunk 2 | 01:13:46 | 24.4 | 129 | 299,290 | 107,070 |
| 5 | worker chunk 3 | 01:38:12 | 13.9 | 91 | 214,476 | 38,740 |
| 6 | worker chunk 4 | 01:52:07 | 11.4 | 98 | 216,742 | 36,636 |
| 7 | worker chunk 5 | 02:03:34 | 20.5 | 108 | 268,770 | 77,522 |
| 8 | reviewer PHASE 2 | 02:24:08 | 9.2 | 71 | 247,890 | 40,585 |
| 9 | final reviewer r1 | 02:33:24 | 20.7 | 95 | 286,672 | 63,297 |
| 10 | planner r2 | 02:54:31 | 10.9 | 88 | 202,939 | 57,256 |
| 10a | explorer r2 | 02:55:13 | 2.0 | 33 | 70,217 | 11,112 |
| 10b | checker r2 | 03:00:04 | 1.8 | 14 | 71,733 | 11,667 |
| 11 | worker r2 chunk 1 | 03:05:37 | 6.8 | 65 | 166,977 | 21,246 |
| 12 | reviewer PHASE 1 r2 | 03:12:34 | 4.7 | 54 | 205,582 | 17,858 |
| 13 | final reviewer r2 | 03:17:36 | 11.0 | 69 | 248,466 | 36,705 |

**Only five of these ran in parallel**, and all five are the explorers and checkers nested inside a
planner. At the operator's level the dispatch is strictly serial: 13 `Agent` calls, never two in one
message. Nothing compacted.

Whole-item cost: **1,520 assistant turns, 870,291 output tokens, 251.7M cache-read tokens, 11.3M
cache-write tokens.**

### 2.3 Where a worker's minute actually goes

Measured over workers 1 and 2 (61.0 min):

| | wall | tool execution | model turn (think + generate) |
|---|---:|---:|---:|
| worker 1 | 36.6 min | 4.0 min (11%) | **32.6 min (89%)** |
| worker 2 | 24.4 min | 5.2 min (21%) | **19.2 min (79%)** |
| combined | 61.0 min | 9.2 min | **51.8 min (85%)** |

All nine ward runs those two made together are **4.9 minutes**. All 48 `discover` calls are **56
seconds**. All seven `ward detail` calls are **3 seconds**.

**There is no tool latency to cut.** 85% of a worker's time is the model deciding and writing. A fix
that does not reduce what the model must decide, or how much it must write, cannot move this number.

---

## 3. The instruction tax

Measured off the real statics, before `$ARGUMENTS`:

| Served text | Characters |
|---|---:|
| `groundstomper-planner-minion` prompt | 33,171 |
| `planner-information` payload | 26,416 |
| **planner reads before it opens a file** | **59,587** |
| `groundstomper-worker-minion` prompt | 17,424 |
| `worker-information` payload | 23,955 |
| **worker reads before it opens a file** | **41,379** |
| `groundstomper-reviewer-minion` prompt | 21,472 |
| `reviewer-information` payload | 40,677 |
| **reviewer reads before it opens a file** | **62,149** |
| `groundstomper-prompt` (operator) | 32,720 |

Every result clears `mcpToolResultStatics.maxVerbatimChars` (50,000) on its own, so nothing spilled to
a file. What the ceiling does not measure is the pair. A reviewer reads ~15,500 tokens of method
before looking at one line of the round it grades, and this item started five reviewers and two
planners.

Measured at the worker end, the fixed preamble is larger than the served prompt alone:

| Loaded before the chunk's own code | worker 3 | worker 4 | worker 5 |
|---|---:|---:|---:|
| session base (system + snippets + brief) | 28,773 | 28,773 | 28,773 |
| `get-agent-prompt` result | 6,418 | 6,418 | 6,418 |
| `get-worker-information` + three standards tools | 44,116 | 44,046 | ~44,000 |
| round document | 21,785 | 24,625 | 17,717 + 12k re-read |
| **total** | **101,092** | **103,862** | **~109,000** |
| wall clock to the end of the mandate | 44 s | 46 s | 60 s |

**79,200 tokens of that are byte-identical across all five workers of round 1.** Across the round:
~496,000 tokens and ~4.2 minutes of wall clock.

**Read that number before recommending coarser chunks.** 4.2 minutes against a 106.8-minute round is
3.9%. The preamble is a *weak* argument for merging chunks. The strong arguments are the wave rule
(§4.1) and the pairwise duplication between chunks 4 and 5 (§5.7).

---

## 4. The three structural causes

### 4.1 One chunk per spec file, then one chunk per wave — 31.7 minutes

The planner prompt forces both halves, and they multiply.

Stage 6:

> **ONE per `.e2e.ts` carrying an `add` or `extend` verdict from step 10 in stage 3**

then, four lines down:

> **Then `PHASES`, then `WAVES:`. Every chunk goes in its OWN wave. This round is SERIAL** — write the
> index one chunk per line, `1: 1`, `2: 2`, `3: 3`.

The operator's prompt hardcodes the consequence in text the planner has no say over:

> *"which chunk goes out next | the plan's `WAVES:` index — one line per wave, **and on this round
> every wave holds exactly ONE chunk**"*

So **wall clock = number of spec files × worker cost**, and the number of spec files is the number of
`.e2e.ts` the planner decides to write. Round 1 wrote five.

**The stated reason is true.** `packages/ward/src/brokers/check-run/e2e/check-run-e2e-broker.ts:132`
builds the report path as `${projectFolder.path}/.ward-playwright-report.json`, passes it as
`PLAYWRIGHT_JSON_OUTPUT_NAME`, and unlinks it at `:179` after reading. One fixed filename per
package. Two concurrent `e2e` runs against `packages/web` genuinely destroy each other's report.

**Two things the prompt does not say, and one it gets wrong:**

| | |
|---|---|
| Ports do **not** collide | `netFreePortAdapter` at `:129` rotates a free port per run and passes `DUNGEONMASTER_PORT`/`DUNGEONMASTER_WEB_PORT`. The prompt never claims they do, but a reader assumes it. |
| A worker's own ward runs `tsc -b` | Every one of the 17 scoped worker ward runs reported `typecheck PASS 13 packages (7307–7311 files)`. Two workers in one wave would be two concurrent root builds — the exact hazard `[WARD]` spends a paragraph on. **`packages/orchestrator/CLAUDE.md` asserts the opposite**, and the transcripts contradict it. |
| Chunk 3 writes the shared harness | Round 1's plan puts `health-badge.harness.ts` in chunk 3's `FILES` ("This chunk MAY correct `closeBackendSockets()`"). That is a real reason chunk 3 must run alone — and the prompt never gets to use it, because the one-chunk-per-wave rule fires first. |

**The counterfactual arithmetic.** Round 1 as measured is
`16.6 + 36.6 + 7.2 + 24.4 + 13.9 + 11.4 + 20.5 + 9.2 + 20.7 = 160.3 min`.

| Scenario | Schedule | Round 1 | Saving |
|---|---|---:|---:|
| A — every chunk whose `DEPENDS` allows it shares a wave | c1 ‖ gate ‖ {c2,c3,c4,c5} ‖ gate ‖ final | 114.7 | 45.6 min |
| **B — honour the read-through rule (c3 owns the harness)** | c1 ‖ gate ‖ {c2,c4,c5} ‖ c3 ‖ gate ‖ final | **128.6** | **31.7 min** |
| C — what is achievable today, unchanged | as run | 160.3 | 0 |

**Scenario B is the honest number: 31.7 minutes off round 1, 16% of the whole session.** Under B the
whole item lands at 162.0 minutes; add the round-2 fixes below and it lands near 128.

**The unlock is a one-line code change, not a prompt change.** Make the report filename unique per
run — the port is already computed three lines above and is already unique — then get `typecheck` out
of a worker's scoped ward. Until both land, **the prompt is correct as written and must not be
relaxed.**

### 4.2 One `INTENT` row widened the unit's own number — 33.4 minutes

This is the single highest-value finding in the audit. A whole round cost 33.4 minutes to add one
assertion, and the cause is one paraphrase.

`get-qa-checklist` states the unit exactly:

```
[ ] health-badge:observable:check-still-online-before-threshold  [ui-state]
    At 29 seconds of silence the badge still reads the ONLINE text from its last heartbeat
```

Round 1's planner rewrote it, twice, in its own words:

- `TOUCHES`: *"the badge still reads its ONLINE text at a MEASURED elapsed since the last frame's
  arrival that is **strictly under 30000ms**"*
- chunk 2's `UNITS` row: *"still the ONLINE text at a measured elapsed **under 30000ms**"*

**`At 29 seconds` became `under 30000ms`, which 100 milliseconds satisfies.** The chunk-2 worker wrote
exactly that — `health-badge-heartbeat.e2e.ts:63-70`, sampled ~0.1 s after a frame — its ward went
green, and its `RESULT:` line answered `yes` **truthfully**, because the row it was graded against was
true.

The planner did this deliberately. Chunk 4's `NOTES`: *"That is what keeps the 30-second cost inside
chunk 3 alone."* Chunk 3's `DECISIONS` line: *"chunk 3 is the only chunk on this round that pays the
30-second cost."* It minimised how many chunks wait 30 seconds, and in doing so pushed the one unit
whose assertion **needs** a >20-second elapsed out of the only chunk that already had one for free.

Round 2's own planner measured what the correct placement would have cost:

> *"The round costs ZERO added wall clock. The new sample is taken 25 seconds into a silence the spec
> already waits 30 seconds through, so nothing new is waited for."*

**Three independent seals guarantee nobody catches it before the final reviewer:**

| Seal | Why |
|---|---|
| The **checker** never sees the checklist | Its brief carries `TOUCHES`, `DEPENDS` and `NO CHUNK`. `INTENT` rows are not in it, and the unit text is not in it. Its six checks are path, name and link checks plus the two `NO CHUNK` checks. A paraphrased `add` row is invisible to it by construction. |
| The **worker** never sees the checklist | `get-qa-checklist` appears nowhere in `groundstomper-worker-minion-statics.ts` or `worker-information-statics.ts`. Neither round-1's chunk-2 worker (73 tool calls) nor round-2's worker (34) ever called it. As far as a worker can tell, **the row IS the unit.** |
| The **reviewer** is the first session holding both | It fetches the checklist at sign-off time — the very end of a 20-minute run, after every chunk has shipped. |

**What the prompt constrains, and what it does not.** Stage 3 step 10 says of an `add` or `extend`
row:

> **Both carry an ASSERTION and never a description of the work**: "the case you are adding" is a
> task, and a task cannot be answered `yes` or `no`.

Every constraint on that row is about **shape**. There is not one word about **fidelity** to the
unit's own text. Contrast the `settled` row, which has a fidelity rule (`— <the assertion you read
there>`) *and* a dedicated checker step.

**Could the round-1 planner have cut it correctly?** Yes, trivially — it had the string `At 29
seconds of silence` in front of it. It also mis-sized the chunk it chose: chunk 2's budget is
`test.describe.configure({ timeout: 45_000 })`, and a 29-second hold after two ~10-second frame waits
is ~49 seconds. **The plan as written made the correct assertion infeasible in the chunk that owned
it.**

**Could the round-1 worker have written it?** No. It could not see `29 seconds`, and its own chunk's
`NOTES` repeated the paraphrase back at it.

### 4.3 The reviewer's ward budget turned a one-line fix into a round

The round-1 final reviewer found **two** real defects while reading at step 4:

1. `health-badge-heartbeat.e2e.ts:58` compared `expectedSecondLabel` against a string **byte-identical
   to** `expectedFirstLabel` — frames are ~10 s apart and the label renders `Xh Ym`, so the assertion
   held on a badge frozen at its first frame.
2. `check-still-online-before-threshold` sampled at 0.1 s (§4.2).

It fixed the first with a new harness reader `frameWithLaterUptimeMinute`, two spec edits and a
witnessed red, then spent its second and last `--staged` pair verifying it. The second defect needed a
strictly *smaller* change — one elapsed-gated sampler plus one assertion, in a spec that already waits
30 seconds — but there was no ward budget left, so it became `NEXT: rework` and 33.4 minutes across
six sessions.

The rule that produced this:

> **Run that pair again if you changed anything here, and run it TWICE at most**

The cap exists to stop a reviewer re-running the same checks hoping a flake clears. Written as a cap
on `--staged` pairs, **it also caps the number of fix batches.** Step 7 itself says the second run's
purpose *is* to check fixes, so a reviewer that finds two defects must either bundle both before
proving either, or ship the second to a whole new round.

Compounding it: the verification run must be full `--staged`, which re-ran all five specs (104.5 s) to
verify a change in two files. About 100 seconds of that re-proved specs nothing had touched.

---

## 5. Findings, ranked

Each finding names the transcript, the prompt line and the fix. Findings the six slices found
independently are consolidated here once.

### F1 — An `INTENT` row may widen the value its unit names, and nothing checks it — 33.4 min

Full mechanism in §4.2.

**Fix — `groundstomper-planner-minion-statics.ts`, Stage 3 step 10, after the four-verdict table:**

> **An `add` or `extend` row's assertion must carry every VALUE the checklist's own text for that unit
> names — the number, the count, the exact string.** Rewrite the unit's wording into the spec's terms
> if you must, but a number the unit states is the target and may not be widened: `at 29 seconds` is
> not `under 30 seconds`, `exactly three` is not `at least one`. **Where you widen a value you have
> written a row a correct-looking spec can satisfy while the unit stays unproven, and nothing before
> your reviewer will catch it.**

**Fix — same file, `## The checker brief`, add a block and a seventh check:**

```
UNITS (the checklist rows for every id carried in an INTENT row, word for word):
<the get-qa-checklist text for each id>

  7. Every INTENT row carrying a unit id, against that unit's own checklist text. A value the
     unit names (a number, a count, an exact string) that the row widened or dropped is the
     defect this check exists to stop.
```

This is the cheapest place to catch it. The checker already runs, already costs ~2 minutes, and on
both rounds it found nothing.

**Fix — same file, `### Stage 6 — Cut`, after "never a group you formed by feel":**

> **A unit whose assertion names a real elapsed goes in the chunk that already waits that long, even
> when its subject belongs to another walk.** One chunk on a round routinely pays a threshold wait; a
> second unit sampled inside that same wait costs nothing, while the same unit in a chunk with a
> shorter budget can only be sampled somewhere the assertion is trivially true. **Write the bound with
> BOTH ends** — `above 20000ms and below 30000ms`, never `under 30000ms` alone.

### F2 — Every wave holds one chunk because one filename is hardcoded — 31.7 min

Full mechanism in §4.1.

**Fix 1 (code, and it must land first):**
`packages/ward/src/brokers/check-run/e2e/check-run-e2e-broker.ts:132` →
`` `${projectFolder.path}/.ward-playwright-report-${serverPort}.json` ``. The port is already unique
per run and already in scope three lines above.

**Fix 2 (`groundstomper-prompt-statics.ts`):** delete *"and on this round every wave holds exactly ONE
chunk"* from the decision table, and replace step 4's *"A wave here holds ONE chunk, so a wave is ONE
`Agent` call"* with the generic rule the other four roles already carry: *"Dispatch every chunk on a
wave line in ONE message, one `Agent` call each. A wave of one is still a wave."*

**Fix 3 (`groundstomper-worker-minion-statics.ts`, step 8):** scope the worker's ward to
`--only lint,e2e` on an `.e2e.ts` file set, so a wave of workers does not run concurrent root
`tsc -b`. See F5 — this contradiction has to be resolved either way.

**Do not do Fix 2 without Fix 1.** As things stand the prompt is correct.

### F3 — The reviewer's twice-at-most ward cap also caps its fix batches — (inside F1's 33.4 min)

Full mechanism in §4.3.

**Fix — `groundstomper-reviewer-minion-statics.ts` step 7 and the matching paragraph in
`reviewer-information-statics.ts`:**

> **Fix everything you found before you verify anything.** Batch your edits — a second defect is not a
> new round, it is another edit in the same batch. Then run the pair. **The cap is on re-running the
> SAME checks over UNCHANGED code — never twice for the same red.** Where a fix you just made needs
> proving, scope it narrow (`npm run ward -- -- <the files you touched>`) rather than spending a full
> `--staged`; the full pair is the last thing you run, once, before you commit.

Add to the `NEXT:` section: *"A defect you named precisely enough to write a `rework` line for is a
defect you understood well enough to fix. Route it out only when it needs a new module, a contract
change or a product decision."*

### F4 — The mutation loop is priced per assertion and paid per walk — 17.9 min in workers 3–5

Across workers 3, 4 and 5: **11 mutations plus one diagnostic, 17.9 of 45.8 minutes, and zero defects
found.** Every mutation produced exactly the red the worker predicted in the sentence before it ran.
The one real defect in that slice — chunk 5's `ERR_INTERNET_DISCONNECTED` console noise — came out of
the plain unmutated baseline run.

The mechanism is that **Playwright aborts at the first failing `expect`**. Chunk 3's four assertions
sit in one `test()` body, so mutations 2, 3 and 4 each re-drove the entire walk — including 30 real
seconds of silence — to reach an assertion the previous run had already passed. Its e2e wall per run:
12.3 s, **52.4 s**, **43.2 s**, **48.2 s**, **43.3 s**.

Chunks 2, 3 and 4 each independently wrote that abort behaviour into their own `GOTCHAS`. **Step 5
never says it.**

Separately, the mutation `health-badge-statics.ts:16 online: 'ONLINE' → 'ONLINE-BROKEN'` was
independently re-derived and re-run by chunks **1, 2, 4 and 5** — roughly 4.5 minutes across the round
for one identical red.

**Fix — `groundstomper-worker-minion-statics.ts`, step 5, after the three bounds:**

> **One mutation may witness several `INTENT` rows at once.** A Playwright test aborts at its FIRST
> failing `expect`, so a mutation aimed downstream of one you already broke re-drives the whole walk to
> reach it. Pick the EARLIEST assertion each mutation can reach, say in `EVIDENCE` which rows it
> covers, and where a row shares a code path with one already witnessed, record that rather than paying
> a second run for it. **Where your walk waits out a real interval, run the mutation that fails BEFORE
> the wait first, and count the wait once.**
>
> **A mutation a sibling's `EVIDENCE` already records against the same `file:line` and the same
> rendered value is one you CITE, not one you re-run.**

**Keep the three bounds.** One line, `git diff` empty before moving on, named in `EVIDENCE` — followed
literally on all eleven mutations across three chunks, all eleven clean, nothing leaked into the round.
Bound the *count*, keep the *bounds*.

### F5 — No chunk field carries the mutation point, so every worker shops for its own — ~9 min

Worker 2 spent **7.0 minutes** (01:22:53 → 01:29:55, thinking gaps of 41 s, 123 s, 131 s, 139 s)
re-reading `use-health-status-binding.ts`, `health-badge-widget.tsx`, `is-heartbeat-silent-guard.ts`,
`playwright.config.ts` and `health-status-broker.ts`. **All five are cited by file *and line* in the
plan's own `DECISIONS` block.** Every read is immediately followed by an `Edit` to that same file — it
was shopping for break points, not learning the flow. Worker 1 paid a smaller version (1.8 min).

Two of worker 2's four mutation points were already recorded, verbatim, in chunk 1's report in the
document worker 2 had open. It read that report at 01:14:11 and re-derived them anyway.

`TRAPS` carries *fault* recipes — runtime levers like `cutWire()` and `closeBackendSockets()`. The
planner is nowhere told to write a *mutation* recipe.

**Fix — `groundstomper-planner-minion-statics.ts`, the `TRAPS` section:**

> **Every `INTENT` row that names a unit gets a MUTATION line in `TRAPS`: the file, the line and the
> exact one-token change that turns that assertion red** — `health-badge-statics.ts:16 online:
> 'ONLINE' → 'ONLINE-BROKEN'`. You have read these files; your workers have not, and each one that has
> to find its own break point pays minutes for a fact you already hold. Where two rows across two
> chunks break at the same line, write the same line in both — a worker must never have to read a
> sibling's report to learn it.

**Fix — `groundstomper-worker-minion-statics.ts`, step 5, after "break the production line the case
guards":**

> Your `TRAPS` names that line. Where it does not, find one — and say in `GOTCHAS` which row was
> missing a mutation line, so the next round's planner writes it.

### F6 — The four lint bans the plan names are the four the `MIRROR` already teaches — ~8 min

Worker 1 spent **6.2 minutes** (00:36:49 → 00:42:59) on ESLint archaeology: `ban-primitives` across
three files, `explicit-return-types`, `explicit-function-return-type`, `consistent-type-imports`,
`config-dungeonmaster-broker.ts` read at three separate offsets, `typescript-eslint-rule-statics`,
hunting `RequestCount` in `@dungeonmaster/testing`, and finally
`discover({grep: "from '@dungeonmaster/testing/contracts", glob: 'packages/web/**'})` → **0 hits over
1,144 files**. Worker 2 then re-ran part of the same sweep (3.7 min).

The three rules that cost the time all bind a **new `.harness.ts`** — a file type no `MIRROR` contains:

| Rule | What it forced |
|---|---|
| `@dungeonmaster/ban-primitives` (`allowPrimitiveReturns: false`) | forbids a bare `number` return **even in a `.harness.ts`**, so `getSeedRequestCount()` shipped as `readonly Date[]` and every sibling chunk reads `.length` |
| `RequestCount` branded contract exists but is imported nowhere in `packages/web` | no precedent to copy |
| `noUncheckedIndexedAccess` × `jest/no-conditional-in-test` | an index read cannot be narrowed inside a `test()` body, so the harness owes a throwing poller per indexed thing |

Chunk 1's `NOTES` named four *other* bans — `forbid-non-exported-functions`, `ban-page-route-in-e2e`,
`ban-wait-for-timeout`, `enforce-e2e-base-import` — every one of which the `MIRROR` demonstrates on
sight, and none of which cost meaningful time.

**This is worse under today's post-change `TRAPS` guidance**, which excludes *"lint rules the worker
already fetched"*. The three expensive rules are fetchable in principle, so that clause reads as
licence to omit exactly what was missing.

**Fix — `groundstomper-planner-minion-statics.ts`, `## TRAPS is what is LEFT`, narrow the exclusion:**

> *"a lint rule the worker already fetched"* means the rules `get-syntax-rules` returns. **A rule that
> binds a file type NO chunk's `MIRROR` contains — above all a NEW `.harness.ts`, where
> `ban-primitives` forbids a bare `number` return and `noUncheckedIndexedAccess` forbids an index read
> a spec could narrow — is a `TRAPS` line**, and naming the return type each method must carry is what
> buys it.

Also: when enumerating a harness surface, name the **signature**, not just the method name.
`getSeedRequestCount(): readonly Date[]` would have collapsed 6.2 minutes to zero.

The same fix note applies in reverse to `forbid-non-exported-functions`, which the new `TRAPS` section
lists under "what does NOT go here". On this round that rule is the reason the harness exists at all —
it dictated the ARTIFACT, not the style. **Narrow the exclusion to "a lint rule that only changes how
the worker writes what it was already going to write", never one that changes what file gets written.**

### F7 — The planner made chunk 1 author a 15-method harness blind — ~8 min

Worker 1 wrote a 383-line, 18-export `health-badge.harness.ts` in the longest turn of the whole run —
a **4-minute-25-second tool-free thinking turn** followed by a 42-second `Write`. **Its own walk uses
four of those exports.**

The instruction is the plan's, from chunk 1's `NOTES`:

> *"Write `closeBackendSockets()` and the init-script tracker NOW even though this chunk's own walk
> does not exercise them — chunk 3 is where they get proved, and chunk 3 may correct them."*

Chunk 3's report records the verdict: *"needed NO correction: both worked exactly as designed on first
real exercise."* Meanwhile chunk 2 added `frameAt` and chunk 4 added `seedResponseAt`, because the
planner could not foresee the lint interaction in F6.

**Neither half of the trade landed.** The speculative code needed no correction *and* later chunks
edited the file anyway.

**Fix — `groundstomper-planner-minion-statics.ts`, harness-planning guidance:**

> **A chunk writes only the harness surface its own walk exercises.** A method the chunk cannot prove
> is a method a later chunk adds when it needs it, in ONE `Edit`, and the harness may therefore appear
> in more than one chunk's `FILES` across waves. **Never instruct a chunk to write an export it will
> not exercise** — an unexercised method is unproven code authored in the most expensive turn of the
> round.

### F8 — A phase gate's findings reach nobody — correctness, and 7.2 min bought nothing

The PHASE 1 reviewer produced two correct, precise findings and wrote them in its return message and
its commit body:

> `check-badge-rendered` verbatim is "…**beside** the existing **dispatch toggle** and rate-limit
> stack". `:43-45` is three independent `toBeVisible()` calls, which proves co-presence, not adjacency
> — and the dispatch toggle it names renders nowhere in the top bar. The plan's `TOUCHES` silently
> substituted `LOGO_LINK` for that toggle.

> `check-online-label` verbatim names `uptimeSeconds: 11520` → `ONLINE 3h 12m`. No browser can make a
> freshly booted server report 11520 s… the hours component is never exercised.

It said in as many words this was recorded *"so the round reviewer's sign-offs do not over-claim"*.

**Neither reached the round reviewer.**

| Channel | Why it failed |
|---|---|
| the return message | goes to the operator, whose `[TURN END]` rule says the parent "reads the `NEXT:` line, acts on that one word, and opens no file to check the rest" |
| the commit body | the final reviewer ran `git show --stat --oneline e078de230`, which prints the subject and a diffstat and **omits the body** |
| the round document | the reviewer prompt has no step that writes a phase finding into it |

**Consequence:** the final reviewer signed `check-badge-rendered` **`confirmed`** with evidence
repeating the exact `LOGO_LINK`-for-dispatch-toggle substitution PHASE 1 had flagged, and signed
`check-online-label` **`confirmed`** on a real body of `uptimeSeconds: 6` → `ONLINE 0h 0m` when the
unit's verbatim text names `11520` → `ONLINE 3h 12m`. **Both verdicts close those units permanently.**

**Fix — `groundstomper-reviewer-minion-statics.ts`, `## On a PHASE: <n> brief`:** add a table row
`| write findings into the round document | yes — append a ### gate — phase <n> block under ## Round log |`
and this sentence:

> **A finding you record only in your commit body or your return reaches nobody.** Your parent reads
> one word of your return, and the round reviewer reads `git show --stat`, which omits your body.
> Append the finding to the round document under `## Round log`, as `### gate — phase <n>`, with
> `cat >> … <<'DOC'`.

Then add to the whole-round `## Workflow` step 3: *"and read every `### gate —` block a phase reviewer
left there"*. `reviewer-information-statics.ts`'s round-document table needs the matching row.

### F9 — Two units blocked by the same wall got two different verdicts — correctness

The final reviewer signed:

- `check-uptime-hours-do-not-roll` → **`unconfirmable`**: *"No browser can make the e2e server report
  the 90061 uptime seconds this reading needs… observed values are single digits to low tens."*
- `check-online-label` → **`confirmed`**, on a real body of `uptimeSeconds: 6` rendering `ONLINE 0h 0m`.

Both units' verbatim texts name a specific uptime a freshly booted e2e server cannot produce (90061
and 11520). **The reviewer's own reasoning on the first is a complete refutation of the second.**

The routing table's left column is the unit's *plan position*, so a unit inside a chunk routes to
`confirmed` by default. Nothing asks whether the assertion proves the unit's own literal text — and
`confirmed` is irreversible.

**Fix — `groundstomper-reviewer-minion-statics.ts`, `## What you sign on this track`, first table row:**

> `| on a chunk's ID-BEARING INTENT row | confirmed on the spec file:line you opened — but ONLY where
> the assertion proves the unit's VERBATIM text. Where the spec proves a weaker general rule because
> the concrete value the unit names is unreachable, that is unconfirmable with the wall named, not
> confirmed. Two units blocked by the same wall take the same verdict. |`

And in the Evidence Contract, after item 1: *"Put the verbatim text and the assertion side by side. A
`confirmed` whose evidence quotes a value the unit does not name is an over-claim, and it closes the
unit forever."*

### F10 — A worker can downgrade a claim and still answer `yes` — correctness, still in the tree

Chunk 1's `INTENT` row 1: *"`HEALTH_BADGE` is visible at `/` in a real browser tab, **in the same
top-bar row as** `LOGO_LINK` and a seeded `RATE_LIMITS_STACK`"*.

The spec asserts:

```typescript
await expect(page.getByTestId('LOGO_LINK')).toBeVisible();
await expect(hb.badge()).toBeVisible();
await expect(page.getByTestId('RATE_LIMITS_STACK')).toBeVisible();
```

Three elements exist somewhere on the page. Nothing asserts a shared row, a shared parent or
comparable `y`. `RESULT:` answers `yes`. The mutation that produced the red removed the widget
entirely, which any of the three weaker assertions would have caught.

Step 4's first bullet forbids *"a weaker `toBeVisible()` stand-in"*, and its sixth bullet says the
reviewer *"rejects a geometry claim that skipped"* the `bringToFront` + `screenshot` +
`visibilityState` triple. **Both rules catch a worker that makes a geometry claim sloppily. Neither
catches a worker that drops the geometry claim and asserts something easier.** The `EVIDENCE` block
asks *"what makes it fail"* about the **assertion**, never *"does the assertion say what the `INTENT`
row says"*.

The post-change edits do not close this: the row is id-bearing, it has `EVIDENCE`, and the reviewer's
subtraction counts it covered.

**Fix — `groundstomper-worker-minion-statics.ts`, step 9, in the `RESULT:` paragraph:**

> **A `RESULT:` line quotes its `INTENT` row word for word, and every CLAUSE of that row must have an
> assertion behind it.** "in the same row as", "beside", "above", "still N after" and "exactly one" are
> each a separate assertion — three `toBeVisible()` calls prove three elements exist and prove nothing
> about where. **Where a clause has no assertion you could name, the answer is `no` and the clause goes
> in `GOTCHAS`, whatever the rest of the row did.**

And add a sixth item to step 5's `EVIDENCE` list: *"— **the clause of the `INTENT` row this assertion
covers**, quoted. A row whose clauses are not all covered is a row that answers `no`."*

**The same edit closes a second hole.** Worker 2 declared in `EVIDENCE` and `GOTCHAS` that two units
were *"not independently witnessed"*, then answered all four `RESULT:` lines `yes` and returned
`NEXT: continue`. The prompt gives it no rule connecting an unwitnessed `EVIDENCE` row to a `no` —
*"Where every `RESULT:` line answers `yes`, that is your line."* **That honest declaration cost a whole
extra round that a `RESULT: no` in round 1 would have folded into the phase gate.**

### F11 — The geometry triple was needed, unused, and cost nothing — informational

`bringToFront`, `screenshot`, `visibilityState` and `boundingBox` appear **zero times** in
`health-badge-mount.e2e.ts`, `health-badge-heartbeat.e2e.ts` and `health-badge.harness.ts`. Cost: 0
minutes. Value: 0. Recorded so a later audit does not read the silence as proof it works — the reason
it fired zero times is F10, not the absence of geometry claims.

Same shape: **`MARKERS:` produced `none` five times out of five.** The whole step-6 / `REPAIR:`
apparatus fired zero times. Not a recommendation to cut it — it is a safety valve for a walk that
exposes a real hole, and this quest's production code was already correct.

### F12 — `ward --staged` exits 1 on every all-e2e round, and no prompt says so — ~2.5 min per reviewer

Both mandated `--staged` runs exited 1 with

> `DISCOVERY MISMATCH — … This run is FAILING until each mismatch below is investigated and resolved
> at the root cause: unit, integration`

while every check that ran passed (`lint` 6/6, `typecheck` 7311/7311, `e2e` 5 files / 6 tests). The
reviewer had to override ward's own emphatic text twice, on judgement, at a cost of one `ward detail`
plus a 94-second pause plus a 46-second pause.

The `<dungeonmaster-ward-discipline>` remedy — "narrow `--only`" — **is unavailable**, because
`--staged` rejects `--only`, as the same snippet says one line later.

Round 2 made it worse: the final reviewer read the exit code, correctly identified the skip, and
**re-ran narrowed anyway** (`--only lint,typecheck,e2e`, 61 s), executing the round's 38-second e2e a
fourth time. Round 2 ran one spec four times for 2.7 of its 34.7 minutes.

**Fix — `groundstomper-reviewer-minion-statics.ts`, beneath step 6's code block:**

> **Your `--staged` run will exit 1, and that is expected.** A groundstomper round writes only
> `.e2e.ts` and `.harness.ts` files, which have no `unit` or `integration` counterpart, so both skip
> and ward reports `DISCOVERY MISMATCH` on them and exits non-zero. Read the per-check lines: `lint`,
> `typecheck` and `e2e` all PASS is your green. **A mismatch on any check that is NOT `unit` or
> `integration`, or a FAIL on any check, is a real red.** **Do not re-run narrowed** — the narrowed run
> re-executes every e2e the `--staged` run already passed. Say which in your `WARD:` line.

**The same contradiction exists in the worker prompt, step 8**, which says both *"Fix until it exits
0"* and *"treat the run as green if nothing else failed"*. A `DISCOVERY MISMATCH` is **guaranteed** for
a `.harness.ts` + `.e2e.ts` pair, so the first sentence is unsatisfiable for every chunk this role will
ever run. Both workers picked the second reading and were right. **Delete "Fix until it exits 0"** and
put the disposition in the same sentence as the scope rule.

**The real fix is in ward itself** — a run whose only failure is a discovery mismatch should exit 0.
That is outside these prompt files.

### F13 — Step 7's premise is false: the worker's own ward typechecks 13 packages — correctness

Step 7 opens *"You run no typecheck of your own, so this step is what stands in for one"*, and
`workerInformationStatics` repeats it. The worker docblock's closed-list table carries the row
`| typecheck, in any ward run | ward's typecheck is tsc -b, which BUILDS |`.

Every one of the **17 scoped worker ward runs across chunks 3–5**, and all nine across chunks 1–2,
reported:

```
typecheck   @dungeonmaster/web   PASS  1132 files, 1132 discovered (7.2s)
typecheck:  PASS  13 packages (7307 files passed/0 files failed, 7307 discovered)  7.2s
```

Steps 7 and 8 contradict each other: step 8's command shape is exactly what makes ward decide, and
ward decides `typecheck` applies. The build ban's stated reason — `tsc` writes one shared `dist/` per
package — is therefore **unenforced by the prompt's own prescribed command**. Nothing collided only
because the planner serialised all five chunks. The non-e2e ward overhead across chunks 3–5 is **299
seconds** — as much as the 5.5 minutes of actual browser time.

`packages/orchestrator/CLAUDE.md` states the opposite ("a worker's scoped ward carries `lint` plus
tests and never `typecheck`"). The transcripts contradict it.

**Fix — resolve it one way and say so.** Either (a) delete the typecheck row from the docblock table
and add to step 8 *"ward's typecheck is `tsc -b`, but your wave holds no other worker — see your
`WAVES` line — so it is safe here"*; or (b) change step 8 to `npm run ward -- --only lint,e2e --
<files>` and delete *"a check type you name yourself is a check you may have silently skipped"*.
**(b) also buys back ~8 s per run, ~2.3 min across a five-chunk round, and it is the prerequisite for
F2's parallel waves.** Correct `packages/orchestrator/CLAUDE.md` either way.

Keep step 7 regardless. It costs 8 seconds and is belt-and-braces — but the reasoning chain it sits on
is broken, and a broken premise gets cited later against a correct run.

### F14 — The blight `working-tree` scope is wrong on any round with a phase gate — correctness

`reviewer-information-statics.ts`:

> **On a whole-round brief, `scope: 'working-tree'` is the only correct scope and you must pass it.**
> | `unpushed` | the PLAN COMMIT and nothing else — your planner committed the round document, and no
> worker committed a line of code |

**Phase gates commit — the reviewer's own prompt orders it.** By the time the round-1 final reviewer
enumerated, the round's code was in `e078de230` and `ded58a9de`, and the working tree held two modified
files. `working-tree` would have returned ~6 units instead of 18 and under-reported the round by two
thirds.

Both final reviewers passed `scope: 'unpushed'` instead, got the right answer, and **neither mentioned
the deviation.** The next one may not work it out.

**Fix — `reviewer-information-statics.ts`, mirrored in the role prompt:**

> **`working-tree` is the round only where the round reaches you uncommitted.** A round that ran PHASE
> gates arrives partly committed — each gate committed its own phase — so `working-tree` then holds
> only what you have changed yourself. **On a round with phases, enumerate `scope: 'unpushed'`**: it
> spans your planner's commit and every phase commit, which together are the round. Confirm the file
> count the checklist reports against your `git status` + `git log` reading before you disposition
> anything, and say in your return which scope you used and why.

Delete the `unpushed` row's claim that no worker committed a line — it is the phase reviewer, not a
worker, and it did.

**Second, smaller:** round 2 re-dispositioned six blight units the tool had already reported as `0 of
6` remaining, ~45 s. Add: *"a unit the checklist reports as already dispositioned is not yours to
overwrite unless this round's diff changed the file's answer."*

### F15 — A one-phase round runs a phase gate that is the final reviewer twice — 4.7 min

Round 2 had one chunk, one wave, one phase. The `PHASE: 1` reviewer opened both written files, returned
`VERDICT: yes`, **`FIXES MADE: none — I found nothing to fix`**, and committed `ca910d939`. The final
reviewer opened the same two files, read the same two `ward detail` records, returned the same verdict
and committed `265b5c1dd`. Its `npm run build` was re-run verbatim seven minutes later. The extra
commit then cost the final reviewer a `git show --stat` plus a `git show <diff>` to reconstruct what it
was grading.

**The gate was structurally unavoidable.** The operator's step 4 mandates it with no exception, and the
only exemption — `PHASES: none` — is reserved for a zero-chunk plan. The planner's own rule ("Where you
wrote no harness, the whole round is ONE phase") lands on one phase either way.

**Fix — `groundstomper-prompt-statics.ts` step 4, after "A wave of one is still a wave":**

> **A round whose `PHASES` index has exactly ONE line runs no phase gate.** Its single phase and the
> whole round are the same set of files, and step 5's reviewer reads them. Dispatch the waves, then go
> straight to step 5. The gate exists so a LATER phase does not build on an unread earlier one; with one
> phase there is no later phase.

**Fix — `groundstomper-planner-minion-statics.ts`, Stage 6, beside the `PHASES` rule:**

> **A one-chunk round writes `PHASES: 1: wave 1 — <the chunk>` and its operator runs no gate on it.**

**On round 1 the gates were a different story.** They cost 16.4 minutes and bought two commits, one
unwitnessed race fix, and two correct findings that were discarded (F8). The catch that mattered came
from the final reviewer **re-reading a file PHASE 2 had already accepted**. So the gates are not
worthless — F8's channel fix is what would make them pay.

### F16 — A round-2 planner re-runs the whole inventory over a scope its predecessor mapped 30 minutes ago — ~4 min

Round 2's explorer (2.0 min) opened every spec the planner then opened itself. The planner read the
three key files at 02:55:55–02:56:10 — **before the explorer returned at 02:57:12** — and its next text
line was *"Explorer's findings match what I opened."* The explorer's whole `NOTHING YET` section was
two items, **both already `out-of-medium` lines in round 1's `NO CHUNK` block and both already `[x]` in
the checklist.**

Round 2's checker (1.8 min) filed five findings. **Four were the same mistake:**

> "TOUCHES health-badge.harness.ts claims it 'Gains ONE new reader this round…' — no such gated sampler
> exists in the file"

The planner had to write a `DECISIONS` paragraph refuting them. **This is a guaranteed round-2+ failure
mode, not bad luck.** On round 1 every written path is `NEW`, so the checker expects absence. On round
2+ every path is `EXISTS` and its description says what the round will ADD — which the checker brief's
checks 5 and 6 fire on by design.

**Fix — `groundstomper-planner-minion-statics.ts`, Stage 1, after step 2:**

> **A `## Rework` naming a bounded set of units is the round's whole scope, and it shrinks the stages
> below.** Re-fetch the checklist to confirm the remainder, then: where a predecessor round's plan
> document already carries `TOUCHES` for the files that remainder lands in, **start NO explorer** — read
> that document's `TOUCHES` and open those files yourself; and where this round's `TOUCHES` names no
> `NEW` path, **send NO checker**, because every path it would test is one a predecessor already wrote
> and your reviewer graded. Say in `DECISIONS` which you skipped and why.

**Fix — same file, `## The checker brief`, inside the fence:**

```
The blocks above describe the tree AFTER this round, not before it. An EXISTS entry whose
description names something this round ADDS — a new harness method, a new assertion, a new
import — is correct even though the file does not carry it today. Do not report those. Report
only what is wrong about the file as it will still be.
```

**Fix — same file, step 7, on what a round-2 planner reads:**

> **On round 2+, the predecessor round document's `## Round log` reports and its `DECISIONS` are what
> you read.** The reports say what was actually built and what its ward measured; `DECISIONS` says what
> was settled by reading. Its `TOUCHES` is your starting inventory — the files it lists are the files
> this flow's walk lives in, and you need no explorer to rediscover them.

### F17 — The checker runs before the chunks exist, so it cannot see where the defects are — 2.5 min for `NO DEFECTS`

The round-1 checker blocked the planner for 147 seconds and returned `NO DEFECTS`. It was right:
`TOUCHES`, `DEPENDS` and all 11 `out-of-medium` rows held, and the final reviewer independently
confirmed every wall.

**Everything that was wrong was in the layer the brief explicitly forbids it to see:**

> **Nothing else goes in it** — not the standards, not the git history, not the inventory, **and not
> the chunks, which you have not cut yet.**

- chunk 2's unfailable label comparison
- chunk 2's 0.1-second sample (F1)
- chunk 3's `INTENT` naming a return type `ban-primitives` rejects (F6)
- chunk 1's `DEPENDS` on `navigation.harness.ts`, whose `navigateToQuest` calls `page.goto` and would
  break the same chunk's "navigation-entry count still 1" assertion — a contradiction between a
  helper's *behaviour* and the chunk's own `INTENT`, which the checker was never shown

The brief's lead item was also dead on arrival. The planner filled it in and cancelled it in the same
line: *"(There are no settled rows in this plan; skip to 2.)"*

**Fix — move the checker dispatch to the END of stage 6**, after the chunks are appended and before the
commit, and add to the brief:

```
CHUNKS:
<every chunk's FILES, INTENT and TRAPS, word for word>

  1. An INTENT row that a trivially-true reading satisfies — a bound with no floor, a comparison
     whose two sides render identically.
  2. A method name or return shape in TRAPS that this repo's lint rules reject.
```

The stage-5 checker found nothing in 2.5 minutes, so moving it loses nothing and F1's seventh check
lands in the same edit.

### F18 — Three explorers, one slice: two opened the same 13 files — ~6 agent-minutes, ~0 wall clock

The planner sliced by ROUTE:

- explorer A: *"every .e2e.ts whose page.goto target is the app shell root route"*
- explorer B: *"…every .e2e.ts spec in the package that is NOT rooted at the app shell root route"*

**`packages/web`'s e2e tree is foldered by FEATURE, not by route**, and 13 specs under
`src/flows/home/**` call `page.goto('/')`. A read the boundary as "roots at `/`" and opened all 15. B
read it as "not `src/flows/app/`", and then the brief's fixed line *"the CONTENTS of the ones whose
page.goto target matches the flow entry above"* sent it into the same 13. C then opened four of them
again. The reports are near-identical down to the citations.

Wall-clock cost is near zero — they ran in parallel inside the planner's stage-2 window. The cost is
token spend, and the planner then wrote the triplication up as corroboration: *"Three independent
explorer sweeps… agree that ZERO of them mention `HEALTH_BADGE`."*

Each explorer's unique contribution was real and worth keeping: B returned the full Playwright config
(the single highest-value return of the round), C returned `page.clock` absent repo-wide, A returned
`smoke.e2e.ts:22`'s pageerror collector.

**Fix — `groundstomper-planner-minion-statics.ts`, stage 1 step 5:**

> **Slice by DIRECTORY, never by route** — a spec's folder is a fact on disk and its `page.goto` target
> is not, so two explorers sliced by route both open every spec that happens to start at your flow's
> entry. Name each explorer's directories explicitly.

Add to the explorer brief fence:

```
NOT YOURS: <the directories a sibling explorer is covering — do not open these>
```

### F19 — The explorers bought two frame-capture recipes and the plan named neither — ~10 min on chunk 1

| Returned by | The find | Where it should have gone |
|---|---|---|
| C | `packages/server/test/harnesses/server-ws/server-ws.harness.ts:302-322` — *"the only harness anywhere that waits on a delivered `health-status` frame"*, exposing `waitForHealthStatusFrames({count, timeoutMs})` **with per-frame `arrivedAt`** | chunk 1 `TRAPS`, and a second `MIRROR` |
| C | `ws-quest-lifecycle.harness.ts:48-72` — `page.on('websocket')` → `framereceived` → decode → safe-parse | chunk 1 `TRAPS` |
| B | `multi-widget-coexistence.e2e.ts:136-151` — `page.on('websocket')` filtered by `/ws` pathname | chunk 5 `TRAPS` |
| B | `navigation.harness.ts` **"has no `navigateToHome`/`goto('/')` helper"** | it contradicts chunk 1's own `DEPENDS` (F17) |
| B | `home-click-routing.e2e.ts:82-86` — the only slice spec that navigates in-app from `/` | chunk 1 `TRAPS`; the worker found it unaided 30 minutes later |

The planner clearly read explorer C's line: it invented the method name `waitForFrames({count,
timeoutMs})`, which is `waitForHealthStatusFrames({count, timeoutMs})` with the noun removed. **It kept
the signature and dropped the path.**

Chunk 1's first ward run is at 01:01:00 — **31 of its 36.6 minutes are pre-ward.** It found
`server-ws.harness.ts` itself at 00:31:44 and `ws-quest-lifecycle.harness.ts` at 00:32:21, ~2 minutes
in, after two speculative `discover` calls.

**Fix — `groundstomper-planner-minion-statics.ts`, `## Mine the existing harnesses for ways to FORCE A
FAULT`:**

> **A recipe your explorer reported by `path:line` goes into `TRAPS` as that `path:line`, whatever
> package it is in.** A method name you copied off an explorer's report without its path is the worst of
> both: your worker reads a signature it must implement and gets no file to copy it from. **Faults are
> half of it — the other half is OBSERVATION**: how this repo already reads a delivered WebSocket frame,
> counts a request, or times an interval. Name those the same way.

**Add a fifth item to the `TRAPS` list:**

> — **a browser or Playwright API the chunk's assertion is made OF that appears in NO spec in this
> package.** Your explorers already read every spec; the absence is free to you and costs the worker a
> search of `node_modules` type declarations `discover` cannot reach. Name the type, the methods and one
> call shape.

That fifth item is chunk 5's 8.25-minute design phase: it needed Playwright's `WebSocket.isClosed()`
and `waitForEvent('close')`, neither of which appears anywhere in `packages/web`'s 83 specs, and paid a
**blocked `grep`** plus three `python3` heredocs paging a 900,000-line `.d.ts` to establish it.

### F20 — Nothing asks whether an assertion can fail — correctness

The round-1 plan's six `ASSERTIONS` are all structural: five new files under `src/flows/app/`, each
`page.goto('/')`; a `discover` grep returning exactly five paths; no `page.route`/`waitForTimeout`/
`clock`; 20 + 11 = 31 ids; `playwright.config.ts` byte-identical; every waiting chunk declaring its own
`describe.configure`. **Every one held.** Not one says *an assertion in this round must be able to go red
for the right reason.*

**Both defects the final reviewer found were exactly that class.**

Round 2's planner wrote a falsifiability assertion unprompted:

> *"Mutating `packages/web/src/statics/health-badge/health-badge-statics.ts:21 silenceThresholdMs` from
> 30000 to 5000 — that one line, nothing else — reds `health-badge-silence.e2e.ts` at the new assertion
> and nowhere earlier"*

That is the shape round 1 needed and had no instruction to produce.

**Fix — `groundstomper-planner-minion-statics.ts`, stage 5 step 15:**

> **At least one `ASSERTIONS` line names a ONE-LINE production mutation and the assertion it must red
> FIRST.** Every artifact on this round is a test, and a test that cannot fail passes forever. You read
> the production files at stages 1–4; name the line, the value it becomes, and which spec line reds — not
> "a spec can be made to fail", which is not checkable.

**Related, and it is the same author:** chunk 2's `NOTES` diagnosed the trap correctly and then
prescribed the assertion that cannot fail:

> *"Consecutive frames differ by ~10 uptime seconds, so the rendered MINUTE usually does NOT change
> between two frames. Assert the label against the newest frame's own `uptimeSeconds`…; do NOT assert
> that the two rendered labels differ, which would red on a correct badge five times out of six."*

The diagnosis is right. The prescription is the bug: if the two labels are identical, "assert the label
equals the newest frame's expected label" is byte-identical to "assert it equals the first frame's", and
a badge frozen at frame 1 passes. The third option — wait for a frame that crosses a minute boundary —
is what the reviewer built, and the planner had every input for it.

**Fix — `## TRAPS is what is LEFT`, add to the list of what earns a line:**

> **A `TRAPS` line that says "do NOT assert X" owes the assertion that replaces it.** Ruling out the
> obvious check without naming a falsifiable substitute leaves the worker the one assertion left
> standing, which is usually the one that cannot fail.

### F21 — Step 3 makes the reviewer read every `RESULT:` before step 4 says not to — contradiction

Step 3: *"**Read the ROUND DOCUMENT** at the path your brief names, **whole**"*.
Step 4, bullet 1: *"Does EVERY line of that chunk's `INTENT` read TRUE… **Answer BEFORE reading its
`RESULT:`**"*.

The `## Round log` with every worker's `RESULT:` block is inside the round document. Step 3 orders the
reviewer to read it whole; step 4 orders it not to have. **All three reviewers read the document whole
first — they had no other option.**

The anchoring is measurable: PHASE 2's acceptance of chunk 2 tracks that chunk's report's own framing
(the `uptimeSeconds > firstFrame` comparison the report leads with) and misses what the report quietly
concedes two lines later.

**Fix — `groundstomper-reviewer-minion-statics.ts` step 3:**

> **Read the ROUND DOCUMENT down to `## Round log` and STOP there** — the `## Plan` blocks are what you
> grade against; the reports are claims about work you have not looked at yet. Open the files (step 4)
> and write your own answer to each `INTENT` row first. **Then** come back and read `## Round log`, and
> where you and a report disagree, yours counts.

### F22 — "CHECK EVERY `unconfirmable`, a predecessor's included" cannot be executed — dead instruction

The only tool the prompt names is `get-qa-checklist`, and its own legend says:

> `[x]` says ONLY that this unit is not yours to sign right now… **Never read it as "an earlier session
> already proved this the way you would have".**

`[x]` carries no verdict, no evidence and no author. **21 of this flow's 52 units came back `[x]`**, and
the reviewer had no way to tell which were `unconfirmable`, let alone read their evidence. It reasonably
did not try.

**Fix.** Either (a) delete *"a predecessor's included"* and let the sentence govern the reviewer's own
verdicts, or (b) make `get-qa-checklist` print each `[x]` row's existing verdict and evidence and name
that surface in the prompt. **Shipping the instruction without the surface trains reviewers to skip
stated mandates.**

### F23 — The round document crosses the `Read` cap — correctness

| Worker | Round-doc read | Result |
|---|---|---|
| chunk 3 | 53,236 chars, 401 lines | complete |
| chunk 4 | 60,070 chars, 425 lines (~24.6k tok) | complete — **right at the 25,000-token cap** |
| chunk 5 | 39,770 chars, ended at line **360 of 447** | **TRUNCATED** — needed `Read(offset:361, limit:86)` |

Chunk 5 noticed and paged. **The truncated region is `## Round log`** — exactly where every sibling's
`GOTCHAS` lives. With one more chunk, or one longer report, a worker that does not re-read works from a
document with its predecessors' findings silently missing, and nothing errors.

**Fix — `groundstomper-worker-minion-statics.ts` step 3, and the same sentence in
`workerInformationStatics`:**

> **Read it in TWO calls, not one.** The file up to `## Round log`, then `## Round log` from its own
> offset. By the fourth or fifth chunk that log is longer than one `Read` returns, and a truncated read
> drops exactly the sibling reports you need. **If your first read does not end at the file's last line,
> page the rest before you open a source file.**

### F24 — `GOTCHAS` is the only channel to a later chunk, and the prompt describes it as colour — ~2 min

Chunk 1 invented `lastSeedResponse()`, chunk 2 invented `frameAt()`, chunk 4 invented
`seedResponseAt()`. All three exist for one reason: `noUncheckedIndexedAccess` types `arr[i]` as
possibly-undefined, `jest/no-conditional-in-test` forbids narrowing it inside a `test()` body, so the
poll has to live in the harness. **Three sessions derived it independently.**

The planner could not have foreseen it — the idiom was invented at chunk 1, after the plan was
committed — so the `TRAPS` change does not reach it. The gap is that a worker's report cannot reach a
later chunk's `TRAPS`; the only route is the whole document (F23).

**Fix — `groundstomper-worker-minion-statics.ts`, step 9, in the report block description:**

> **`GOTCHAS:` opens with what a LATER chunk will need.** A reader, lever or idiom you invented that a
> chunk which has not started will hit too goes on the FIRST line, named — the export, the rule that
> forced it, and the one-line shape. **Your `TRAPS` was written before you existed; `GOTCHAS` is the only
> channel to a chunk that comes after you.**

The current wording — *"the non-obvious bits a sibling chunk or the reviewer must copy"* — reads as
retrospective colour rather than a hand-off.

### F25 — The stage-6 append exceeds what one heredoc will take — 1.6 min, and a near-miss

The round-1 planner spent **80 seconds** generating one `cat >>` heredoc carrying `NO CHUNK` + five
chunks + `PHASES` + `WAVES` + the `## Round log` header, and got:

> `Parser aborted (timeout, resource limit, or over-length)`

**Nothing was written and nothing was reported about what was dropped.** It spent 14 s diagnosing
(`wc -l`, `tail -5`) and 81 s re-emitting as five separate appends. **Had it not checked, it would have
committed a plan with no chunks in it.** On this round append 4 was ~13,000 characters.

Round 2 hit a different wall in the same place: `Contains brace with quote character (expansion
obfuscation)`, because the plan's own `NOTES` contains `{ minElapsedMs: number }` and
`expect({...}).toStrictEqual({...})`. Recovery cost **63 seconds**, including a `/tmp` write blocked for
sitting outside the session's writable roots. The final reviewer independently rediscovered the same
workaround 22 minutes later while writing a commit message (~45 s).

**Fix — `groundstomper-planner-minion-statics.ts`, `## What you append`, after the four-append table:**

> **Append 4 is the only one that can grow past what one `cat >>` will take.** Emit it as one heredoc per
> SECTION — `NO CHUNK`, then one per chunk, then both indexes and the `## Round log` header — never as a
> single command. A heredoc that aborts writes nothing and reports nothing about what it dropped, so a
> plan can be committed with its chunks missing.

**Fix — `round-protocol-statics.ts` (the append rule all five families read):**

> **Where the block you are appending contains `{` next to a quote — a TypeScript object literal, a JSON
> fragment, an `expect({…})` — a quoted heredoc is rejected by this repo's shell guard.** Write the block
> to a file under `<repoRoot>/tmp/` (gitignored) with `Write`, then `cat <that file> >> <the document>`
> as its own command, then remove it in a SEPARATE command. **Never `/tmp`** — it sits outside the
> session's writable roots — and **never chain the `rm` onto the `cat`**, because a blocked `rm` makes it
> impossible to tell whether the `cat` ran.

That one paragraph would have saved all three incidents.

### F26 — The pre-edit lint hook refuses both workers' first spec write, on a rule the prompt never names — ~1.3 min, recurring

Worker 1, 00:58:07:

```
PreToolUse:Write hook error: [dungeonmaster-pre-edit-lint]: 🛑 New code quality violations detected:
  ❌ Line 49:5 - Use single toStrictEqual on complete object instead of testing individual
     properties. Testing 2 properties of "seed" separately allows property bleedthrough
Your edit was NOT applied — the file is unchanged. Re-submit the ENTIRE corrected edit
```

Worker 2, 01:20:28: identical rule, **4 violations**.

**The prompt teaches the assertion style that trips the rule and warns about a different rule.** Step 4
says to assert *"exact text, exact count, exact state"*, which is precisely what produces two adjacent
single-property assertions on one object. The refusal costs a full re-emit of an 80–100-line file, not a
patch. Chunks 3, 4 and 5's reports show the same combined-assertion pattern, so the rule almost certainly
bit them too.

**Fix — `groundstomper-worker-minion-statics.ts`, step 4, extend the first bullet:**

> **Two properties of one object are ONE assertion**: `expect(seed).toStrictEqual({ httpStatus, status,
> uptimeSeconds })`, never two `expect(seed.x)` lines — the pre-edit hook rejects the second shape and
> makes you re-emit the whole file, not a patch.

### F27 — Step 3 of the OPERATOR prompt is not executable with the tools step 3 is given — 0.3 min, and one rule broken every round

The operator's mandated `Read` of the round document came back:

> `Wasted call — file unchanged since your last Read. Refer to that earlier tool_result instead.`

The harness deduped it against the operator's own **step-1 `Write`** plus a truncated
`edited_text_file` attachment. **The operator had never read the planner's `## Plan`.** To find where
`PHASES` was, it ran:

```
00:29:28.747Z  Bash { "command": "wc -l /…/585709ba-…-round-1.md" }
00:29:39.185Z  "That `wc -l` used Bash outside my allowed actions — I'll stick to the Read tool going forward."
```

`wc` is not on the ALLOWED list, whose closing line is *"You never add anything to that ALLOWED list."*
It then read `offset: 250` on a 353-line file, **pulling in 103 lines where the prompt allows 11.**

The rule forbidding the planner from returning the plan body ("burns the context the operator needs")
**cost more context than it saved.**

**Fix 1 — change the planner's return contract** so its two lines become three: the path/count line, the
`PHASES` and `WAVES` block verbatim, then `NEXT:`. About 10 lines, versus the 103 the operator read.
Step 3 then becomes a fallback.

**Fix 2 — if the `Read` stays**, add to step 3: *"Your step-1 `Write` makes the harness refuse a plain
`Read` of this path as a wasted call. Read it with `offset: 1` — the offset defeats the dedupe — and take
the two indexes from the tail."*

**Fix 3 — add the session's first two calls to the ALLOWED list**, which currently omits them:

```
get-agent-prompt · ToolSearch          ← your first two calls, before the script starts
```

A list whose whole authority is exhaustiveness, and which omits the two calls every session makes,
teaches the model the list is approximate. That is exactly how the `wc -l` got rationalised for a turn.

### F28 — "Word for word" is impossible: the harness appends `agentId:` to the `NEXT:` line — correctness

The round-1 final reviewer's last line arrives as:

> `…before the OFFLINE assertion. agentId: a4f09cda59165e814 (use SendMessage with to: 'a4f09cda59165e814', summary: '<5-10 word recap>' to continue this agent)`

The operator copied the rework text and **stopped at "…before the OFFLINE assertion."** — correct, and
an unauthorised judgement. The prompt says *"word for word"*, and word-for-word compliance would have
put a `SendMessage` directive into a document three later sessions read as their brief.

**Fix — one sentence in `groundstomper-prompt-statics.ts` §1 and its four siblings:**

> The harness appends `agentId: … (use SendMessage …)` to the `NEXT:` line. **Copy the reviewer's text up
> to that suffix and drop the suffix** — it is the harness talking, not your reviewer.

### F29 — The spike section asks for something `[WARD]` forbids — dead text, and the planner said so

`plannerInformationStatics`:

> **[WARD] You run no build, no ward, no test and no check of any kind.**

`groundstomperPlannerMinionStatics`, `## Spikes are THROWAWAYS on this round, not kept`:

> A spike here checks whether a recipe actually fires: **whether a socket really closes, whether a route
> really 404s, whether a control is reachable at all.**

Every one of those three checks is a Playwright run. The round-1 planner hit the contradiction and wrote
it into its own `DECISIONS`:

> *"I ran NO spike for that recipe. [WARD] leaves this session running no test of any kind, and Playwright
> writes ONE report path per package, so a probe run would overwrite whatever else is using it. The PHASES
> index below is the remedy instead."*

So the whole spike section, the `spike-tmp/` path, the "delete every probe" rule and the three sentences
elsewhere that send a reader to it are **dead text on this role**. The planner reasoned its way past it,
correctly, and paid tokens to do so.

**Fix — delete `## Spikes are THROWAWAYS on this round, not kept` from
`groundstomper-planner-minion-statics.ts`**, and delete the two `TRAPS` references to a spike path.
Replace with one sentence where the fault-recipe section already is:

> **You cannot spike on this round** — [WARD] leaves you running no test of any kind, and a Playwright
> probe would overwrite the one report path per package your workers need. Where a recipe's behaviour is
> genuinely unknown, put the chunk that PROVES it in a phase of its own, ahead of every chunk that stands
> on it, and say so in `DECISIONS`.

That is what the planner did unaided, and it worked.

### F30 — The anti-sleep paragraph is missing from the payload that needed it — 485 s on this quest

`packages/orchestrator/CLAUDE.md` and `reviewer-information-statics.ts` both record that "two reviewers
answered a backgrounded ward with `sleep 90` and then `sleep 240`" and that 815 seconds of quest
a7520e60 went into sleeps.

**The 815 seconds is exactly right. The attribution is wrong.** A scan of every `.jsonl` under both of
this quest's project directories:

| Agent | Role | Sleeps |
|---|---|---:|
| `agent-a2f6e4f7aff6b4462` | codeweaver-**REVIEWER** round 2 | `sleep 90` + `sleep 240` = **330 s** |
| `agent-ae209109107342a86` | codeweaver-**PLANNER** round 1 | `sleep 90` + `sleep 120` = 210 s |
| `agent-ab69eeb3c8894bad0` | codeweaver-**PLANNER** round 1 | `sleep 45` + `90` + `120` = 255 s |
| `agent-a033422c9ca48c0a6` | codeweaver-**PLANNER** round 3 | `sleep 20` |
| | **total** | **815 s** |

**It was ONE reviewer, and 485 of the 815 seconds (60%) were three PLANNERS.** The `DO NOT SLEEP-POLL A
WARD RUN` paragraph landed in `reviewer-information-statics.ts` and `worker-information-statics.ts`.
**`planner-information-statics.ts` does not carry it** — it has only the generic `[BACKGROUND]` rule,
whose operative sentence a planner watching a 15-minute ward reads as advice about `Agent` calls.

**No reviewer on this groundstomper item slept.** Zero `sleep` calls across all three round-1 reviewer
transcripts; every ward completed in the foreground under `timeout: 600000`.

**Fix.** (a) Copy the paragraph verbatim into `planner-information-statics.ts`'s Operating Rules, beside
`[BACKGROUND]`. (b) Correct the anecdote in `reviewer-information-statics.ts`,
`worker-information-statics.ts` and the root `CLAUDE.md`:

> Measured on one quest: a reviewer answered a 15-minute backgrounded `--staged` ward with `sleep 90`
> then `sleep 240`, tailing its output file by hand; **three planners on the same quest did the same for
> another 485 s.** 815 seconds went into sleeps.

**A role reading "two reviewers" when it is a planner discounts the rule as somebody else's.**

### F31 — `get-testing-patterns` and `get-folder-detail({flows})` are the wrong subject for this round — ~3 payloads × 6 sessions

Two of the four mandated payloads are demonstrably wrong for a browser walk:

| Payload | Size | Why it does not apply |
|---|---:|---|
| `get-testing-patterns` | 48,698 chars (~12k tok) | Jest guidance — `registerMock` proxies, `ReturnType<typeof Stub>`, `toStrictEqual`, no `beforeEach`, `it.each`. **No session on either round wrote a Jest test or cited a line of it.** |
| `get-folder-detail({folderType: 'flows'})` | — | describes React flow components (`flows/[domain]/[domain]-flow.tsx`, "File Suffix `-flow.ts`/`-flow.tsx`") and says nothing about a `.e2e.ts`. **Called by the planner, every worker and every reviewer; used by none.** |

The rules that actually bit — `forbid-non-exported-functions`, `ban-page-route-in-e2e`,
`ban-wait-for-timeout`, `enforce-e2e-base-import`, `ban-primitives`, `jest/no-conditional-in-test`,
`noUncheckedIndexedAccess` — all arrived from the plan's `NOTES`/`DECISIONS`, from the `MIRROR`, or from
the pre-edit hook that refused the write.

**Fix — `groundstomper-worker-minion-statics.ts`, step 2:**

> Run `get-architecture` and `get-syntax-rules`. **Do NOT call `get-testing-patterns` on this round** — it
> is Jest guidance and none of it governs a `.e2e.ts` or a `.harness.ts`. The rules that DO are in your
> chunk's `TRAPS`, in your `MIRROR`, and in the pre-edit hook, which refuses the write rather than letting
> you discover them late.

**and step 3:**

> Call `get-folder-detail` only for a folder type outside `flows/` and `test/harnesses/`. A `.e2e.ts` under
> `flows/` and a `.harness.ts` are both covered by your `MIRROR`; the folder-type payload for `flows`
> describes React components and has nothing for a browser walk.

The same two cuts apply to the planner (stage 2 step 6, stage 3 step 12) and the reviewer (step 2).

### F32 — `UNITS` was pure duplication, and folding it into `INTENT` did not remove it — prompt bloat

Every one of the 20 `UNITS` rows restates, near word for word, a row already written under `TOUCHES`.
Compare the plan's line 52 with line 174, line 57 with line 221, and so on for all twenty. **That is ~40
lines of the same 20 sentences** in a document the operator, five workers and three reviewers each read.

The current template still carries both:

```
TOUCHES:
  ./packages/<e2e-pkg>/src/flows/<route>/<feature>.e2e.ts — EXISTS — ...
      <unit-id> — <the case this spec must carry>
...
INTENT:
  - <unit-id> → ./packages/<e2e-pkg>/.../<feature>.e2e.ts — <the assertion that spec must carry>
```

**Fix:** cut the indented `<unit-id>` rows from the `TOUCHES` fence entirely. `TOUCHES` is the inventory
of FILES; `INTENT` is where a unit's assertion is written and where the reviewer subtracts it from. **One
record per verdict is the plan's own stated principle** — *"Two copies of one verdict can disagree"* — and
the template breaks it.

**One more on the id-bearing subtraction change.** Chunk 1's fourth `INTENT` row was
`- health-badge.harness.ts exists and exports every reader and lever named in NOTES below` — a non-id row
that is also a forward reference into `TRAPS`, so it is unevaluable on its own and now reads as
permanently uncovered. Add to the fence's non-id example: *"a row with no unit id states its assertion in
full and never points at `TRAPS` to complete it."*

### F33 — `settled` and `extend` fired zero times and still cost instruction budget — informational

**11 `out-of-medium`, 0 `settled`, 0 `extend`.** All 11 walls held; **not one was reopened by any reviewer
on either round**, and the final reviewer independently re-verified each before signing. That half of the
four-verdict sort is the most reliable thing on the plan and is what let `signal-back`'s completion gate
clear at all. **Keep every word of the `add`/`out-of-medium` axis.**

The `settled`/`extend` axis cost roughly 25 lines across three sections plus the checker brief's lead
item, which the planner had to fill in and cancel in the same line. On a groundstomper round — which runs
after codeweaver and flowrider on a freshly built feature — **a greenfield flow with no existing e2e is
the common case, not the edge.**

**Fix (cheap, keeps the machinery).** In the checker brief fence, make the settled item conditional:
*"(Where the plan carries no settled rows, this whole item is dropped from the brief you send.)"* And in
stage 3 step 10, after the verdict table: *"On a flow whose feature is new, `settled` and `extend`
routinely fire zero times, and a zero on either is not a sign you sorted wrongly."*

### F34 — Prompt bloat the operator cannot act on — 2,326 chars

`groundstomper-prompt-statics.ts` interpolates `${roundProtocolStatics.commitSubjects}` — a five-row table
of commit subjects — into a session that writes no commit. Step 6 hands the sweep reviewer `SECTION:
Sweep` and no subject; only the SECOND sweep's extra line names one. **Four of the five rows are
unreachable from any path in this prompt.**

**Fix:** drop the interpolation from `groundstomper-prompt-statics.ts` and its four siblings, and keep the
one line step 6 already spells out inside its own fenced block. Saves 2,326 chars of a ~33k served prompt
— 7% against the 50,000 ceiling the file's own BUDGET note guards.

### F35 — The `dungeonmaster-pre-bash` hook's recovery advice does not cover `node_modules/` — hook defect

Chunk 5's `grep -n "class WebSocket" -A 30 …/node_modules/playwright-core/types/types.d.ts` was blocked.
**The hook's message directs the agent to `discover`, and `discover` indexes `packages/**` only.** Its
"outside this repo… scan it with `python3 -c`" clause does not cover `node_modules/`, which IS in this
repo. Chunk 5 worked it out and wrote three `python3` heredocs anyway.

**Fix — `@dungeonmaster/hooks`, the blocked message's last line:**

> Outside `packages/**` — `node_modules/`, a spilled tool-result under `~/.claude`, a sibling checkout —
> `discover` cannot reach it at all: read the path with `Read`, or scan it with `python3 -c` (os.walk + re).

`node_modules/**/types.d.ts` is the second-most-likely place a Playwright worker looks, after the `MIRROR`.

### F36 — Smaller items, worth one line each

| # | Finding | Cost | Fix location |
|---|---|---|---|
| a | The planner cited `comment-queue-send.harness.ts:423-429` four times having read only lines 1-60 of that file. The range came verbatim from two explorers and happens to be correct. | correctness | planner stage 3 step 9: *"A `path:line` you write into a chunk is one you READ at that line."* |
| b | Chunk 3's `INTENT` demanded `closeBackendSockets()` "reports a closed-socket count", which `ban-primitives` rejects for a `.harness.ts`. Worker 1 spent 5 minutes proving it illegal and redesigned four chunks' dependency surface. | ~5 min | planner `## Where a spec lives`: *"never write 'reports a count' or 'returns the number of' into an `INTENT` row or a method name."* |
| c | The planner never called `get-architecture` — it batched it into a `ToolSearch` and never invoked it. Three calls listed in one sentence is a shape where one silently drops. | correctness | stage 2 step 6 |
| d | Chunk 4's reported green cites a run made **before** its four mutations; it never re-ran ward after its last restore. Chunks 3 and 5 both did. | correctness | worker step 8: *"Run it AFTER the last restore at step 5, on a tree whose `git diff` you have just confirmed empty."* |
| e | Round 2's `DECISIONS` held 8 entries, **zero** of them whole-package facts, seven of them per-chunk reasoning also present in `TRAPS`. **The two copies disagreed** — the phase reviewer found the `DECISIONS` clock-skew argument backwards while the `TRAPS` copy had it right. | correctness | stage 5 step 15: *"On a round whose plan cuts ONE chunk, `DECISIONS: none` is the expected answer."* |
| f | Round 2's planner wrote a complete 12-line TypeScript method body into `NOTES`, which the worker pasted in four edits over 52 seconds. **It paid** — 6.8 min is the fastest worker of the quest. The prompt forbids it in the opening (*"if you are typing a spec, you are a worker"*) and invites it in `TRAPS` item 4. | ambiguity | legalise it: *"A `TRAPS` line MAY carry the exact code of a mechanism the `MIRROR` does not demonstrate… **Never write the assertion body itself** — that is the `INTENT` row's job."* |
| g | The operator's step 6 writes `APPEND a ## Sweep section` unconditionally; only the surrounding prose implies the clean case. This operator read it correctly. | ambiguity | *"A clean `git status` ends this step: append nothing and dispatch nothing."* |
| h | The planner ran its own python3 unit accounting before committing — 20 + 11 = 31 = `REMAINING`, no duplicates. **That is not in the prompt and should be.** | positive | stage 6 step 16: *"Before you commit, count: the id-bearing `INTENT` rows plus the `NO CHUNK` lines must equal `get-qa-checklist`'s REMAINING exactly, with no id in two places."* |
| i | PHASE 1 noticed that `npm run build` for `web` is `vite build` and never typechecks `.e2e.ts`, then ran `--only lint,typecheck` on its two files unprompted. **PHASE 2 did not make the same leap**, leaving three new specs untypechecked until the final `--staged`. | positive | promote into the phase table: `| npm run ward -- --only lint,typecheck -- <the phase's files> | yes — npm run build never typechecks .e2e.ts in a vite package |` |
| j | The blight no-batch rule (*"the one thing you do NOT batch"*) cost ~5 min against the sign-off rule's *"BATCH these writes"* three paragraphs later. The reviewer batched anyway, into 3 calls of 6. | ~5 min | reconcile the two rules, or state the exception |

---

## 6. What worked — do not cut these

Each item below is measurable on this run.

**The operator role.** 58 turns, 2.9 minutes, 13 `Agent` calls for 13 minions, zero source reads, zero
builds, zero wards, zero commits, zero verdicts. The ALLOWED/FORBIDDEN table is the most effective
instruction in the prompt — it is why the operator flagged its own `wc -l` inside one turn and never
repeated it. Its own header block claims it replaced a session that ran 217 turns with zero `Agent`
calls; this run is 23 turns with 13.

**The `NEXT:` first-word lookup held 13 out of 13**, through two-space padding, an undocumented
`continue — <prose>` clause, prose above the block, and a harness suffix on the line itself. The
decision table needs no hardening; the grammar around it does (F28).

**Stage 2 as the explorers' shadow.** Twelve tool calls inside the 3.5-minute explorer window, zero
blocking, zero sleeping. *"Those are what YOU read while they run"* did exactly its job. **Stage 3's
named join** produced no sleep ladder and no writing with an explorer out.

**The `out-of-medium` line shape, and the ban on naming a later owner.** Eleven lines, eleven signed
`unconfirmable`, **zero reopened across two rounds and five reviewers**, each carrying a `question` that
names a concrete lower layer rather than a routing note. This is what cleared the completion gate.

**The `NOTES` fault recipes and timeout budgets.** Chunk 3's ORDER paragraph — arm → `waitForFrames`
→ `cutWire()` → `closeBackendSockets()` → assert count → OFFLINE → title → **then** click — with a
citation for each step's *why*. Followed step for step; it is the reason chunk 3's title assertion read
the silence string and not the retry string. All four per-chunk `test.describe.configure({ timeout: N })`
budgets held; **not one run died on an avoidable Playwright timeout across 17 runs.**

**`MIRROR`.** Every worker opened `ws-reconnect.e2e.ts` and copied the socket tracker and the
close-every-`/ws` script rather than inventing one. Chunk 3's report: *"copied verbatim from
`ws-reconnect.e2e.ts:29-45`/`:48-64`."*

**The mutation loop's three bounds.** One line, `git diff` empty before moving on, named in `EVIDENCE` —
followed literally on all eleven mutations across three chunks plus seven more across two, **all clean,
nothing leaked into the round.** *"Restore BY EDITING it back, never `git checkout --`"* was obeyed on
every single mutation, on a branch four other sessions were writing to. **Zero wasted test runs across
workers 1 and 2** — not one rerun from a flake, a timeout, a wrong selector or a rewritten spec.

**"OPEN EVERY FILE THE ROUND PRODUCED."** 3.9 minutes of reading — 19% of the final reviewer's run —
produced the round's only genuine false green: an assertion comparing a string to itself that a green
ward, a worker's confident report and a phase gate had all waved through. **This is the whole return on
the reviewer role.**

**`ward detail <runId>` against a worker's cited runs.** PHASE 1 spent ~15 seconds confirming the
worker's green run was 1 test at 1490 ms and that all three cited reds were stored with real diffs. Cheap,
and it is the only defence against a fabricated evidence block.

**Withholding `perf` and `integrity` from declaration-shaped files.** 12 of 30 possible units suppressed
with 100% precision on this file mix, and the prompt's own note about 88 prior units stopped the reviewer
re-litigating the absence.

**"An `[x]` is already settled; re-signing one overwrites a predecessor's evidence with yours."** Round 2
wrote exactly ONE sign-off on a 52-unit flow and said so. It settled a real unit and re-signed nothing.

**`## Rework` copied word for word into the new round document.** The round-2 planner's first two actions
were `get-qa-checklist` (confirming REMAINING 1 of 52) and a read of the exact spec the rework named. **The
whole round pointed the right way from turn one**, and cost the operator one `Write`.

**The unbounded round loop with `partial` off the signal table.** Round 2 closed a real hole — an ONLINE-
hold assertion sampled at ~0.1 s instead of ~25 s, which a badge with a 1-second threshold would have
passed. A `partial` there would have spent a whole fresh session reconstructing the same remainder out of
git.

**Model assignment.** Planners and reviewers on opus, workers on sonnet, operator on sonnet, never
downgraded — 13 out of 13 dispatches correct.

**The widened collision set.** Chunk 4 added `seedResponseAt` to a harness its `FILES` does not list — an
earlier wave's committed file, no live writer — flagged it in `GOTCHAS`, and swept for it. **Under the old
"any chunk's file is closed" rule that chunk hands up a stub and the round pays a `rework`.** This is the
change `workerInformationStatics`' docblock says it was made for, working exactly as described.

**`RESULT:` answering `INTENT` line by line with a value.** Every row across five chunks carries a
`file:line`, a run id and a real observed value. **This is what let the round-1 reviewer find chunk 2's hole
by reading**, and it is why chunks 3–5 needed no re-litigation. Worker 2's candour under `EVIDENCE` — two
units declared "not independently witnessed" — is the reason the one real coverage gap on the whole item was
found at all.

---

## 7. The fix list, ranked by return

### Do first — these three are most of the 197 minutes

| # | Change | File | Expected |
|---|---|---|---:|
| 1 | Unique the Playwright report filename per run | `packages/ward/src/brokers/check-run/e2e/check-run-e2e-broker.ts:132` | unlocks 31.7 min |
| 2 | Then relax one-chunk-per-wave to the generic wave rule | `groundstomper-prompt-statics.ts` step 4 + decision table | (same 31.7) |
| 3 | Fidelity rule on an `INTENT` row + the checklist in the checker brief + a seventh check | `groundstomper-planner-minion-statics.ts` stage 3 step 10 and `## The checker brief` | 33.4 min |

Change 1 must land before change 2. Change 3 stands alone.

### Do next — each is minutes per round, every round

| # | Change | File |
|---|---|---|
| 4 | Get `typecheck` out of a worker's scoped ward, and correct `packages/orchestrator/CLAUDE.md` | worker step 8 + docblock |
| 5 | Cap re-runs, not fix batches; permit a scoped verification ward | reviewer step 7 + `reviewer-information-statics.ts` |
| 6 | Skip the phase gate on a one-phase round | `groundstomper-prompt-statics.ts` step 4 |
| 7 | A mutation may witness several rows; cite a sibling's mutation rather than re-running it | worker step 5 |
| 8 | A MUTATION line per id-bearing `INTENT` row in `TRAPS` | planner `TRAPS` section |
| 9 | State that `--staged` exits 1 on an all-e2e round, and do not re-run narrowed | reviewer step 6 |
| 10 | A round-2+ planner starts no explorer and sends no checker over a mapped scope | planner stage 1 |
| 11 | Move the checker to the end of stage 6 and show it the chunks | planner stages 5 and 6 |

### Correctness, no direct time saving

| # | Change | File |
|---|---|---|
| 12 | Every clause of an `INTENT` row owes an assertion; an unproven clause answers `no` | worker step 9 + step 5 `EVIDENCE` |
| 13 | A phase gate appends its findings to `## Round log`; the round reviewer reads them | reviewer `## On a PHASE:` + step 3 |
| 14 | A `confirmed` requires the assertion to prove the unit's VERBATIM text; two units behind one wall take one verdict | reviewer `## What you sign on this track` |
| 15 | Read the round document down to `## Round log` and stop, then come back | reviewer step 3 |
| 16 | Blight scope is `unpushed` on a phased round | `reviewer-information-statics.ts` |
| 17 | Delete "a predecessor's included", or give `get-qa-checklist` a verdict surface | reviewer + MCP |
| 18 | Read the round document in two calls | worker step 3 + `workerInformationStatics` |
| 19 | `GOTCHAS` opens with what a later chunk needs | worker step 9 |
| 20 | Copy the reviewer's `NEXT:` text up to the harness `agentId:` suffix | operator §1 + four siblings |
| 21 | The operator's step-3 `Read` needs `offset: 1` to defeat the dedupe; add `get-agent-prompt` and `ToolSearch` to ALLOWED | operator step 3 + tool table |
| 22 | Copy the anti-sleep paragraph into `planner-information-statics.ts`; correct the 815-second anecdote everywhere | `planner-information-statics.ts`, both other payloads, root `CLAUDE.md` |
| 23 | Append 4 goes out one heredoc per section; a brace-next-to-quote block goes via `<repoRoot>/tmp/` | planner `## What you append` + `round-protocol-statics.ts` |
| 24 | The pre-bash hook's recovery advice must cover `node_modules/` | `@dungeonmaster/hooks` |

### Cuts — text that fired zero times or is the wrong subject

| # | Cut | File | Saves |
|---|---|---|---:|
| 25 | The whole spike section — `[WARD]` forbids what it asks for | planner | ~1,400 chars |
| 26 | `${roundProtocolStatics.commitSubjects}` from the operator prompt | operator ×5 | 2,326 chars |
| 27 | `get-testing-patterns` and `get-folder-detail({flows})` from all three minions on this round | all three | ~12k tokens × 13 sessions |
| 28 | The indented `<unit-id>` rows under `TOUCHES` — they duplicate `INTENT` | planner fence | ~40 plan lines |
| 29 | Make the checker brief's `settled` item conditional | planner | — |

---

## 8. Two claims in the repo's own docs that the transcripts contradict

1. **`packages/orchestrator/CLAUDE.md`:** *"a worker's own ward is therefore scoped to its own `FILES`
   and names no check type at all: ward works out which checks apply to the paths it is given, which is
   `lint` plus tests and never a whole-round `typecheck`."* **All 26 scoped worker ward runs on this item
   reported `typecheck PASS 13 packages`.** See F13.

2. **`packages/orchestrator/CLAUDE.md` and `reviewer-information-statics.ts`:** *"two reviewers answered
   a backgrounded ward with `sleep 90` and then `sleep 240`."* **It was one reviewer; 485 of the 815
   seconds were three planners**, and the planner payload is the one that does not carry the rule. See
   F30.

---

*Audited 2026-08-29. Sources: the operator transcript `e036df73-1782-45e7-9c43-a062670dc936.jsonl`, its
eighteen sub-agent transcripts, both round documents under `.quest-plans/`, the seven groundstomper
commits `4d96473b4`…`265b5c1dd`, and the specs in
`worktrees/server-health-badge-in-the-app-top-bar-try-2-a7520e60`.*

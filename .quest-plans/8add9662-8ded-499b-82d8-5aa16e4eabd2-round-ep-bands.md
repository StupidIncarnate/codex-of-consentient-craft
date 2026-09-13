# Siege round: ep-bands lane, P2

FLOW: subagent-duration-execution-panel
PATH: P2 — open-execution-row → row-running → now-threaded → chain-rendered → has-start →
has-notification → has-duration-ms → figure-from-duration-ms → frozen-duration
FORCE: "in_progress" , "this chain" , "yes" , "yes" , "yes"
LANE: ep-bands (apiPort 40403, webPort 42963, home /tmp/dm-siege-ep-bands-2760911)

## Guide corrections

None. The guide's SEEDING, FORCING, TRAPS and CONTROLS sections were all accurate as written —
followed the `subagentDurationTripleChainHarness.seedSiblingChains` recipe (not named as the
PRIMARY seeding path in the guide's own SEEDING section, but named in TOOLING's harness table and
matches its own `check-single-interval-for-panel` recipe) to host seven sibling chains under ONE
in_progress work item, avoiding the orphan-reset trap by keeping exactly one in_progress
sessionId-bearing work item in the whole lane for its entire life.

## Seeding

ONE guild (`ep-bands-guild`, path `/tmp/dm-siege-ep-bands-guild`), ONE quest
(`01f65193-2205-4576-a8b1-93e9a0fc62d0`), FOUR work items:

- **WI_A** `e2e...a1000001` — `in_progress`, `sessionId: siege-ep-bands-a`, `startedAt:
  2026-09-13T20:42:42.253Z`. Session JSONL seeded via `subagentDurationTripleChainHarness
  .seedSiblingChains` with seven sibling chains, all sharing one Task-tool-use-containing
  transcript:
  1. DU9033 — Task `2026-09-10T01:00:00Z`, notification `01:03:20Z` (gap 200000ms/3m20s),
     `durationMs: 9033`
  2. DU270K — Task `02:00:00Z`, notification `02:00:45Z` (gap 45000ms/45s), `durationMs: 270000`
  3. DU3600K — Task `03:00:00Z`, notification `03:02:30Z` (gap 150000ms/2m30s), `durationMs:
     3600000`
  4. DU4380K — Task `04:00:00Z`, notification `04:33:20Z` (gap 2000000ms/33m20s), `durationMs:
     4380000`
  5. WINS — Task `10:00:00Z`, notification `10:10:00Z` (gap 600000ms/10m), `durationMs: 270000`
  6. UNTAGGED — Task `11:00:00Z`, notification `11:10:00Z` (gap 600000ms/10m), no `durationMs`
  7. LIVE — Task at (real seed-time now − 270000ms), no `notification` field at all
  Each of 1-4's gap deliberately lands in a DIFFERENT band than its own `durationMs`, per the
  proven `subagent-duration-frozen-figure.e2e.ts` recipe the guide named — the RED-FIRST property
  that a precedence-ternary inversion reads a different string, never the same one.
- **WI_B** `...a1000002` — `complete`, `sessionId: siege-ep-bands-b`. `seedNestedChain`: outer Task
  `05:00:00Z`/notification `05:20:00Z` durationMs 1200000 ("20m"), inner Task `05:05:00Z`/
  notification `05:09:00Z` durationMs 240000 ("4m").
- **WI_C** `...a1000003` — `complete`, `sessionId: siege-ep-bands-c`, `agentId:
  epbnostartagent`. `sessionHarness.createSubagentTailOnly` — sub-agent tail file only, NO main
  session file, NO Task line anywhere (has-start:no).
- **WI_D** `...a1000004` — `complete`, `sessionId: siege-ep-bands-d`. `seedChain` with a Task
  tool-use and NO `notification` key at all, under a NOT-running row (running-no /
  check-complete-row-passes-no-clock contrast for WI_A's LIVE chain).

Seed script: `tmp/siege-seed-ep-bands.ts`, run as
`HOME=/tmp/dm-siege-ep-bands-2760911 npx tsx --conditions=source tmp/siege-seed-ep-bands.ts
/tmp/dm-siege-ep-bands-guild`. quest.json written directly (full overwrite) with `startedAt`
stamped by hand on WI_A per the guide's `writeQuestFile`-drops-`startedAt` trap, and
`event-outbox.jsonl` appended by hand after the direct write.

## Pass 1 — path walk record

Drove: `goto /ep-bands-guild/quest/01f65193-2205-4576-a8b1-93e9a0fc62d0`, `waitFor
[data-testid=execution-panel-widget]` (row 01/WI_A auto-expanded, no click — it is `in_progress`,
matching the guide's ENTRY note that `QuestChatWidget` branches on `quest.status` alone). Clicked
`execution-row-header` on rows 02/03/04 (all `complete`, need a click per the guide/proven e2e
pattern) to open them too.

### check-chain-renders-in-row
STARTED FROM: fresh goto + waitFor, row 01 auto-expanded (in_progress).
DID: `box` on `[data-testid="execution-row-layer-widget"]:has-text("ep-bands live in_progress row
hosting duration bands") [data-testid="SUBAGENT_CHAIN"]`.
SAW: count 7 — one `SUBAGENT_CHAIN` per seeded Task tool-use, all inside WI_A's own
`execution-row-layer-widget`.
BROKEN WOULD SHOW: count 0 (chains never render), or a nonzero count only under a DIFFERENT/global
selector — i.e. chains rendering outside their own row's `execution-row-layer-widget` container.

### branch:running-yes (edge `running-yes`, row-running —"in_progress"→ now-threaded)
STARTED FROM: WI_A in_progress with `startedAt`, WI_D complete with an identically-shaped chain
(Task present, no notification).
DID: read WI_A's LIVE chain (`box` on
`[data-testid="SUBAGENT_CHAIN"]:has-text("live chain with no notification at all")
[data-testid="subagent-chain-duration"]`) at two points ~90s apart; read WI_D's chain's own
`subagent-chain-duration` count.
SAW: LIVE chain (in_progress row) — count 1, text "5m" then "7m" (climbing). WI_D chain (complete
row, same shape) — count 0, no `subagent-chain-duration` element at all.
BROKEN WOULD SHOW: if the "in_progress" branch were not actually taken, LIVE would ALSO read count
0 (falling through to now-withheld like WI_D) instead of diverging from it.

### check-running-row-passes-clock
STARTED FROM: same as above.
DID: same LIVE-chain read.
SAW: a chain with a non-null Task entry and a null completion notification, inside the in_progress
WI_A row, renders `subagent-chain-duration` (count 1, text advancing "5m"→"7m").
BROKEN WOULD SHOW: count 0 for that exact chain shape — which is precisely what the structurally
identical chain under WI_D (not running) shows.

### branch:chain-to-has-start / branch:chain-to-nested (edge `chain-to-has-start`, chain-rendered
—"this chain"→ has-start)
STARTED FROM: DU270K (plain, WI_A) and the nested chain (WI_B, opened by click).
DID: `box` on `[data-testid="SUBAGENT_CHAIN"]:has-text("durationMs 270000 reads four minutes")
[data-testid="subagent-chain-duration"]` and on
`[data-testid="execution-row-layer-widget"]:has-text("ep-bands nested chain row")
[data-testid="subagent-chain-duration"]`.
SAW: plain chain's own `SUBAGENT_CHAIN` box — count 1 ("4m"). Nested chain's row — count 2 ("20m"
outer + inner).
BROKEN WOULD SHOW: 2 in the plain chain's own box (splicing in a phantom nested chain) or 1 in the
nested row (losing the inner chain's own duration) — the observed 1-vs-2 split is the evidence the
"this chain" vs "each inner chain" fork is really taken.

### branch:yes-start (edge `yes-start`, has-start —"yes"→ has-notification)
STARTED FROM: WI_C (`createSubagentTailOnly`, no Task line, `workItems[].agentId` set) opened by
click; WI_A/B/D chains (all Task-bearing).
DID: `box` on `[data-testid="execution-row-layer-widget"]:has-text("ep-bands no-start tail row")
[data-testid="SUBAGENT_CHAIN"]`.
SAW: WI_C — count 0, `present: false` (no `SUBAGENT_CHAIN` element at all, not an empty one).
Every Task-bearing chain (WI_A ×7, WI_B, WI_D) rendered its own `SUBAGENT_CHAIN` (count ≥1 each,
confirmed above).
BROKEN WOULD SHOW: WI_C rendering an empty/placeholder `SUBAGENT_CHAIN` box (contradicting the
guide's "terminates at no-duration with no chain rendered, not an empty one"), or a Task-bearing
chain rendering none.

### branch:notification-yes (edge `notification-yes`, has-notification —"yes"→ has-duration-ms)
STARTED FROM: DU270K (notification present) vs the LIVE chain (no notification), same WI_A row.
DID: repeated `box` reads on both chains' `subagent-chain-duration` across a ~90s wall-clock gap.
SAW: DU270K pinned at "4m" on every read (frozen). LIVE chain climbed "5m"→"7m" over the same
window.
BROKEN WOULD SHOW: DU270K also climbing (notification ignored) or LIVE staying pinned (clock never
threaded) — the pinned-vs-climbing split is the evidence the two arms are handled differently.

### branch:duration-ms-yes (edge `duration-ms-yes`, has-duration-ms —"yes"→
figure-from-duration-ms) / check-duration-ms-wins-over-gap
STARTED FROM: WINS (durationMs 270000, gap 600000ms) and UNTAGGED (no durationMs, same 600000ms
gap), both WI_A siblings.
DID: `box` on each chain's `subagent-chain-duration`.
SAW: WINS = "4m" (durationMs source). UNTAGGED = "10m" (gap source, same gap WINS also carries).
BROKEN WOULD SHOW: WINS reading "10m" (precedence inverted) or UNTAGGED reading "4m" (impossible
without a durationMs field) — the 4m/10m split off an IDENTICAL gap is what proves the reported
figure, not the gap, drives WINS.

### check-duration-ms-9033-reads-under-a-minute / 270000-reads-4m / 3600000-reads-1h /
4380000-reads-1h13m / terminal:frozen-duration
STARTED FROM: the seven WI_A sibling chains, row auto-expanded.
DID: `box` on each chain's own `subagent-chain-duration`; `box` on
`[data-testid="SUBAGENT_CHAIN"]:has-text(...) [data-testid="streaming-bar-layer-widget"]` for
DU270K; `console` read for the whole session.
SAW: DU9033 → "<1m", DU270K → "4m", DU3600K → "1h" (no trailing zero minutes), DU4380K → "1h13m",
all stable across repeated reads. DU270K's chain carries the notification body ("TASK REPORT
completed: Sub-agent work complete", "Done") intact beside the figure and zero
`streaming-bar-layer-widget` elements (count 0). Console capture: no `error`-typed entries, only
`debug`/`info`/`log` WS/vite noise.
BROKEN WOULD SHOW: any band computed straight from the raw ms count without threshold conversion
(e.g. "9033m"), or from each chain's OWN deliberately-mismatched gap instead of its `durationMs`
(3m/`<1m`/2m/33m respectively — see SEEDING) — a precedence-ternary inversion would read every one
of these four differently. A corrupted terminal would show a stuck spinner or a swallowed
notification body; neither was observed.

### check-duration-sits-in-chain-header
STARTED FROM: DU9033's `SUBAGENT_CHAIN` (first DOM match).
DID: `eval` — read `SUBAGENT_CHAIN_HEADER`'s `.children` testids in order and `header.contains
(durationElement)`.
SAW: `headerChildren: ["P", "P", "subagent-chain-duration"]` — duration is the header's THIRD
child, after the chevron/"SUB-AGENT" label (1st) and the description text (2nd);
`durInHeader: true`; `headerText` ends `...(1 entries)<1m` (duration text trails the description).
BROKEN WOULD SHOW: the duration id absent from `headerChildren` (rendered in the entry list
instead) or positioned before the description.

### check-duration-styling-matches-row
STARTED FROM: same rendered panel (screenshot taken first — `panel-all-expanded.png`, 87840 bytes
— to force a paint before any computed-style read).
DID: `eval` — `getComputedStyle` on the first `subagent-chain-duration` and the first
`execution-row-duration`.
SAW: BOTH read identically — `fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
\"Liberation Mono\", \"Courier New\", monospace"`, `fontSize: "9px"`, `color: "rgb(138, 114, 96)"`.
BROKEN WOULD SHOW: any divergence on those three properties — e.g. the chain figure inheriting the
description text's styling instead of matching the row figure's dedicated text-dim/9px style.

## Defects found

None. Zero-defect pass — every observable and branch on this path read exactly what its unit text
claims, with a real differing value read from each branch's sibling arm.

## Pass 2

Empty defect list — no sub-agents dispatched.

## Sign-offs written

All 15 units on this brief's `UNITS:` list signed `confirmed` via one `modify-quest` call, evidence
copied from the SAW/BROKEN-WOULD-SHOW pairs above, `workItemId:
8add9662-8ded-499b-82d8-5aa16e4eabd2`.

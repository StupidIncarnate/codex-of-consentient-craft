# Manual Chrome walk — both flows, real quest data

Driven by the operator session directly in an attached Chrome tab, not through a siege lane and not
through the lane driver's JSON command-file protocol. Covers both
`subagent-duration-execution-panel` and `subagent-duration-session-view`.

WORK ITEM: 8add9662-8ded-499b-82d8-5aa16e4eabd2

## Why this walk is worth more than a seeded one

Every previous round seeded its own transcript. This one used **real transcripts from this quest's own
execution** — the codeweaver, flowrider and siegemaster sessions that actually built and verified the
feature, 24 to 32 sub-agent files each. Nothing about the data was arranged to make the feature look
right, and two of the readings below are only possible because the data is real:

- The siegemaster session was **killed mid-run**, so exactly 3 of its sub-agents ever wrote a
  completion notification and 13 did not. That gives one row holding both the frozen and the live case
  at once, which no fixture had produced.
- One codeweaver session's transcript carries **no notifications at all**, giving a whole row of
  start-present / notification-absent chains to read the stopped-row rule against.

## Setup

| Piece | Value |
|---|---|
| Code under test | this worktree, branch `quest/live-duration-for-active-sub-agent-items-in-exec-1dac5395` |
| Server | `npm run dev` from the worktree root (the canonical entry point) |
| API / web ports | 4750 / 4751 |
| Data | real `.dungeonmaster` home COPIED to `.dungeonmaster-dev`; the real queue was never pointed at |
| Dispatcher | forced to `paused` in the copy before boot, so no agent could be spawned against the copied in-progress quest |
| Transcripts | read from the real `~/.claude/projects/**` tree (read-only for replay) |

## Reading 1 — the execution panel, quest `1dac5395`

Ten rows render. Row-level durations read `<1m`, `1h33m`, `57m`, `5m`, `1h53m`, `33m`, `64h38m`.
Expanding the four rows with sub-agent transcripts plus the auto-expanded running row gives 33 chains.

Per row, chains against figures:

| Row | Role | Status | Chains | With figure | Without |
|---|---|---|---:|---:|---:|
| 03 | codeweaver | DONE | 12 | 0 | 12 |
| 04 | codeweaver | DONE | 5 | 5 | 0 |
| 06 | flowrider | DONE | 10 | 9 | 1 |
| 07 | flowrider | DONE | 6 | 4 | 2 |
| 08 | siegemaster | RUNNING | 16 | 16 | 0 |

Row 03 reading zero of twelve is CORRECT, and the transcript is what proves it rather than the
rendering. Counting `<task-notification>` lines per session file:

| Row | Session | notifications | carrying `duration_ms` |
|---|---|---:|---:|
| 03 | `b0a2e738` | 1 | 0 |
| 04 | `0dcbc969` | 15 | 14 |
| 06 | `7d917d04` | 27 | 23 |
| 07 | `9d1d0975` | 16 | 13 |

Same DONE status across all four; the one with no notifications is the one with no figures. That is
the stopped-row rule, read off data nobody arranged.

## Reading 2 — the tick, on the execution panel

Snapshotted all 34 figures keyed on chain description, waited 74 seconds of real wall clock
(`refresh.tickMs` is 60000, so one full tick was due), re-read.

- **13 advanced by exactly one minute**: `69h12m→69h13m`, `69h7m→69h8m`, `69h6m→69h7m`,
  `68h47m→68h48m`, `68h46m→68h47m`, `68h28m→68h29m`, `68h27m→68h28m`, `64h37m→64h38m`, and five more.
  Every one of them sits in row 08, the running row.
- **21 held their exact string**: `6m`, `25m`, `10m`, `2m`, `5m`, `19m`, `31m`, `38m` and thirteen
  more — including the three finished chains sitting INSIDE the running row (`14m`, `11m`, `8m`).

Two populations, one page, one tick, opposite behaviour. That rules out "nothing is ticking" and
"everything is ticking" in the same measurement.

## Reading 3 — placement, styling, nesting

- The figure sits inside `SUBAGENT_CHAIN_HEADER` and is the LAST text in it, after the description and
  the entry/context tallies. Rendered: `▾ SUB-AGENT "Chain widget session branch tests" (108 entries,
  148.0k context) 6m`.
- Computed style `ui-monospace / 9px / rgb(138, 114, 96)` — compared field by field against
  `execution-row-duration` in the same render and identical on all three.
- Nesting at depth two in the running row: an outer chain reading `69h13m` over eight inners reading
  `69h8m`, `69h7m`, `68h48m`, `68h47m`, `68h29m`, `68h28m`, `64h38m`, `64h38m`. Nine distinct figures
  in one tree, each computed from its own start.

## Reading 4 — the session transcript, same session, opposite surface

Opened `/codex/session/30e09318-…`, the transcript of the very session whose chains climb in the
execution panel. `execution-row-layer-widget` count is 0 here, so this is genuinely the other route.

| Surface | Chains | Figures | Behaviour over a full tick |
|---|---:|---:|---|
| Execution panel, running row | 16 | 16 | 13 climb, 3 frozen |
| Session transcript | 16 | 3 | all 3 frozen, 13 stay blank |

Held the session page 79 seconds with `window.setInterval` wrapped in a counter: **0 intervals
registered**, the three figures byte-identical, the thirteen blanks still blank. The execution panel
measured the same way moved 13 figures, which is the positive control proving the window was real.

Identical transcript, two surfaces, opposite outcome, and the only difference is the threaded clock.
That is design decision `dd-session-view-no-tick`, measured rather than asserted.

## Console

Read for errors and exceptions on both routes: none.

## Units signed from this walk

Execution panel (8): `branch:running-no`, `branch:notification-no`, `branch:now-yes`, `branch:now-no`,
`check-complete-row-passes-no-clock`, `check-frozen-figure-survives-tick`,
`check-live-figure-without-notification`, `check-figure-advances-on-tick`.

Session view (10): `branch:session-chain-to-start`, `branch:session-yes-start`,
`branch:session-notification-yes`, `branch:session-notification-no`, `terminal:session-no-duration`,
`terminal:session-frozen-duration`, `check-session-chain-renders`,
`check-session-duration-same-test-id`, `check-session-running-chain-blank`,
`check-session-registers-no-interval`.

One deviation is recorded on its own sign-off rather than buried here: `check-figure-advances-on-tick`
names a chain reading `1m` becoming `2m`, and these chains sit in the hours band because the real
sub-agents behind them started 64 to 69 hours ago. The claim measured is the same one — one tick, one
minute, no reload — read at a different band.

## What this walk did NOT cover

Stated so nobody reads the signed units as the whole flow.

**Execution panel, 13 units still open.** Every remaining one needs a seeded transcript, which is
exactly what this walk traded away for real data:

- `branch:duration-ms-no`, `check-gap-4m30s-reads-4m`, `check-gap-30s-reads-under-a-minute`,
  `check-negative-gap-floors-at-zero` — all need a notification with `duration_ms` deliberately
  omitted and specific timestamps. Real notifications here almost always carry the field.
- `check-failed-row-passes-no-clock` — no `failed` row exists in the real data.
- `check-live-figure-on-first-render` — needs a start seeded exactly 270000 ms before first paint.
- `check-single-interval-for-panel` — needs the counter installed BEFORE the panel mounts. Measured
  zero on the session view, which is the opposite surface and does not settle this one.
- Six off-map families: `concurrency`, `interruption`, `staleness`, `configuration`, `hostile-input`,
  `perf`. The eleven-point `hostile-input` plan in
  `d13931f1-…-round-2-stress.md` is still written and still undispatched.

**Session view, 11 units still open**, including `check-session-finished-figure`, which names
`durationMs 270000` reading `4m` specifically — the real frozen figures here read `14m`, `11m` and
`8m`, so the literal value was not driven.

`session-no-start` and the execution panel's `no-start` are the known-unreachable pair two flowrider
passes and one siegemaster pass already settled as `unconfirmable`. They need a graph decision, not a
fourth walk.

# Web execution panel and quest views — walkthrough

Case prefix: `EX` · Packages: `web`, `server`, `orchestrator`, `shared`, `hydration-recipes`, `siegelense` ·
Main sources: `scrolls/orcha-changes/27-ui.md`, `scrolls/consolidated-plan.md` (Track 2),
`scrolls/consolidated-plan-units.md` (T2-*), `scrolls/consolidated-plan-handoff.md`

## What changed

The execution panel renders ONE numbered list, a row per SCOPE (an operation, or a role fallback when
no operation resolves) in first-visible-appearance order, then the still-unclaimed operations. A scope
holding one visible work item stays bare — one row, named by the operation's own text. A scope holding
two or more work items grows an operation HEADER row (numbered, carrying the `[ROLE]` badge) plus one
indented child row per work item, unnumbered, labelled by decision 2's four-tier rule: `step` alone when
its step is unique in the scope; `step - pieceName` when several items share a step but differ by piece;
`step pt: N` (array order) for a true duplicate — same scope, same step, same piece (or no piece at all).
A new quest PROJECTION (contract in `shared`, transformer/broker in `orchestrator`, `GET
/api/quests/:questId/projection` in `server`, `useQuestProjectionBinding` in `web`) walks
`agentFlowStatics` forward from the quest's actual work items to the likely remainder, and drives the
status bar's `N/M STEPS` reading; the bar falls back to the ledger's `N/M OPERATIONS` while the
projection is loading or after it errors, and reads `AWAITING PLAN` when the denominator is 0. New:
a back-edge badge (`↩ <label>`) reading `workItem.mintedBy`, a live unmet-marks list, a unit-marks
readout (`Units: N/M marked`), and a per-scope churn sequence, all inside a row's expanded detail.
`partially_complete`/`PARTIAL` is retired from the web's own status enum and display config — the
LEGACY operation-level `pt N` text (prefix form, minted by a command's exit code) is a separate,
still-live mechanism from decision 2's work-item-level `step pt: N` (suffix form, minted by true
duplicates in one scope) and the two do not collide. The design sandbox statuses (`explore_design`,
`review_design`, `design_approved`) and the `glyphsmith` role are gone from the UI entirely. The SPEC
tab's flow diagram shows a `SEEDS FROM` callout naming each seed recipe on `flow.recipes[]` and the
proving run's `instanceId / runId`. Per `scrolls/consolidated-plan-handoff.md`'s "Finish" section, all
of Track 2 (including the dependency-label/auto-expand/role-colour rework, T2-9a/b) is complete, merged
to master, and the full `npm run ward` exited 0 on the closing run — **none of it has been walked through
in a real browser by a human**, which is this doc's whole reason to exist.

## How to reach it

| Surface | How to reach it | Notes |
|---|---|---|
| Execution panel (EXECUTION tab) | `npm run dev`, open a guild, open a quest whose status is execution-phase | `/:guildSlug/quest/:questId` — `QuestChatContentLayerWidget`'s `isExecutionPhase` branch mounts `ExecutionPanelWidget` |
| Quest Spec panel — SPEC / DETAILS tabs | Same route, pre-execution quest, or the execution panel's own "QUEST SPEC" tab (read-only) | `QuestSpecPanelWidget`, `data-testid="QUEST_SPEC_PANEL"` |
| Verification Summary panel | Same route, execution phase — renders as the right-hand column under the raccoon, beside the execution panel | `QuestSummaryWidget`, seeds from `GET /api/quests/:questId/summary`, testid `QUEST_SUMMARY` |
| Home / guild session list | `/`, click a guild | `GuildSessionListWidget`, "Quests Only" / "All" `SESSION_FILTER` toggle |
| Queue page | `/queue` | `QueuePageWidget` |
| Session view (no quest) | `/:guildSlug/session/:sessionId` | `SessionViewWidget` |
| Isolated seeded instance | `dungeonmaster siegelense start --spec dungeonmaster-stack --seed <recipeName>` | prints an `InstanceManifest` with the instance's own URL; no build needed if `dungeonmaster` is already linked |

## Setup

1. `npm run dev` from repo root (never a workspace-scoped `dev`). No build is required to browse
   live source — `tsx watch --conditions=source` resolves every workspace import to TypeScript.
2. For siegelense (`dungeonmaster siegelense start ...`), the CLI bin must already be built and linked
   once this checkout: `npm run build && npm link --workspaces`.
3. Fastest seeded panel states — `dungeonmaster siegelense start --spec dungeonmaster-stack --seed
   <recipeName>` (add `--idle-timeout-ms 1800000` for a longer manual look; add `--json` for the raw
   manifest). Each call boots a fresh, isolated instance and prints its URL.

   | Recipe | Seeds | Fastest case below it covers |
   |---|---|---|
   | `guild-empty` | one empty guild, no quests or sessions | EX-58 (home empty state) |
   | `guild-with-three-quests` | one guild, three quests: `created`, `in_progress`, `complete` | EX-54, EX-55 (session list, quest row status colours) |
   | `guild-mid-execution` | one guild, three quests — the first running with its riftcarver item dropped | EX-01–EX-10 (execution panel, mid-run) |
   | `guild-active-suite` | one active guild, two quests (one `in_progress`, one `complete`) plus a session with a sub-agent chain | EX-66 (sub-agent chain rendering) |
   | `quest-advances-one-step` | one quest under an existing guild, its ledger one operation along — first item complete, second running | EX-01, EX-33–EX-37 (bare rows, RUNNING row, elapsed duration) |
   | `quest-completed` | one guild, one completed quest, every operation and work item finished | EX-43–EX-50 (Verification Summary), EX-31 (complete status banner) |
   | `session-single-turn` | one session, a single turn prompt/response | EX-61 (session view) |
   | `session-with-nested-chain` | one session, a nested sub-agent chain two levels deep | EX-66 |
   | `session-with-nested-subagent` | one session, an outer chain with one chain nested inside, both finished | EX-65, EX-66 |

4. No canned recipe reaches the multi-work-item scope shapes (nested header row, four-tier labels
   past bare, churn view, back-edge badge, human-check verdict). Reproduce those by hand through the
   `create-quest` / `modify-quest` MCP tools (or `quest.harness.ts`'s `writeQuestFile`, if driving
   from a checkout), copying the exact `operations`/`workItems` shape the cited e2e spec seeds — each
   case below names the spec and the shape.
5. Keep devtools console open the whole walkthrough. Any red there is a defect regardless of what
   `quest.status` or the API says — CLAUDE.md's "browser UI is the verdict" rule.

## Test cases

### Row identity — the four-tier label

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| EX-01 | Seed `quest-advances-one-step`, open the quest, EXECUTION tab | Two rows, each BARE (no operation header, no indentation): row 1 is the first operation's own text with status DONE; row 2 is the second operation's own text with status RUNNING. Neither carries a nested child row. | `unit` — `execution-panel-widget.test.tsx` (T2-1 row-identity assertion) | P2 | |
| EX-02 | Reproduce the shape from `execution-row-back-edge-badge.e2e.ts`: one codeweaver operation, seed a `ward`(red)→`repair`(done)→`ward`(green) cascade so the scope ends with 3 work items | The scope now shows ONE header row (numbered, `[CODEWEAVER]` role badge, named by the operation's own text `Build login broker — package: auth-service · flow: harness-flow`) plus three indented child rows with NO `[ROLE]` badge of their own, reading exactly `ward pt: 1`, `repair`, `ward pt: 2` | `e2e` — `flows/quest-chat/execution-row-back-edge-badge.e2e.ts` | P2 | |
| EX-03 | Reproduce the shape from `execution-row-rework-readout.e2e.ts`: one codeweaver operation, work items `plan`(complete), `work`(complete, unit U1 unmet/U2 met), `work`(complete, U1 met, `mintedBy` the first work), `review`(complete), `work`(in_progress, `mintedBy` review) | Header row plus 5 indented children reading, in order: `plan`, `work pt: 1`, `work pt: 2`, `review`, `work pt: 3` — `work` is the only repeated step, numbered in array order since none carries a `pieceId` | `e2e` — `flows/quest-chat/execution-row-rework-readout.e2e.ts` | P2 | |
| EX-04 | On the same seeded scope, give two of the `work` items DISTINCT `pieceId`s and a `payload.pieceName` string on each (e.g. `login-broker`, `session-adapter`) | Each item's row reads `work - login-broker` / `work - session-adapter` (step name, then the piece's human name) — not `pt: N` | none found — construct by hand per Setup #4 | P1 | |
| EX-05 | On the same seeded scope, give a `work` item a `pieceId` with NO `payload.pieceName` | Its row falls back to `work - <sessionId or work-item id>` for the piece label, never a blank suffix | none found — construct by hand | P1 | |
| EX-06 | Riftcarver's `carve` operation (any quest at the `riftcarver` family step) | Renders BARE — riftcarver holds a single work item per scope, so it never grows a header/nesting regardless of the other rules | `unit` — `execution-panel-widget.test.tsx` | P3 | |

### Status bar and unclaimed tail

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| EX-07 | Reproduce EX-03's rework seed, open EXECUTION tab | Status bar reads `EXECUTION` on the left, `4/8 STEPS` on the right (whitespace may vary) — the PROJECTION'S count, not `N/M OPERATIONS` | `e2e` — `execution-row-rework-readout.e2e.ts` | P2 | |
| EX-08 | Open a brand-new quest with `operations: []` (nothing planned yet) | Status bar reads `EXECUTION` / `AWAITING PLAN`, never `0/0 OPERATIONS` or `0/0 STEPS` | `unit` — `execution-status-bar-layer-widget.test.tsx` | P2 | |
| EX-09 | Throttle/block `GET /api/quests/:questId/projection` in devtools (or catch it mid-load on first paint) | Status bar falls back to the ledger's `N/M OPERATIONS` reading while the projection is loading, then swaps to `N/M STEPS` once it resolves — watch for a visible flicker or a wrong count during the swap | `unit` — `execution-panel-widget.test.tsx` (projection fallback case) | P1 | |
| EX-10 | Open `guild-mid-execution`'s running quest, watch the ratio across a rework (a unit gets marked `unmet`, minting a new work item) | The ratio may visibly FALL (denominator grows faster than the numerator) — this is correct, not a bug; only check it never exceeds 1/1 (100%) | `unit` — `execution-panel-widget.test.tsx` (27d's own ASSERT: never exceeds 1) | P2 | |
| EX-11 | Seed a quest whose operations include one nothing has dispatched a work item for yet | It appears at the END of the numbered list (continuing the same running number), rendered like a normal row but with no entries, no timestamps, no chevron content beyond the dots placeholder, and it is NOT clickable/expandable | `unit` — `unclaimed-operations-transformer.test.ts` | P3 | |

### Scope detail: churn, unit marks, unmet list, back-edge badge

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| EX-12 | From EX-03's seed, expand `work pt: 1`'s row (click its header) | Expanded detail shows `Units: 2/2 marked`, one line `[met] harness-flow:terminal:end` (U2), and — in the separate unmet list below it — `[unmet] harness-flow:observable:scan-finds-every-path: scan skips dotfiles` (U1) | `e2e` — `execution-row-rework-readout.e2e.ts` | P2 | |
| EX-13 | On the same seed, expand `work pt: 3` (in_progress, assigned U1, marked by nothing yet) | `Units: 0/1 marked`, one line `[unmarked] harness-flow:observable:scan-finds-every-path`, and NO unmet-observation line (0 count) | `e2e` — `execution-row-rework-readout.e2e.ts` | P2 | |
| EX-14 | On the same seed, look at `work pt: 2`'s and `work pt: 3`'s header row (collapsed is fine) | `work pt: 2` shows the back-edge badge `↩ work pt: 1`; `work pt: 3` shows `↩ review`; `work pt: 1` and `review` show NO badge at all | `e2e` — `execution-row-rework-readout.e2e.ts` | P2 | |
| EX-15 | On the same seed, expand the operation HEADER row itself (not a child row) | Shows the scope churn sequence: `harness-flow:observable:scan-finds-every-path: unmet (work) → met (work) → unmet (review)` and `harness-flow:terminal:end: met (work) → met (review)` — the WHOLE-scope sequence, which no single work item's own readout shows | `e2e` — `execution-row-rework-readout.e2e.ts` | P2 | |
| EX-16 | From EX-02's back-edge seed, expand `repair`'s row header | Badge reads `↩ ward pt: 1` (the row it returns to, by LABEL, never a raw work-item id); `ward pt: 1` and `ward pt: 2` show no badge | `e2e` — `execution-row-back-edge-badge.e2e.ts` | P2 | |
| EX-17 | Collapse every row on a scope with unit marks, confirm nothing from EX-12–EX-15 (churn, unit marks, unmet list) shows while collapsed | Collapsed rows show only the header line — chevron, order, role badge (if not indented), name, status; no marks/churn text leaks outside the expanded box | `unit` — `execution-row-layer-widget.test.tsx` | P3 | |

### Dependency labels, auto-expand/scroll, role & step colour

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| EX-18 | Seed two work items in the SAME scope with a `dependsOn` edge between them (e.g. a `review` depending on a `work`) | The dependent row's collapsed subtitle reads `└─ depends on: work` — the dependency's own tier LABEL, not its role | `unit` — `execution-row-subtitle-transformer.test.ts` | P2 | |
| EX-19 | Seed two work items with the SAME role but in DIFFERENT scopes, one depending on the other | The dependency label is prefixed with the dependency's own scope: `<scope text> › <dep label>` — confirms two same-role dependencies no longer collapse to `codeweaver, codeweaver` | none found by name — construct via Setup #4; regression this guards is T2-9a | P1 | |
| EX-20 | Seed a `queued` work item that depends on something not yet dispatched | Subtitle reads `└─ waiting for slot (depends on: <label>)`, distinct wording from the `pending` case | `unit` — `execution-row-subtitle-transformer.test.ts` | P3 | |
| EX-21 | Open a quest with exactly ONE running (`in_progress`) row that already has transcript entries | That row auto-expands with no click; every OTHER row (even other running ones, if seeded) stays collapsed until clicked | `e2e` — `flows/quest-chat/execution-panel-active-row-collapse.e2e.ts` | P2 | |
| EX-22 | Seed TWO running rows in different scopes, both with entries | Only the FIRST one in render order auto-expands; the second stays collapsed until you click it — confirms `isRunningFocus` limits auto-expand to one row | none found by name — construct via Setup #4; T2-9a's own regression case | P1 | |
| EX-23 | Open a `ward` step nested inside a codeweaver scope | Its chevron/role-tint colour reads as the WARD gate colour (`warning`, amber), not codeweaver's own colour — confirms step colour wins over role colour | `unit` — `execution-row-display-resolve-transformer.test.ts` | P2 | |
| EX-24 | Open a header row or an unclaimed operation row (carries no `workItem`) | Falls straight through to the ROLE colour (no step to check) — no crash, no undefined-colour flash | `unit` — `execution-row-display-resolve-transformer.test.ts` | P2 | |
| EX-25 | Seed a work item whose `step` or `role` string is NOT one this build's `executionStepStatusConfigStatics` recognises (a newer family's step name) | Row still renders — no `Cannot read properties of undefined` crash. Colour falls back to `text-dim`; the status LABEL echoes the raw string verbatim if the status itself is unrecognised too | `unit` — `execution-row-display-resolve-transformer.test.ts` (the T2-11 fallback fix) | P1 | |

### Retry badge, ad-hoc tag, command rows, ward/riftcarver detail

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| EX-26 | Seed a work item with `attempt: 2, maxAttempts: 3` | Header shows `retry 2/3` in warning-amber, next to the status badge | `unit` — `execution-row-layer-widget.test.tsx` | P3 | |
| EX-27 | Seed a work item with `insertedBy` set (a retry splice) | Row shows a dashed amber left border and an `AD-HOC` tag; a row with no `insertedBy` shows neither | `unit` — `execution-row-layer-widget.test.tsx` | P3 | |
| EX-28 | Expand a `ward` role row carrying a `WardResult` | Shows `Ward exit code: <n>` (green if 0, red otherwise), with `(<wardMode>)` appended when the result carries a mode, e.g. `Ward exit code: 1 (committed)`; expanding further loads the lint/typecheck/test breakdown | `e2e` — `flows/quest-chat/ward-crash-detail.e2e.ts`, `ward-discovery-mismatch-detail.e2e.ts` | P2 | |
| EX-29 | Expand a `riftcarver` role row carrying a `RiftcarverResult` | Shows `Riftcarver exit code: <n>` with its own mode suffix, then the persisted carve log once it loads | `e2e` — `flows/home/quest-detail.e2e.ts` and siblings | P2 | |
| EX-30 | Expand a `ward`/`riftcarver` (command) row with multiple raw output lines | Output renders as ONE merged verbatim block (program output), not as separate markdown-parsed chat messages — confirms `isCommandRow` gating by ROLE, not sniffed content | `unit` — `merge-command-output-entries-transformer.test.ts` | P3 | |

### Pause/Resume, status banner, follow-up/merge, elapsed duration

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| EX-31 | Open a quest with `status: 'in_progress'` and an active work item | `EXECUTION_PAUSE_BUTTON` visible in the action bar at the bottom; `EXECUTION_RESUME_BUTTON` absent | `e2e` — `flows/quest-chat/execution-panel-pause-button.e2e.ts` | P2 | |
| EX-32 | Open a quest with `status: 'paused'` | `EXECUTION_RESUME_BUTTON` visible; `EXECUTION_PAUSE_BUTTON` absent | `e2e` — `execution-panel-pause-button.e2e.ts` | P2 | |
| EX-33 | Open a quest with `status: 'blocked'` | Same as paused: RESUME visible, PAUSE absent | `e2e` — `execution-panel-pause-button.e2e.ts` | P2 | |
| EX-34 | Click PAUSE on an in-progress quest | Fires `POST /api/quests/:questId/pause`; quest transitions toward `paused` without a page reload | `e2e` — `execution-panel-pause-button.e2e.ts` | P2 | |
| EX-35 | Click RESUME on a paused quest | Fires `POST /api/quests/:questId/resume`, restores `in_progress` (or resumes dispatch if there is dispatchable work) | `e2e` — `execution-panel-pause-button.e2e.ts` | P2 | |
| EX-36 | Open `quest-completed` seed | Status banner (not the status bar) shows the completed-quest header text in success green; FOLLOW-UP and/or Teleport-with-Booty (Merge) buttons appear in the post-quest action bar depending on mergeability | none found by testid sweep — spot check | P2 | |
| EX-37 | Open `quest-advances-one-step`'s running row and watch the duration figure over real time | Duration label starts `<1m`, becomes `1m`/`2m`/... past the minute mark, `1h` at exactly one hour with 0 minutes, `1h4m` past that — ticks live via the panel's shared clock, not per-row timers (so two same-age rows never drift apart) | `e2e` — `elapsed-duration-tick.e2e.ts`, `elapsed-duration-bands.e2e.ts` | P2 | |
| EX-38 | Open a FINISHED row (status not `in_progress`) | Duration is frozen at its own `completedAt` span and does NOT advance on the shared tick | `e2e` — `elapsed-duration-finished.e2e.ts` | P3 | |
| EX-39 | Pause a running quest mid-duration | The running row's duration figure stops advancing (tick binding disables once nothing is `in_progress`) | `e2e` — `elapsed-duration-pause.e2e.ts` | P2 | |
| EX-40 | Open a row with no `startedAt` | No duration label renders at all (not `<1m`, nothing) | `e2e` — `elapsed-duration-absent.e2e.ts` | P3 | |

### Quest Spec panel — SPEC tab (flow diagram, recipe callout)

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| EX-41 | Open a quest's SPEC tab whose flow carries `flow.recipes` entries (construct per Setup #4: two entries with distinct `id`/`instanceId`/`runId`) | Top-left of the canvas shows a `SEEDS FROM` box listing each recipe's `id` in order, and under each name its citation `<instanceId> / <runId>` (e.g. `inst_7f3a9c21 / run_2`) | `e2e` — `flows/quest-chat/flow-diagram-interaction.e2e.ts` ("flow with seed recipes") | P2 | |
| EX-42 | Open a flow with an EMPTY `recipes` array | No `SEEDS FROM` box at all — not an empty placeholder, nothing rendered | `unit` — `flow-recipe-callout-layer-widget.test.tsx` | P3 | |
| EX-43 | Click a flow node on the SPEC tab | Detail panel opens top-right, showing the node's contracts (not observables — badge counts contracts only); clicking elsewhere/deselecting closes it | `e2e` — `flow-diagram-interaction.e2e.ts` | P3 | |
| EX-44 | Resize the browser window narrow enough that the flow diagram would need to shrink below its floor | Diagram box gets a scrollbar (`overflowY: auto`) rather than clipping off the bottom of the panel; no "fullscreen" button exists — confirm none was re-added | `e2e` — `flow-diagram-interaction.e2e.ts` (viewport case) | P3 | |

### Quest Spec panel — DETAILS tab (operations ledger, design decisions, contracts)

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| EX-45 | Open DETAILS tab on a quest with operations | OPERATIONS section lists each operation: `[x]`/`[>]`/`[ ]` marker, `[ROLE]` badge, its flow names in brackets (if any) above the operation's own text — and crucially NO ward-mode suffix anywhere on this ledger row (that tag now lives only on the execution panel's own ward-result line, EX-28) | `unit` — `operations-ledger-widget.test.tsx`, `operation-row-layer-widget.test.tsx` | P2 | |
| EX-46 | Open DETAILS tab on a quest with `operations: []` | No OPERATIONS section rendered at all (gated on `quest.operations.length > 0`) | `unit` — `quest-spec-panel-widget.test.tsx` | P3 | |
| EX-47 | Open DETAILS tab at a quest status where the CONTRACTS gate section is not yet visible (pre-flows-approved) | No CONTRACTS section rendered; becomes visible once `isGateSectionVisibleGuard` admits it | `unit` — `is-gate-section-visible-guard.test.ts` | P3 | |
| EX-48 | Confirm the execution panel's OWN "EXECUTION" tab does NOT also render the operations ledger | Only the DETAILS tab (reached via "QUEST SPEC" from execution, or SPEC/DETAILS while composing) shows `OperationsLedgerWidget` — the execution tab's numbered row list is the only place operations render during execution | `unit` — `execution-panel-widget.proxy.tsx` ("the panel no longer renders that widget") | P3 | |

### Verification Summary panel (COVERAGE, ADDED MID-QUEST, DEBT, HUMAN CHECK, NOTES)

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| EX-49 | Open `quest-completed`, look at the right-hand column under the raccoon during execution phase | `▛ VERIFICATION SUMMARY` title, then COVERAGE / ADDED MID-QUEST / DEBT / NOTES sections in that order (HUMAN CHECK only appears if the quest has `verifyByHuman` criteria) | `unit` — `quest-summary-widget.test.tsx` | P2 | |
| EX-50 | Look at COVERAGE for a flow with tracked marks | One row per flow (`name [flowType]`), and under it one row per track: `TRACKNAME`, then FOUR counts each with its own colour — `N met` (success), `N cant-meet` (warning), `N unmet` (danger), `N outstanding` (dim) — never collapsed into one figure | `unit` — `track-row-layer-widget.test.tsx` | P2 | |
| EX-51 | Look at COVERAGE on a quest with no flows | `no flows on this quest` line, not a blank section | `unit` — `quest-summary-widget.test.tsx` | P3 | |
| EX-52 | Look at DEBT for a unit marked `cant-meet` with a `toSettle` action | Row reads `[cant-meet] [track] <unitId>`, the evidence line, then `→ <toSettle text>` in primary colour, testid `QUEST_SUMMARY_DEBT_TO_SETTLE` | `unit` — `debt-row-layer-widget.test.tsx` | P2 | |
| EX-53 | Look at DEBT for a unit marked `unmet` (no successor recorded) | Row reads `[unmet] [track] <unitId>`, evidence, then `→ nothing hands this over; a successor is owed the work` (testid `QUEST_SUMMARY_DEBT_SUCCESSOR`) — NEVER a blank third line | `unit` — `debt-row-layer-widget.test.tsx` | P1 | |
| EX-54 | Look at DEBT on a quest where every unit is proven | `every unit is proven` line (testid `QUEST_SUMMARY_DEBT_EMPTY`) | `unit` — `quest-summary-widget.test.tsx` | P3 | |
| EX-55 | Reproduce `quest-summary-human-check-verdict.e2e.ts`'s shape: a flow observable with `verifyByHuman: true`, no verdict note yet | HUMAN CHECK section appears with the criterion's description, a `HUMAN_CHECK_REASON` textarea, and MET / NOT MET buttons, both disabled until the reason field is non-empty | `e2e` — `quest-summary-human-check-verdict.e2e.ts` | P1 | |
| EX-56 | Fill the reason, click NOT MET | Fires `POST /api/quests/:questId/human-verdict` with `{unitId, outcome: 'not-met', reason}`; the textarea/buttons disappear and are replaced LIVE (no reload) by `[not-met] <reason>` in danger colour — driven by the `quest-modified` broadcast | `e2e` — `quest-summary-human-check-verdict.e2e.ts` | P1 | |
| EX-57 | Open a quest with NO `verifyByHuman` criteria anywhere | HUMAN CHECK section does not render at all — not even an empty-state line (deliberately the one section that stays silent when empty) | `unit` — `human-check-panel-layer-widget.test.tsx` | P3 | |

### `partially_complete` retired, design sandbox removed

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| EX-58 | Sweep every execution row's status badge across every seeded quest state you can reach | Status badge is always one of QUEUED / PENDING / RUNNING / DONE / FAILED / BLOCKED / SKIPPED — `PARTIAL`/`◇` never appears anywhere | `unit` — `execution-step-status-contract.test.ts` (enum has no `partially_complete` member) | P2 | |
| EX-59 | Reproduce a `ward` (command role) red exit that mints a legacy `pt N` operation-level continuation (if your checkout still exercises the legacy step-less path) | The OPERATION's own text may still carry a prefix form like `pt 2: Ward gate (full monorepo)` — this is a DIFFERENT, still-live mechanism from decision 2's work-item `step pt: N` suffix and is not a defect if you see it | `e2e` — `flows/quest-chat/operations-partial-continuation.e2e.ts` | P3 | |
| EX-60 | Try to reach any design-sandbox-related quest status (explore/review design, design approved) via the UI or by seeding one | Impossible to reach through normal flow; if a quest.json on disk still carries one of those retired values from before the migration, it should still LOAD (contract is not `.strict()`) rather than crash the panel, but show no design-specific UI | none found by name — spot check only; `quest-status-contract.ts` confirmed to no longer declare these three values | P2 | |
| EX-61 | Search the whole app for any "glyphsmith" role badge, chat prefix, or design-mode affordance | None exists — the role, its prompts, and the design chat prefix are removed entirely | none found by name — spot check | P3 | |

### Session list, subagent row isolation, general UI sweep

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| EX-62 | Seed one quest whose work items reference THREE different session ids (per `home-session-list-distinct-rows.e2e.ts`), open the guild, default "Quests Only" filter | Exactly ONE row (`QUEST_ITEM_<questId>`) — one row per quest FILE on disk, regardless of how many sessions worked on it. No `SESSION_ITEM_*` rows visible | `e2e` — `flows/home/home-session-list-distinct-rows.e2e.ts` | P1 | |
| EX-63 | On the same guild, switch the `SESSION_FILTER` toggle to "All" | THREE distinct `SESSION_ITEM_<sessionId>` rows, each showing its OWN first-message summary (not the quest title) and its own `SESSION_QUEST_BADGE_<sessionId>`; zero `QUEST_ITEM_*` rows visible while in this mode | `e2e` — `home-session-list-distinct-rows.e2e.ts` | P1 | |
| EX-64 | Open `guild-with-three-quests`, "Quests Only" mode | Three quest rows, status text upper-cased with underscores replaced by spaces (e.g. `IN PROGRESS`), colour-coded per status; a deletable-status quest (created/paused/terminal) shows a skull delete icon, others don't | `unit` — `quest-row-layer-widget.test.tsx` | P2 | |
| EX-65 | Reproduce `quest-replay-subagent-row-isolation.e2e.ts`'s shape: two codeweaver work items sharing ONE parent `/dumpster-launch` session id, but distinct real sub-agent JSONLs | Expand the FIRST codeweaver row: shows ONLY its own sub-agent's text; the second sub-agent's text must NEVER cross-render into the first row's transcript, and vice versa | `e2e` — `flows/quest-chat/quest-replay-subagent-row-isolation.e2e.ts` | P1 | |
| EX-66 | Open `session-with-nested-chain` or `session-with-nested-subagent` | Sub-agent activity renders grouped under a `SubagentChainWidget`, with a nested chain properly indented inside its parent chain (two levels deep) — no flattening, no duplication | `e2e` — `flows/session-view/chat-replay-subagent-grouping.e2e.ts`, `subagent-duration-session-nested.e2e.ts` | P2 | |
| EX-67 | Visit `/` with no guilds yet (`guild-empty`) | `GuildEmptyStateWidget` renders, offering to add a guild via the directory browser modal; no console errors | `e2e` — `flows/home/guild-creation.e2e.ts` | P2 | |
| EX-68 | Visit `/` with guilds present, click through Home → a guild → a quest → back | Each transition is a clean route change (`AppHomeResponder` → `AppQuestChatResponder`), no blank panel mid-transition, no duplicate raccoon/queue-bar mounts | `e2e` — `flows/home/home-click-routing.e2e.ts` | P2 | |
| EX-69 | Visit `/queue` | `QueuePageWidget` renders the cross-guild dispatch queue with its own DispatchToggleWidget and RateLimitsStackWidget; no console errors | `e2e` — `flows/queue/rate-limit-guardrail.e2e.ts` | P2 | |
| EX-70 | Visit `/:guildSlug/session/:sessionId` directly for a session that has NO linked quest | `SessionViewWidget` renders the raw transcript with no execution panel / quest spec at all; no crash on the missing quest | `e2e` — `flows/home/session-without-quest.e2e.ts` | P2 | |
| EX-71 | Visit a nonsense route, e.g. `/does-not-exist` | NOT_FOUND state renders, no console error, no stuck loading raccoon | `e2e` — `flows/home/not-found.e2e.ts` | P3 | |
| EX-72 | Visit `/:guildSlug/quest` with NO `questId` (fresh quest-making surface) | Placeholder/new-chat surface renders (pointing toward `/dumpster-create`), not a blank screen or an error | `e2e` — `flows/quest-chat/quest-creation.e2e.ts` | P2 | |
| EX-73 | Open a quest whose `.json` file on disk is malformed/unparseable | Panel still shows something explanatory (`unreadable-quest-file-reported.e2e.ts` / `malformed-quest-file-reported.e2e.ts` / `dispatch-survives-unparseable-quest-file.e2e.ts`), not a white screen | `e2e` — the three specs named | P2 | |
| EX-74 | General sweep: open every route above with devtools Console and Network tabs visible | Zero uncaught console errors, zero 500s/404s on `/api/*` requests that should have succeeded, zero panels that render as visually blank where content was expected | none — this is the manual sweep itself | P1 | |

- **Pri P1** — no automated test crosses the real surface for this case, or the only tests mock the
  boundary. These are the cases the walkthrough exists for.
- **Pri P2** — covered by tests, but worth one look on the real surface.
- **Pri P3** — well covered. Run it only if time allows.
- **Result** — blank until run. Then `pass`, `fail DEF-NN`, or `skip — <reason>`.

## Known open items

- **`scrolls/consolidated-plan-handoff.md`, "What this session landed"**: "Track 2 — execution panel...
  **None of it has been seen in a browser yet**" — this walkthrough is the first real-browser pass over
  the whole feature. Treat every P1/P2 case as genuinely unverified, not a formality.
- **`scrolls/consolidated-plan-units.md:214-219`** (T2-9a's own worked example) flags that decision 2's
  worked example is ambiguous about whether "the operation row carries the piece name once" means real
  nesting or a flat list with only the first row full-named. Current code (confirmed by reading
  `execution-panel-widget.tsx`) implements the NESTED reading — indented child rows under a header. If
  the owner intended the flat reading, EX-02/EX-03 will look wrong to them even though they match the
  code exactly as shipped.
- **`scrolls/consolidated-plan-handoff.md`, "Known gaps, not yet units"**: `quest-completed`'s hydration
  recipe seeds work items with NO `relatedDataItems` link back to their operations — if EX-49/EX-64 look
  odd on that specific seed (operations shown as unclaimed, or scopes not grouping the way expected),
  this is the named, already-known cause, not a new find.
- **`scrolls/consolidated-plan-handoff.md`, "Traps"**: a package-scoped `ward` run does not evaluate the
  open-handle gate, and lint reads compiled `shared/dist` for `locationsStatics` — neither is relevant to
  a browser walkthrough, but if you ALSO plan to fix something found here, rebuild `shared` before
  trusting lint on it.
- The legacy `pt N` (operation-text, prefix-form) path — EX-59 — is exercised only by the deterministic
  test dispatcher today; it may be rare or unreachable through ordinary manual use. Do not treat its
  absence during the walkthrough as a defect.

## Sources

- `scrolls/orcha-changes/27-ui.md` — the original 7-piece brief (row identity, projection, churn/units,
  the seven broken surfaces, rework, newly-required badges/lists, SPEC-tab recipes).
- `scrolls/consolidated-plan.md` (Track 2 table) and `scrolls/consolidated-plan-units.md` (`T2-0`
  through `T2-12`, and the "Already done" / "forced serial chain" / "Waves" sections) — the verified,
  code-checked unit breakdown, including four corrections to `27-ui.md` itself.
- `scrolls/consolidated-plan-handoff.md` — "Owner decisions", "What this session landed", "Finish — the
  session that closed the plan" (Track 2 complete, merged, ward green), and "Known gaps, not yet units".
- `packages/web/src/widgets/execution-panel/` — `execution-panel-widget.tsx` (row/tier building,
  :139-530), `execution-row-layer-widget.tsx` (the leaf row), `execution-work-item-row-layer-widget.tsx`
  (per-work-item derivation, dependency labels), `execution-row-minted-by-badge-layer-widget.tsx`,
  `execution-row-scope-churn-layer-widget.tsx`, `execution-row-unit-marks-layer-widget.tsx`,
  `execution-row-unmet-list-layer-widget.tsx`, `execution-status-bar-layer-widget.tsx`.
- `packages/web/src/widgets/quest-summary/` — `quest-summary-widget.tsx`, `debt-row-layer-widget.tsx`,
  `track-row-layer-widget.tsx`, `human-check-panel-layer-widget.tsx`, `human-check-row-layer-widget.tsx`.
- `packages/web/src/widgets/quest-spec-panel/quest-spec-panel-widget.tsx`,
  `packages/web/src/widgets/react-flow-diagram/flow-recipe-callout-layer-widget.tsx`.
- `packages/web/src/widgets/guild-session-list/` — `guild-session-list-widget.tsx`,
  `quest-row-layer-widget.tsx`.
- `packages/web/CLAUDE.md` — chat-line translation boundary, disclosure-anchor scroll rules, React Flow
  diagram sizing gotchas (relevant to EX-43/EX-44).
- `packages/hydration-recipes/src/brokers/recipes/catalog/recipes-catalog-broker.ts` and
  `packages/hydration-recipes/CLAUDE.md` — the recipe catalog and its known limits (`quest-completed`'s
  missing `relatedDataItems` link, noted above).
- e2e specs cited inline per case, all under `packages/web/src/flows/{quest-chat,home,session-view,queue}/`.

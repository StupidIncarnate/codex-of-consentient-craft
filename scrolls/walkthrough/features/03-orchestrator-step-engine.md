# The orchestrator step engine — walkthrough

Case prefix: `OR` · Packages: `orchestrator`, `shared`, `mcp`, `server`, `web` · Main sources:
`docs/quest-role-paths.md`, `packages/orchestrator/CLAUDE.md`, `scrolls/orcha-changes/00-CHAIN.md` +
`HANDOFF.md`, `scrolls/orchestrator-step-engine-plan.md`, `scrolls/consolidated-plan-handoff.md`,
`playbook/smoketest-orchastrator.md`, `playbook/smoketest-mcp-orchestration.md`,
`playbook/quest-lifecycle.md`

## What changed

A quest now runs on TWO graphs instead of one operator prompt per role. The **family graph**
(`packages/shared/src/statics/quest-flow/quest-flow-statics.ts`) says which family runs after which:
`riftcarver → codeweaver → flowrider → siegemaster → wardFull → @complete`, `warpgate` appended only at
merge. The **step graph** (`packages/orchestrator/src/statics/agent-flow/agent-flow-statics.ts`) says
what happens inside one family's scope — `plan → work → review → commit → ward`, siegemaster inverted.
Every step is its own dispatched session (or, for `commit`/`ward`/`riftcarver`/`cleanup`, code the Node
dispatcher runs directly) — no operator briefs a sub-agent any more. A session marks units through the
`quest-work` MCP tool (`observations`, `outcome`, `plan`, `amendment`, `invalidation`, `request`
payloads) and then calls `signal-back({ signal: 'complete' })`, which carries no `operationStatus` and
no `partial` any more — the router (`nextActionTransformer`) reads the record and decides everything.
The legacy `pt N` continuation path, the `run-ward`/`run-riftcarver` MCP tools, `glyphsmith`, and the
`explore_design`/`review_design`/`design_approved` statuses are all deleted. The server refuses to boot
on a family or step graph with an unreachable node (`GraphReachabilityBootFlow`, wired into
`packages/server/src/startup/start-server.ts`). Each step spawns on the model its own step node declares
(`bd05d9e85`), reported back by `get-agent-prompt`'s `model` field.

## How to reach it

| Surface | How to reach it | Notes |
|---|---|---|
| Web UI — spec, Start Quest, execution panel | `http://dungeonmaster.localhost:<webPort>/<guildSlug>/quest/<questId>` | `npm run build && npm run prod` (ports from `.dungeonmaster.json`, typically 4800/4801) or `npm run dev` (4750/4751). Root scripts only |
| Web UI — dispatcher | `/queue` page, play button | Node/UI mode — the primary dispatcher in this repo (`orchestrationMode: 'node'`) |
| `/dumpster-launch` slash command | run it in a Claude Code session with the dungeonmaster MCP connected | MCP-mode dispatcher. Cannot run a `deterministic` step — reports the reason and stops |
| `/dumpster-create`, `/dumpster-hunt` | slash commands | Full spec-phase intake, feature vs bug-hunt |
| MCP tools | call by hand from a Claude Code session (`mcp__dungeonmaster__*`) | `create-quest`, `modify-quest`, `start-quest`, `get-next-step`, `get-agent-prompt`, `quest-work`, `get-quest-work`, `signal-back`, `list-quests`, `create-worktree`, … (24 total — `mcpToolsStatics.tools.names`) |
| `POST /api/tooling/smoketest/run`, `GET /api/tooling/smoketest/state` | `curl` against the running server | `run` is registered only when the server process was started with `TOOLING_SMOKETEST_HTTP=1` in its env — not a web UI surface |
| Server boot | `npm run dev` / `npm run prod` | `GraphReachabilityBootFlow()` runs before any listener starts |

## Setup

1. `npm run build`, then `npm run prod` (or `npm run dev` for a source-reading iteration loop). Root
   scripts only — never a per-workspace invocation.
2. Confirm the dungeonmaster MCP in your session is pointed at THIS checkout:
   `mcp__dungeonmaster__list-guilds` should return this repo's guild.
3. **Fastest way to a launchable quest** — the Fake-Quest Bootstrap recipe
   (`playbook/smoketest-orchastrator.md`, "Fake-Quest Bootstrap"): 7 MCP calls
   (`create-quest` then six `modify-quest` status walks) mint an `approved` quest with one two-node
   runtime flow and no ChaosWhisperer conversation, in well under a minute. Case OR-01 uses it.
4. **To stage an exact mid-relay state** — MCP `modify-quest` cannot write `operations` or
   `workItems` (server-only). Use the direct `quest.json` disk-edit technique in
   `playbook/smoketest-mcp-orchestration.md` §6–7: edit the file, save; `get-next-step` reads disk
   fresh and sees it within one call, the web UI within ~3s (fallback poll — a disk edit fires no
   outbox event). Seeding shapes for every payload kind are in that doc's "Seeding reference".
5. Before every fresh flow, abandon every other non-terminal quest
   (`modify-quest({ questId, status: 'abandoned' })`) — `get-next-step` is FIFO-oldest and a stale
   quest steals dispatch.
6. For the smoketest-HTTP cases (OR-74–OR-76) the server process itself must be started with
   `TOOLING_SMOKETEST_HTTP=1` set — the gate is at route REGISTRATION, so setting the var after boot,
   or via a request header, does nothing (`packages/server/src/flows/tooling/tooling-flow.ts:28`).
7. Never manually refresh the browser on a live run. WS drives every panel swap; a refresh kills the
   running agent. See CLAUDE.md's "browser UI is the verdict" rule — a case fails if the UI breaks even
   when `quest.json` looks fine.
8. `packages/hydration-recipes` recipes (`quest-advances-one-step`, `quest-completed`, …) seed Jest
   integration fixtures, not the live dev/prod queue — they are not a shortcut for this walkthrough;
   use step 3 or 4 instead.

## Test cases

### Family happy paths — one full live quest

Drive ONE quest through Phase 1 of `playbook/smoketest-orchastrator.md` end to end. Start from OR-01,
keep the same quest through OR-07.

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-01 | Mint an `approved` quest via Fake-Quest Bootstrap (Setup #3), open it in the browser, click **Start Quest** | Execution panel replaces the spec panel immediately (WS-driven, no reload). `quest.json` has NO `branchName`/`worktreePath` yet — Start is pure bookkeeping. Ledger holds exactly the force-completed intake item + ONE `riftcarver` item, `locked: true`, work item `step: 'carve'` | `orchestration-start-responder` unit tests (mock the FS) | P1 | |
| OR-02 | Press the `/queue` page play button. Watch the riftcarver row | Row streams live: base-branch probe → `git worktree add` → per-root `node_modules` mirror → `— build pass N/3 —`. On green: `worktrees/<slug>-<id8>/` exists; `quest.json` gains `branchName`/`baseBranch`/`worktreePath`/`baseRef`; the first **codeweaver** row (`step: 'plan'`) appears | `graph-reachability` + `stepHandlerRiftcarverBroker` unit tests mock the shell; no e2e drives this live | P1 | |
| OR-03 | Watch one codeweaver scope run `plan → work → review → commit → ward` | `plan` dispatches first (no units, `outcome: 'done'`) → one `work` item per piece (parallel pieces are normal) → `review` once every `work` piece has drained, assigned the scope's WHOLE in-scope set → `commit`/`ward` are `RUNNING` with no `sessionId` (command rows) → scope `complete`. Every row on this scope links the SAME `operations/<id>` | `quest-route-scope-broker.integration.test.ts` (mocked dispatch, not live) | P1 | |
| OR-04 | Once every codeweaver cell completes, watch `flowrider` | Exactly one flowrider scope PER RUNTIME flow is minted — never one scope spanning two flows. Same `plan→work→review→commit→ward` shape. `work`'s Playwright suite brings its own dev server (4750/4751) and tears it down; the prod server (4800/4801 or whatever you set) stays LISTEN throughout | same as above | P1 | |
| OR-05 | Once every flowrider scope completes, watch `siegemaster` | One scope PER flow. `sweepIn` (cleanup) runs first. `plan` cuts pieces. `happyWalk` (needsLane) drives the happy path; its `done` fires only once EVERY happy piece has drained, THEN `adversarial` mints. `adversarial`'s scope is `off-map` units only — it never re-marks what `happyWalk` covered | `quest-route-scope-broker.integration.test.ts`'s phase-order + off-map-scope tests | P1 | |
| OR-06 | Watch siegemaster's `ward` step | Unlike every other family, `done`/`empty` route to **`sweepOut`**, not `@done` — confirm a `sweepOut` (cleanup) row appears before the scope completes | integration test only | P1 | |
| OR-07 | Once every siegemaster scope completes, watch `wardFull` | ONE whole-quest scope is minted, `gate` step, `args: []` (bare ward, no `--committed`/`--uncommitted`). On green: family graph reaches `@complete`; quest status derives `complete`; status bar reads `EXECUTION — M/M OPERATIONS`; terminal banner shows | none — live-only | P1 | |
| OR-08 | On the now-`complete` quest, click **Teleport with Booty (Merge)** | Status flips to `merging` BEFORE the `warpgate` operation item is appended (one scope, `step: 'merge'`, `dependsOn: []`, `locked: true`). `merge` runs the `warpgate` prompt (opus). On `done`: `git merge --squash` lands ONE commit on base; quest status becomes `merged` | none — live-only | P1 | |
| OR-09 | Run a `bug-hunt` quest via `/dumpster-hunt` instead (or seed `questType: 'bug-hunt'` per the Fake-Quest recipe) through OR-01–OR-07 | Identical family graph — `questFlowStatics.feature` and `questFlowStatics['bug-hunt']` share every family. Only the intake role differs (`bughunt` vs `chaoswhisperer`). The `EXPECTED:` observable becomes one failing test in the codeweaver scope owning that package | `quest-flow-statics.test.ts` (colocated) asserts the two share families | P2 | |

### Deterministic steps

Every row here has NO `sessionId` — its only route to the UI is the `commandChatOutputEmitTransformer`
live stream, keyed on the work item id.

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-10 | Watch a family's own `ward` step (inside OR-03) | `execution-row-ward-result` shows `Ward exit code: N (committed)`. `args` are exactly `['--committed', '--uncommitted']` | `stepHandlerWardBroker` unit tests | P2 | |
| OR-11 | Watch `wardFull`'s `gate` step (OR-07) | `execution-row-ward-result` shows `Ward exit code: N (full)`, no `(committed)`/`(full)` confusion between the two ward kinds | same | P2 | |
| OR-12 | On a repaired re-carve (see OR-19), read the SECOND carve's stream | git and `node_modules` steps print `— skip … —` lines; ONLY the typecheck re-runs. A re-carve that re-runs `git worktree add` is the regression | `worktree-prepare-broker` unit tests (done-check per step) | P1 | |
| OR-13 | Reload the page after riftcarver finishes, expand the row | Persisted `riftcarver-results/<id>.log` renders — history survives a reload; the live stream was memory-only | none — live-only | P1 | |
| OR-14 | Watch `sweepIn`/`sweepOut` around a siegemaster scope (OR-05/06) | Both are `cleanup` handler rows, `RUNNING` with no `sessionId`. `sweepOut` catches whatever the pass leaked — after it completes, `dungeonmaster siegelense status` (or `lsof -i :<lanePort>`) shows nothing left listening for that scope's lane | `stepHandlerCleanupBroker` unit tests | P2 | |
| OR-15 | On a `commit` step, check the commit message | Message is built by the handler from the work items covered SINCE this scope's last commit at this step — never agent prose. `git add -A && git commit --allow-empty` then a BARE `git push` (no `-u` — riftcarver already set upstream at carve) | `stepHandlerCommitBroker` unit tests | P2 | |

### Failure & recovery routes

Each on its own fresh quest — `docs/quest-role-paths.md` "The sad paths in detail".

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-16 | At any `prompt` step, have the session mark ≥1 assigned unit `unmet` (`quest-work` `observations`), then `outcome: { word: 'unmet' }`, then `signal-back` | Work item goes terminal (`complete`) — `unmet` is not itself a failure. Router mints a FRESH work item on the SAME scope at that step's `routes.unmet`, scoped to EXACTLY the unmet units, grouped by originating piece. No new operation item ever appears | `next-action-transformer.test.ts` | P1 | |
| OR-17 | At any step, mark what you can, then `outcome: { word: 'wall', reason: '<made-up wall>' }`, then `signal-back` | Router answers `{ kind: 'block', reason: 'wall' }`. `quest-block-on-failure-broker` marks the item `failed` (`errorMessage` = your reason), drains every pending item to `skipped`, quest → `blocked` IMMEDIATELY. `get-next-step` now returns `idle` for this quest | none — live-only for the UI half | P1 | |
| OR-18 | From the blocked quest in OR-17, click **RESUME** | `quest-resume-rearm-work-items-transformer` returns every work item on an unfinished scope to `pending`, `retryCount: 0`, KEEPING `sessionId`/the `resume` marker. The SAME step re-dispatches — not a fresh scope | `orchestration-resume-responder` unit tests | P1 | |
| OR-19 | Introduce a real ward-catchable defect (a TS error or failing test) in a git-changed file on the quest branch, let the family's own `ward` step run for real | `ward` work item `failed`, `declaredWord: 'unmet'`, a `wardResults[]` entry (exitCode ≠ 0) appended. Router mints a `repair` item on the SAME scope (`spiritmender` prompt, sonnet) — it declares NO `done` route, so once it signals `done` it RETURNS as a fresh `ward` item, which re-verifies. Never two `ward` rows back to back | `quest-route-scope-broker.integration.test.ts` | P1 | |
| OR-20 | Repeat OR-19's defect so `ward ⇄ repair` cycles past `maxVisits: 3` on that scope | Instead of another `repair`, router answers `{ kind: 'block', reason: 'max-visits' }`. Failed row `FAILED`; skipped rows hidden; no terminal banner (`blocked` ≠ terminal); RESUME visible | none — live-only | P1 | |
| OR-21 | **Riftcarver arm A (repairable)** — point `.dungeonmaster.json`'s `devServer.buildCommand` at a failing command, start a dispatcher | `carve` → `unmet` (errorMessage names the failing step) → `repair` (same scope, `spiritmender`) dispatched INSIDE the worktree → fresh `carve` on `done`. Restore `buildCommand` afterward | `worktree-prepare-step-statics.test.ts` classifications | P1 | |
| OR-22 | **Riftcarver arm B (git-state)** — break base-branch detection (no `main`/`master` resolvable in the repo) | Quest → `blocked` IMMEDIATELY, no `repair`, git error verbatim on the failed row, **no agent dispatched** anywhere (there is no worktree to dispatch into) | same | P1 | |
| OR-23 | **Riftcarver arm C (permission)** — `chmod -w worktrees/` | Immediate block regardless of which riftcarver step hit it — permission overrides the step's own classification | same | P1 | |
| OR-24 | **Riftcarver arm D (resume)** — from OR-22 or OR-23, fix the environment, click RESUME | Rearm returns `carve` to `pending`; quest re-dispatches it. A RESUME that visibly does nothing is the regression | `orchestration-resume-responder` unit tests | P1 | |
| OR-25 | Mid-step, kill the server process (or `pkill` the dispatched Claude child) | On the next scan, `recover-orphaned-work-items-layer-broker` flips the orphaned `in_progress` item to `pending`, KEEPS `sessionId`/`agentId`, sets a `resume` marker, bumps `retryCount`. Node dispatch resumes via `claude --resume` — NOT a fresh spawn, NOT a duplicate work item | `dispatch-resumes-retained-session.e2e.ts` reads the resumed child's real argv | P2 | |
| OR-26 | Watch `happyWalk → adversarial` on a siegemaster scope with ≥2 happy pieces | The FIRST `adversarial` piece is minted only after EVERY happy piece has drained — confirm no adversarial row appears while a happy piece is still `RUNNING` | `quest-route-scope-broker.integration.test.ts` phase-order test | P1 | |
| OR-27 | Force a siegelense lane to fail to boot (e.g. exhaust available ports before a `happyWalk`/`adversarial` step starts) | The step's own session (or its fixer) reports and repairs it like any other finding — it must NOT read as an environment `wall`. `SIEGE-1` in `docs/quest-role-paths.md` | none — live-only | P1 | |

### Pause / Resume

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-28 | Mid-run, click **PAUSE** (`EXECUTION_PAUSE_BUTTON`) | In-flight children finish; no NEW dispatch starts. Button visibility keys off REAL `quest.status`, not `displayStatus` — `paused` shows RESUME only, never both buttons | none — live-only | P1 | |
| OR-29 | Click **RESUME** (`EXECUTION_RESUME_BUTTON`) on a paused (not blocked) quest | `pausedAtStatus` restores; dispatch resumes the next scan; no rearm needed here (rearm is the `blocked`-only path, OR-18) | `orchestration-resume-responder` unit tests | P2 | |

### Lazy scopes and the in-scope set

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-30 | Immediately after Start Quest (before any dispatcher runs), read `quest.json` | ONLY the riftcarver scope exists. No `codeweaver`/`flowrider`/`siegemaster`/`wardFull` item anywhere — those mint only when the family graph routes to them | `smoketest-mcp-orchestration.md` "Flow 0" | P1 | |
| OR-31 | Mid-quest, after codeweaver has started but before flowrider is minted, add a NEW observable to an existing runtime flow node via `modify-quest` | When flowrider's scopes are later minted, the new observable is covered — because the fan-out reads the flows AS THEY STAND when routed to, not as they stood at approval | none — live-only | P1 | |
| OR-32 | On any `review`/`happyWalk`/`adversarial` step, compare its `assignedUnitIds` (via `get-quest-work({ questId, workItemId })`) against the scope's full unit set | A reviewer/walker is assigned the WHOLE in-scope set filtered by `stepScopeStatics.byFamilyStep`, never one piece's slice — that's what makes the signal gate and the in-scope gate the same check | `step-in-scope-units-transformer.test.ts` | P2 | |

### Parallel selector, instances and capacity

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-33 | Seed a codeweaver `work` step with ≥2 pieces (per `playbook/smoketest-mcp-orchestration.md` §7), call `get-next-step` | `NextStep` is `spawn-agents` carrying MULTIPLE agents — all sharing the SAME role AND SAME step. Never a batch mixing two steps or two families | `select-batch-layer-broker.test.ts` | P1 | |
| OR-34 | Drive a flowrider scope with ≥5 pieces carrying a `browser` unit | At most 4 run at once (`maxConcurrent: { limit: 4, counts: 'browser-pieces' }`) — the 5th waits for a slot. This is a machine-load cap on Playwright, unrelated to siegelense capacity | `agent-flow-statics.test.ts` pins the literal | P2 | |
| OR-35 | Watch a siegemaster `happyWalk`/`adversarial` step start | The ROUTER provisions a siegelense lane (API server + Vite + optional Chromium) BEFORE dispatching, and kills it once the work item records — confirm via `dungeonmaster siegelense status` that no lane survives an idle scope | none — live-only | P1 | |
| OR-36 | Try to force two different steps (or two different families) to dispatch in the same `get-next-step` batch by hand-seeding both `pending` with no `dependsOn` between them | `select-batch-layer-broker` throws — the batch selector admits only items sharing ONE role and ONE step. This should never be reachable through ordinary router traffic | `select-batch-layer-broker.test.ts` throw case | P3 | |

### MCP tool — `quest-work`

Args: `{ questId, workItemId, payload }`. `payload.kind` is one of six, `.strict()` discriminated union
(`packages/mcp/src/contracts/quest-work-input/quest-work-input-contract.ts`).

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-37 | Call `quest-work` with `payload: { kind: 'plan', plan: {...} }` on a `planner`-role work item | Accepted; pieces + batches land in `<questFolder>/planned-work/<operationItemId>.json`, not in `quest.json` | `quest-work-plan-write-broker` unit tests | P2 | |
| OR-38 | `payload: { kind: 'observations', observations: [{ unitId, mark: 'met', evidence: '<file:line>' }] }` | One `UnitObservation` appended to the work item's `observations[]` — this session's own set, never amending another work item's | `quest-work-record-broker` unit tests | P2 | |
| OR-39 | `payload: { kind: 'observations', observations: [{ unitId, mark: 'cant-meet', evidence: '...' }] }` — omit `toSettle` | **Refused** — `.strict()` `observationsPayloadContract` requires `toSettle` when `mark === 'cant-meet'` | `unit-observation-contract.test.ts` | P2 | |
| OR-40 | Same call, `mark: 'met'`, but INCLUDE a `toSettle` | **Refused** — `toSettle` is only legal on `cant-meet` | same | P2 | |
| OR-41 | `payload: { kind: 'outcome', word: 'unmet', reason: '<why>' }` on a step holding NO assigned units (e.g. a planner) | Accepted — a step with no units declares its own word; `reason` is required on all four words | `quest-work-input-contract.test.ts` | P2 | |
| OR-42 | `payload: { kind: 'amendment', reason: '<what changed>', plan: {...} }` | Accepted — a WHOLE replacement plan, never a patch; router re-reads the plan instead of marching down the stale one | none — live-only | P2 | |
| OR-43 | On a siegemaster work item, `payload: { kind: 'invalidation', flowId: '<id>', reason: '<what changed underneath>' }` | Accepted, appends a `walk-reset` quest note, unions the flow's units onto the NEXT work item the router mints for that scope. Try the SAME call from a codeweaver work item | **Refused** for any non-siegemaster caller — throws naming that the calling item's family must resolve to `siegemaster` | none — live-only | P1 | |
| OR-44 | `payload: { kind: 'request', step: 'recipe', reason: '<why blocked>' }` from a flowrider or siegemaster work item | Router mints `recipe` (mintableOnRequest), returns to the asker on `done`/`empty`. Try `step: 'work'` (not `mintableOnRequest`) | second call refused — "Must be mintableOnRequest" | `quest-work-input-contract.test.ts` | P2 | |

### MCP tool — `get-quest-work`

Args: exactly one of `workItemId` / `operationItemId` (`.strict()` + `superRefine`).

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-45 | Call with `{ questId, workItemId }` on a real, dispatched work item | Returns family, step + role, scope, assigned units + current marks, piece, prior sessions' notes, flow rendered, the uncommitted file list (`git diff HEAD` unioned with untracked), a failing ward's detail if present, and the lane if the step declares one | `get-quest-work-input-contract.test.ts` | P2 | |
| OR-46 | Call with `{ questId, operationItemId }` on a scope that has a submitted plan | Returns the WHOLE plan as raw markdown (not JSON) — batches in execution order, each piece's claimed units, and a coverage table naming every in-scope unit no piece claims | same | P2 | |
| OR-47 | Call with BOTH `workItemId` AND `operationItemId` | **Refused** — "operationItemId cannot be combined with workItemId... Pass exactly one" | `get-quest-work-input-contract.test.ts` | P2 | |
| OR-48 | Call with NEITHER | **Refused** — "pass either workItemId... or operationItemId... There is no whole-quest browse form" | same | P2 | |

### MCP tool — `signal-back`

Args: `{ questId, workItemId, signal: 'complete', operationItemId?, blockedReason? }`, `.strict()`.

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-49 | Mark every assigned unit via `quest-work`, then `signal-back({ questId, workItemId, signal: 'complete' })` | Work item goes terminal. `complete` is the SOLE signal kind | `signal-back-input-contract.test.ts` | P2 | |
| OR-50 | Call `signal-back` with an EXTRA key `operationStatus: 'done'` | **Refused** — `.strict()` rejects unrecognized keys. This is the field the step engine removed; the subagent-stop hook message no longer tells agents to send it (`subagent-stop-block-message-statics.test.ts`) | `signal-back-input-contract.test.ts` (both the MCP and server copies) | P2 | |
| OR-51 | Call `signal-back` with `operationStatus: 'partial'` | **Refused**, same reason — `partial` is gone, no `pt N` continuation exists any more | same | P2 | |
| OR-52 | On a work item with 2 assigned units, mark only ONE via `quest-work`, then `signal-back` | **Throws**, naming the unmarked unit. Nothing is persisted — mark the remaining unit and re-call; it now succeeds | `signal-gate-transformer.test.ts` | P1 | |
| OR-53 | Call `signal-back` twice for the same, now-terminal work item | Second call is a no-op (idempotent redelivery) — it does not re-route or re-mint anything | `quest-handle-signal-back-responder.test.ts` | P2 | |
| OR-54 | Call `signal-back` with `blockedReason: '<text>'` on a session that is NOT declaring `wall` | Accepted (optional field) — confirm it does not, by itself, block the quest; only a `quest-work` `outcome: 'wall'` does that | `signal-back-input-contract.test.ts` | P3 | |

### MCP tool — `get-next-step`

Args: `{}` (`.strict()`, no fields — `getNextStepInputContract.parse({ unexpected: 'no' })` throws
`/Unrecognized key/`).

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-55 | Call `get-next-step()` while a `prompt`-kind step is ready | `{ type: 'spawn-agents', agents: [{ questId, role, workItemId, taskPrompt, model }] }` — one entry per ready item sharing the batch's role+step | `quest-get-next-step-broker` unit tests | P2 | |
| OR-56 | Call `get-next-step()` while a `deterministic`-kind step (ward/carve/repair/commit/cleanup) is ready | `{ type: 'run-step', questId, workItemId, handler, args }` — via `/dumpster-launch` this means: tell the user, STOP the loop | same | P2 | |
| OR-57 | With the Node dispatcher PLAYING on `/queue`, call `get-next-step()` from a separate `/dumpster-launch` session | `{ type: 'idle', reason: '<...>' }` — MCP mode is locked out while `dispatch-state.json` says `node-playing`; report the reason and stop, do not poll | `dispatch-state-play-gate-broker.test.ts` | P1 | |
| OR-58 | Call `get-next-step()` on a queue with nothing dispatchable | Long-polls ~25s, then `{ type: 'idle' }` with no `reason` | same | P3 | |

### MCP tool — `get-agent-prompt`

Args: `{ agent, questId, workItemId? }` — `workItemId` required for a relay role, refused for a minion.

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-59 | Call with `{ agent: 'codeweaver-worker', questId, workItemId }` on a real `work` work item | Returns `{ name, model: 'sonnet', prompt }`. `model` matches `agentFlowStatics.codeweaver.steps.work.model`. Work item flips `pending → in_progress`, `sessionId`/`agentId` stamped | `agent-prompt-get-broker.test.ts` | P2 | |
| OR-60 | Call with `{ agent: 'chaoswhisperer-gap-minion', questId }` — NO `workItemId` | Returns the minion's prompt + Quest ID only, no work-item context block | same | P2 | |
| OR-61 | Call a RELAY ROLE name (e.g. `codeweaver-worker`) with NO `workItemId` | **Throws** — a role omitting `workItemId` is refused | `agent-prompt-get-broker.test.ts` | P2 | |
| OR-62 | Call the MINION name (`chaoswhisperer-gap-minion`) WITH a `workItemId` (even its parent's) | **Throws, BY NAME** — refused specifically because a minion carrying a `workItemId` would be held open by `subagentStopNeedsBlockGuard` until it signals on its PARENT's scope | same | P1 | |
| OR-63 | Call `get-agent-prompt({ agent: 'codeweaver', questId, workItemId })` — the bare, RETIRED family name | **Throws**: `Unknown agent prompt name: 'codeweaver'. No prompt is registered for it in AGENT_PROMPTS — check agentPromptClassificationStatics.promptNames and this table still agree.` Repeat for `'flowrider'` and `'siegemaster'` | `agent-name-to-prompt-transformer.test.ts` (`UNSERVED_PROMPT_NAMES`) | P1 | |
| OR-64 | For EVERY served step name — `codeweaver-planner/worker/reviewer`, `flowrider-planner/worker/reviewer`, `siege-planner`, `siege-happy-walker`, `siege-adversarial-walker`, `siege-happy-fixer`, `siege-adversarial-fixer`, `siegemaster-reader`, `recipe-maker`, `spiritmender`, `warpgate` — call `get-agent-prompt` against a real work item at that step and confirm it resolves (no throw) | Every name in `agentPromptClassificationStatics.promptNames` minus the three retired ones serves real text | `agent-name-to-prompt-transformer.test.ts` covers this in isolation; a LIVE dry run per step is what `packages/orchestrator/CLAUDE.md` rule 5 asks for and nothing automated does end to end | P1 | |
| OR-65 | Dispatch a `happyWalk`/`adversarial` step (needsLane) and read its served prompt | Prompt carries an extra substituted **Instance ID** absent from every other step's prompt | none — live-only | P2 | |

### The model each step spawns on (`bd05d9e85`)

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-66 | Cross-check `get-agent-prompt`'s `model` field against `agentFlowStatics` for a spot sample: `codeweaver.plan`=opus, `codeweaver.work`=sonnet, `codeweaver.review`=opus, `flowrider.work`=sonnet, `siege-planner`=opus, `siege-happy-walker`=sonnet, `repair`(spiritmender)=sonnet, `warpgate.merge`=opus, `wardFull.repair`=sonnet | Every one matches. Also confirm via `/dumpster-launch`: it must pass `model: agent.model` on every `Task()` call (`.claude/commands/dumpster-launch.md:12`) — a session spawned via Node mode reads the identical field off `SpawnInstruction.model` | `agent-flow-statics.test.ts` pins the literals; `agent-prompt-get-broker.test.ts` checks reporting agrees with dispatch | P2 | |

### Server boot — graph reachability

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-67 | In a scratch worktree (`create-worktree`), remove one route from `agentFlowStatics` (e.g. delete `codeweaver.steps.review.routes.done`) so `review`'s `done` has no home, then run `npm run dev` there | Server THROWS at boot, before any listener starts — the violation names the step and family. Restore the file afterward; `packages/local-eslint`'s own `graph-reachability` ESLint rule should ALSO flag the same edit at lint time, without running the server at all | `graph-reachability-boot-flow.integration.test.ts`, `graph-reachability-check-broker.test.ts`, `rule-graph-reachability-broker.test.ts` | P2 | |
| OR-68 | Run `npm run ward -- --only lint -- packages/orchestrator/src/statics/agent-flow packages/shared/src/statics/quest-flow` on the CURRENT (unmodified) graphs | Clean — this is the regression watch for OR-67, confirming the checked-in graphs still pass both the lint rule and server boot | same | P3 | |

### Backward compatibility — old quest.json shapes still load

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-69 | Hand-edit a quest's `quest.json`: add `"operationStatus": "partial"` onto one `workItems[]` entry, then `get-quest` (MCP) or reload the quest page | Quest still LOADS — `workItemContract` is a plain `z.object({...})`, not `.strict()`, so the unknown key is silently stripped on parse. `questContract` is likewise not `.strict()` | `work-item-contract.ts` (no `.strict()` — read the file); `consolidated-plan-handoff.md`'s design-leftovers note makes the same claim for `designPort`/`needsDesign` | P2 | |
| OR-70 | Hand-edit a work item's `step` to a name no family declares (e.g. `"step": "glyphsmith-review"`) | Quest still LOADS — `stepNameContract` is an open branded string, not a closed enum (story 03). `get-next-step`/dispatch is where it fails, LOUDLY, naming the step and family — never a silent no-op | `03-step-name-contract.md` acceptance table | P1 | |

### Removed surfaces

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-71 | List MCP tools available in a connected session (or read `mcpToolsStatics.tools.names`) | No `run-ward`, no `run-riftcarver`, no `run-ward-next-step`/`run-riftcarver-next-step` anywhere. 24 tools total | `mcp-tools-statics.test.ts` (full-value `toStrictEqual`) | P3 | |
| OR-72 | Seed a command-role (`ward`/`riftcarver`) work item with NO `step` field, call `get-next-step` | It is filtered OUT of `ready` before a dispatch decision is made — never reaches `spawn-agents` or a fallback tool. `get-next-step` returns `idle` (or moves to the next ready item) rather than surfacing this one | `compute-next-step-from-quest-layer-broker.test.ts` | P1 | |
| OR-73 | Grep the running UI / `agentRoleContract` / role dropdowns for `glyphsmith` | Absent everywhere — role, chat prompt, design-prefix handling all deleted | none — live-only spot check | P3 | |
| OR-74 | Walk a quest's full status lifecycle (OR-01) and confirm the status list | Never see `explore_design`, `review_design`, or `design_approved` at any point — those statuses, and the design sandbox they served, are gone | `quest-status-transitions-statics.test.ts` | P3 | |
| OR-75 | Seed a codeweaver `work` step, dispatch it, at signal time DO NOT commit — call `signal-back` with a dirty worktree | Succeeds (once units are marked) — there is no commit-before-signal gate any more; `commit` is a deterministic STEP the router runs after `review`, never a session's own act | `signal-gate-transformer.test.ts`'s negative-space assertion (2.6 in the orchestrator playbook) | P2 | |

### Smoketest catalog

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-76 | `curl GET http://<host>:<port>/api/tooling/smoketest/state` with the server started WITHOUT `TOOLING_SMOKETEST_HTTP` set | 200 — this route registers unconditionally | `tooling-flow.integration.test.ts` | P3 | |
| OR-77 | `curl -X POST .../api/tooling/smoketest/run -d '{"suite":"mcp"}'` against the SAME unflagged server | 404 — the route is not registered at all when the flag is unset, by design (no in-handler gate to bypass) | same | P2 | |
| OR-78 | Restart the server with `TOOLING_SMOKETEST_HTTP=1`, then `curl -X POST .../run -d '{"suite":"mcp"}'` | 200; spawns real Claude subprocesses, one per registered MCP tool (skipping any flagged `skip-from-suite` in `smoketestProbeArgsStatics`, e.g. `start-quest`) | `smoketest-case-catalog-statics.test.ts` | P2 | |
| OR-79 | Same, `{"suite":"orchestration"}` | Drives the real dispatch + `signal-back` routing against the two scenarios in `smoketestScenariosStatics`: `orchHappyPath` (asserts `quest-status: complete`) and `orchReachesFlowrider` (also asserts ≥1 `flowrider` work item) — a real, live exercise of the family graph with canned agents | `smoketest-scenarios-statics.test.ts` (shape only, not a live run) | P1 | |
| OR-80 | Poll `GET .../state` while OR-79 runs | Reflects `active: true` and streams recent events; a SECOND `POST .../run` call while one is active is refused until the last smoketest quest drains (`DrainListenerLayerResponder`) | none — live-only | P2 | |

### Driving the loop by hand — `/dumpster-launch`

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| OR-81 | With the Node dispatcher PAUSED, run `/dumpster-launch` against an `in_progress` quest sitting at a `prompt` step | Loop calls `get-next-step()`, dispatches ALL listed agents in parallel via `Task`, passing `model: agent.model` on each, awaits all, loops | none — live-only | P1 | |
| OR-82 | Let the same loop reach a `deterministic` step | It reports "quest is waiting on a deterministic step (`<handler>`) that only the Node dispatcher can run" and STOPS the loop — it must NOT keep polling or attempt the step itself | `.claude/commands/dumpster-launch.md` is the spec; no automated test drives the slash command live | P1 | |

## Known open items

- **`scrolls/orcha-changes/HANDOFF.md` is stale in at least two places, verified against current
  `master`.** It lists "restore the graph check at server boot" as owed — `packages/server/src/startup/start-server.ts:15,32` already calls `GraphReachabilityBootFlow()`. It also flags
  `orch-codeweaver-partial` in `smoketest-scenarios-statics.ts` as dead — that file currently declares
  only `orchHappyPath` and `orchReachesFlowrider`; the stale scenario is already gone. Treat the rest of
  that file's "Owed" section with the same skepticism and re-verify before acting on it.
- **`CLOSE_OUT.repair` (shared by codeweaver/flowrider/siegemaster) declares no `done` route.**
  HANDOFF.md flags this as "reachable, untested" for a `no-minter` block, reasoning that only
  `wardFull`/`riftcarver`'s OWN `repair` (which declares `done: 'commit'`) are exercised by the current
  gate/repair fixpoint tests. OR-19 exercises the shared `CLOSE_OUT.repair` path directly — watch
  closely for a `{ reason: 'no-minter' }` block instead of the expected return-to-`ward` behavior.
- **Check 19 in the plan validation ("a walk piece whose path needs a seeded system names a recipe")**
  has no definition of "needs a seeded system" anywhere in the codebase — named in the contract, never
  emitted (`scrolls/orcha-changes/HANDOFF.md`).
- **`unitIdContract` and `qaChecklistItemIdContract`** are byte-identical validation under separate
  brands, paying a re-parse at every boundary — a possible dedup, not a bug (same source).

## Sources

`docs/quest-role-paths.md` · `packages/orchestrator/CLAUDE.md` · `scrolls/orcha-changes/00-CHAIN.md` +
`HANDOFF.md` + stories `01`–`28` · `scrolls/orchestrator-step-engine-plan.md` (§§1–8) ·
`scrolls/consolidated-plan-handoff.md` · `playbook/smoketest-orchastrator.md` ·
`playbook/smoketest-mcp-orchestration.md` · `playbook/smoketest-mcp-handoff.md` ·
`playbook/quest-lifecycle.md` · `packages/orchestrator/src/statics/agent-flow/agent-flow-statics.ts` ·
`packages/shared/src/statics/quest-flow/quest-flow-statics.ts` ·
`packages/mcp/src/contracts/{quest-work-input,get-quest-work-input,get-agent-prompt-input,signal-back-input}/` ·
`packages/orchestrator/src/statics/smoketest-{case-catalog,scenarios,probe-args}/` ·
`packages/server/src/startup/start-server.ts` · `.claude/commands/dumpster-launch.md`.

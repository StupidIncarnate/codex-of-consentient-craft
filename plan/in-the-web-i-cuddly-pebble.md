# Tooling Dropdown Smoketests — Current State

## Why this exists (product context)

The web UI has **no diagnostic surface** today. When orchestration misbehaves the only way to investigate
is spelunking logs and JSONL files. The **Tooling** dropdown on the main page runs
live-system smoketests covering the three most load-bearing contracts:

1. **MCP** — a spawned agent can reach the orchestrator's MCP server and call each of the 16 tools in
   `mcpToolsStatics.tools.names`. This is the contract between *any* agent and the host — every role
   depends on it, every minion depends on it. If MCP is broken, nothing works.
2. **Signals** — an agent can emit `complete`, `failed`, `failed-replan` via `signal-back` and the
   orchestrator's FAILURE_ROLE_MAP + depth limiter route them correctly. This is the contract between
   an agent and the orchestration loop. If signaling is broken, agents can't tell the orchestrator
   they finished or failed.
3. **Orchestration** — the full work-item loop drives each role end-to-end, including failure
   routing, drain+skip+replan, retry depth exhaustion, and blightwarden's `failed-replan` path. This
   is the contract the whole system lives or dies on.

Each tile is a "is this surface alive right now, in this repo, with this config?" check —
runnable from the web UI in one click, producing a structured pass/fail rollup. A failing
tile localizes the break: MCP red means the MCP server or the agent's permissions are broken;
signals red means `signalFromStreamTransformer` isn't extracting or routing correctly; orchestration
red means the work-item loop diverged from expected routing.

## Key design decisions (why, not what)

### Real `claude` CLI — not the mock harness

The testing package has a mock claude at `packages/testing/test/harnesses/claude-mock/bin/claude`
for jest integration tests. The smoketests use **real claude** because:

- The whole point is "is this alive, right now, against the real binary and real MCP?"
- The mock is jest-lifecycle-only; exposing it to a web endpoint would require a second runner
  and leak test-only plumbing into production.
- Real claude with a tiny override prompt is cheap and fast. "Call tool X once, then signal
  complete." finishes in a few seconds.

### Canned override prompts — not real role templates

Each role's normal prompt is a thousand-line template full of system instructions. The smoketest
agent does ONE deterministic thing via `smoketestPromptOverride`, an optional field on work items

+ work units. When present, `agentSpawnByRoleBroker` substitutes it for
  `roleToPromptTemplateTransformer(...).replace('$ARGUMENTS', ...)` entirely — no continuation
  context, no argument substitution. Tiny, deterministic, reproducible.

The override is propagated from `workItem` → `workUnit` via `buildWorkUnitForRoleTransformer`
for every role (codeweaver, lawbringer, siegemaster, blightwarden, pathseeker, spiritmender). Each
role's layer broker passes `workItem.smoketestPromptOverride` into the build call so retry-spawned
workItems (stamped mid-run by the scenario driver) also spawn with the canned prompt.

Siegemaster's dev-server preflight + build lifecycle is short-circuited when
`workItem.smoketestPromptOverride` is set — the canned prompt just signals-back, it never touches
the dev server, and running the real preflight would self-collide on port 4750.

### Prompts are statics

`packages/orchestrator/src/statics/smoketest-prompts/` holds the prompt bank:

- `signalComplete`, `signalFailed`, `signalFailedReplan` — tell the agent to emit a specific signal.
- 16 `callMcp<Tool>` probes — for each MCP tool, "call tool X with valid args, then signal complete".
- `siegeVerifyDevServer` — authored for a future siegemaster happy-path case; not currently wired.

Prompts as statics means they're typed, linted, and their names flow through the system as
`SmoketestPromptName` (a `keyof typeof smoketestPromptsStatics` derivation).

### Hardcoded nil-ish UUIDs for quest/guild IDs

`smoketestStatics.questId = '00000000-0000-0000-0000-000000000000'`,
`smoketestStatics.guildId = '00000000-0000-0000-0000-000000000001'`. Lets MCP tool probe
prompts (e.g. `get-quest`) reference a known-constant ID without runtime templating. Trade-off:
the tool may legitimately return "not found" — which is fine, it still proves the tool was
callable. For orchestration cases, the responder creates/reuses a real `__smoketests` guild via
`smoketestEnsureGuildBroker` and passes the actual guild id into `smoketestRunOrchestrationCaseBroker`
(the hardcoded guild id is still referenced by MCP prompts but does not need to be allocated).

### The hydrator exists to lock us to the gate statics (regression defense)

The orchestration suite needs a quest past PathSeeker with workItems generated, without actually
running PathSeeker. The hydrator walks `modify-quest` through every status transition
(created → explore_flows → ... → in_progress), producing a valid quest.

The **load-bearing property** is the colocated regression tests: for every quest status in
`questStatusInputAllowlistStatics`, every entry in `questGateContentRequirementsStatics.gates`, and
every transition in `questStatusTransitionsStatics`, the hydrator's `quest-hydrate-strategy-statics`
must have a coverage entry. If a gate changes, the hydrator tests turn red and force an update.
This makes the hydrator a living smoke test for the gate configuration itself.

The hydrator's `in_progress` branch injects a **pre-completed pathseeker work item** at the head
of the generated chain so that `stepsToWorkItemsTransformer`'s codeweaver `dependsOn: [pathseekerId]`
wiring is satisfied. Without this item, `nextReadyWorkItemsTransformer` reports zero ready items
and the orchestration loop exits immediately with `blocked=true`.

### Work-item graph filtering (`skipRoles` + `workItemsSkipRolesTransformer`)

Smoketest scenarios use `skipRoles: ['ward']` on the blueprint — the transformer drops items by
role AND transitively rewires `dependsOn` so downstream items depend on the skipped item's
predecessors. This applies only to the initial chain produced at hydrate time. Retry chains
inserted dynamically at runtime do NOT inherit this skip rule, so blightwarden-replan can insert
a real ward work item that actually runs `npm run ward` against the repo. That behavior is
intentional — a passing ward inside the smoketest is a valuable integration check.

### Bottom-right icon button, root-page-only

`AppWidget` conditionally renders the Tooling button on `!isSessionRouteGuard(pathname)` — you
only see it on `/`, not on quest-chat routes. The button is a 36px square `IconTool` in a
`position: fixed` wrapper at `bottom: 16, right: 16, zIndex: 1000` so it floats above the
map frame without consuming layout space. When a run is active, the icon swaps to a spinning
`IconLoader2` and the opacity dims; clicking it while running reopens the drawer instead of
starting a second suite (via the `onReopen` prop; `smoketest.open` is wired in).

### Drawer on the right for results

`SmoketestDrawerWidget` is a Mantine Drawer (right side, size "lg"). Each case renders as a
`[verified]` (green) or `[failed]` (red) row — verified means the agent emitted the case's
`expectedSignal`, not that the signal was literally `complete`. Below each row is a dim
summary line (signal summary on verified, error detail on failed) and a `<pre>` block with
the last few lines of the agent's captured stream output so non-deterministic behavior is
inspectable without tailing server logs. The drawer header shows `runId`, a progress counter
`(N/M)`, and while running a `Now: <case name>` indicator that clears on case-complete.

### Live progress via WebSocket

The web POSTs `/api/tooling/smoketest/run` and awaits the full result, AND subscribes to
`smoketest-progress` WS messages to stream per-case updates as they complete. The
orchestrator emits `smoketest-progress` events to `orchestrationEventsState`; the server's
existing event relay loop iterates `orchestrationEventTypeContract.options` and forwards every
non-outbox event (including `smoketest-progress`) over WS without any special-casing. The
binding (`useSmoketestRunBinding`) owns a persistent WS connection, listens for
`phase: 'started' | 'case-started' | 'case-complete' | 'complete'` payloads, and upserts each
case result by `caseId` via `mergeSmoketestCaseResultTransformer`. The POST response is the
final authoritative list and overwrites any WS-driven results by caseId when it resolves, so
nothing is lost if WS drops mid-run. The server still exposes `/api/tooling/smoketest/state`
for future drawer-restore-on-reload; the binding does not poll it yet.

### Scenario driver (coordinated retry scripting)

The orchestration suite exercises the work-item loop across roles, including failure routing and
retries. A codeweaver-fail case spawns a codeweaver, then (on `failed`) the orchestration loop
inserts a pathseeker replan work item dynamically, then spawns that pathseeker, then (on pathseeker
complete) the loop re-inserts a codeweaver-retry. Those *dynamically spawned* workItems don't
exist at hydration time, so the hydrator can't pre-stamp them with overrides. The **scenario
driver** solves this at runtime.

The driver subscribes to `quest-modified` on `orchestrationEventsState` AND runs a periodic
re-sweep at 250ms intervals (because `quest-modified` is emitted via the file outbox, not the
in-memory bus, so the subscription is a no-op in practice). An initial sweep runs once after
subscribe, awaited before `startQuest` kicks the orchestration loop, so all items present at
hydrate time are stamped before any agent dispatches. For each sweep: load quest, find pending
work items without an override, call `dispense` (via `smoketestScenarioState.dispense`) to get
the next scripted prompt name for that role, stamp via `smoketestStampOverrideBroker`.

`smoketestStampOverrideBroker` acquires `questWithModifyLockBroker`, reads the quest, mutates
one work item's `smoketestPromptOverride`, persists atomically. Bypasses `questModifyBroker`
because `workItems` isn't in any status's `allowedFields`. Idempotent — no-ops if already stamped.

Brokers are state-agnostic: they take injected `subscribe`/`unsubscribe`/`dispense`/`register`/
`unregister`/`startQuest` callbacks. The responder (which can import `state/`) wires
`orchestrationEventsState.on/off`, `smoketestScenarioState.dispense/register/unregister`, and the
inline orchestration-loop bootstrap.

### Terminal detection for the poll broker

`smoketestPollQuestUntilTerminalBroker` polls the quest file every 250ms. It treats the quest as
terminal if EITHER `quest.status ∈ {complete, blocked, abandoned}` OR every work item is in a
terminal status (`complete | failed | skipped`). The workItems-terminal fallback is required
because the orchestration loop's internal "all items done" state doesn't always transition
`quest.status` — the happy path case legitimately reaches `quest.status === 'complete'`, but
failure+replan scenarios (codeweaver-fail, lawbringer-fail, depth-exhaustion, blightwarden-replan)
can leave `quest.status` as `in_progress` even when every work item has reached a terminal state.

All three detector branches — initial check, 250ms periodic tick, and the `quest-modified`
event handler — pass BOTH `status` and `workItems` to `isSmoketestPollTerminalStatusGuard`.
Earlier only the periodic tick omitted `workItems`, so failure-routing scenarios would time
out at 300s instead of detecting that every work item had drained to terminal. That's why
only the happy path ever confirmed end-to-end before the fix.

### Verified/failed semantics per case (`expectedSignal`)

Each non-orchestration case in `smoketestCaseCatalogStatics` carries an `expectedSignal` field
(`'complete' | 'failed' | 'failed-replan'`). `smoketestRunSingleAgentCaseBroker` reads it and
computes `passed = actualSignal === expectedSignal`. This makes the Signals suite coherent:
`signal-failed` expects the agent to emit `failed` and is `verified` when it does; same for
`signal-failed-replan`. Previously the broker hardcoded `passed = signal === 'complete'` which
marked those successful verifications as red. The MCP suite all expect `'complete'`.

The case result contract has an `output?: AgentOutput` field populated with the last 5
lines of `capturedOutput` from the agent's stream for every case (verified OR failed). The
drawer renders it as a `<pre>` block so non-deterministic agent behavior is inspectable
from the UI without tailing server logs.

### ToolSearch preamble in MCP/Signal prompts

Claude CLI's new deferred-tools mechanism hides MCP tools from the initial tool list. The
agent has to call `ToolSearch` with `select:<tool-name>` to load tool schemas before
invoking them. Every prompt in `smoketestPromptsStatics` therefore begins with a ToolSearch
step: `1) Call ToolSearch with { "query": "select:mcp__dungeonmaster__<tool>,mcp__dungeonmaster__signal-back", ... }`.
Without this preamble the agent reports "tools not available" and exits without signaling.

### Repo-root startPath (not process.cwd)

`ToolingSmoketestRunResponder` resolves `startPath` via `configRootFindBroker` (walks up to
the nearest `.dungeonmaster.json`) rather than using `process.cwd()` directly. The server is
launched by npm's workspace runner which sets cwd to `packages/server/`. A spawned Claude
subprocess with cwd=`packages/server/` cannot discover `.mcp.json` (which lives at the repo
root), so the dungeonmaster MCP server fails to attach and every MCP tool call reports
"tools not available". Using `configRootFindBroker` (not `projectRootFindBroker`, which stops
at the first `package.json` — i.e. the workspace package itself) gives the Claude subprocess
the correct repo-root cwd.

### Single-active-run state cleanup (try/finally)

`SmoketestRunResponder` wraps its entire body in `try { ... } finally { smoketestRunState.end(); }`.
The flag otherwise leaks on any throw from `smoketestEnsureGuildBroker` / contract parse /
etc., causing every subsequent POST to 409 until server restart.

### Claude model plumbing (available but unused)

A `ClaudeModel` contract (`'haiku' | 'sonnet' | 'opus'`) and plumbing through
`childProcessSpawnStreamJsonAdapter` → `agentSpawnUnifiedBroker` → `agentSpawnByRoleBroker`
supports an optional `--model` flag per spawn. No caller currently sets it — smoketests and
real roles both use Claude CLI's configured default. An earlier experiment hardcoded
`model: 'haiku'` for smoketest overrides but Haiku doesn't reliably follow the
ToolSearch-first instruction for MCP tool use, so it was reverted. The threading stays so a
future caller can opt in per-role or per-override-presence without another adapter change.

## Architecture sketch (how it all fits)

```
User clicks Tooling (bottom-right icon) → Smoketests → Orchestration
    ↓
Mantine Menu item onClick → useSmoketestRunBinding.run({ suite: 'orchestration' })
    ↓   (binding also has a persistent WS for `smoketest-progress` streaming)
toolingRunSmoketestBroker → POST /api/tooling/smoketest/run { suite }
    ↓
ToolingSmoketestRunResponder → configRootFindBroker (startPath=repo root) → orchestratorRunSmoketestAdapter → StartOrchestrator.runSmoketest
    ↓
SmoketestFlow.run → SmoketestRunResponder  (wrapped in try/finally so smoketestRunState.end() always clears)
    ├─ mcp / signals cases → smoketestRunSingleAgentCaseBroker (expectedSignal per case) → agentSpawnByRoleBroker (codeweaver stub workUnit w/ override)
    └─ orchestration cases → smoketestEnsureGuildBroker (once) → smoketestRunOrchestrationCaseBroker per scenario:
         ↓ questHydrateBroker({ blueprint, guildId })           — walks modify-quest created → in_progress
         ↓ smoketestScenarioState.register({ questId, scripts })
         ↓ smoketestScenarioDriverBroker({ questId, subscribe, unsubscribe, dispense })   — async; awaits initial sweep
         ↓ (inline) startQuest → registers OrchestrationProcess → questOrchestrationLoopBroker (fire-and-forget)
         ↓ smoketestPollQuestUntilTerminalBroker({ questId, timeoutMs: 300000, subscribe, unsubscribe })
         ↓ smoketestAssertFinalStateBroker({ quest, assertions })
         ↓ smoketestRunTeardownChecksBroker({ checks })           — optional, when scenario has postTeardownChecks
         ↓ buildCaseResultLayerBroker                             — composes SmoketestCaseResult
         ↓ finally: driver.stop(); unregister; smoketestTeardownQuestBroker
    ↓
All results aggregated → response to POST → resolves promise in web
    ↓
SmoketestDrawerWidget re-renders with results
```

### Key files

- **Web entry points:**
  `packages/web/src/widgets/app/app-widget.tsx` (fixed bottom-right tooling slot + drawer)
  `packages/web/src/widgets/tooling-dropdown/tooling-dropdown-widget.tsx` (36px icon button, menu position `top-end`,
  `onReopen` when running)
  `packages/web/src/widgets/smoketest-drawer/smoketest-drawer-widget.tsx` (verified/failed rows + output block +
  progress)
  `packages/web/src/bindings/use-smoketest-run/use-smoketest-run-binding.ts` (persistent WS + incremental results)
  `packages/web/src/brokers/tooling/run-smoketest/tooling-run-smoketest-broker.ts`
  `packages/web/src/transformers/merge-smoketest-case-result/merge-smoketest-case-result-transformer.ts` (upsert by
  caseId)
- **Server:**
  `packages/server/src/flows/tooling/tooling-flow.ts`
  `packages/server/src/responders/tooling/smoketest-run/tooling-smoketest-run-responder.ts` (resolves repo-root
  startPath)
  `packages/server/src/responders/server/init/server-init-responder.ts` (WS relay loop — forwards `smoketest-progress`
  events unchanged)
  `packages/server/src/transformers/dev-log-generic-event-format/dev-log-generic-event-format-transformer.ts` (
  suite/phase/case/verified-FAILED formatting)
  `packages/server/src/adapters/orchestrator/run-smoketest/orchestrator-run-smoketest-adapter.ts`
- **Orchestrator — flow/responder/flag plumbing:**
  `packages/orchestrator/src/startup/start-orchestrator.ts` (exposes `.runSmoketest()`)
  `packages/orchestrator/src/flows/smoketest/smoketest-flow.ts`
  `packages/orchestrator/src/responders/smoketest/run/smoketest-run-responder.ts` (try/finally cleanup; emits `name` on
  case-started)
  `packages/orchestrator/src/brokers/agent/spawn-by-role/agent-spawn-by-role-broker.ts`
  `packages/orchestrator/src/contracts/claude-model/` (threading for optional `--model` flag; currently unused)
- **Orchestrator — single-agent case runner:**
  `packages/orchestrator/src/brokers/smoketest/run-single-agent-case/`
- **Orchestrator — scenario driver + support:**
  `packages/orchestrator/src/brokers/smoketest/run-orchestration-case/`
  `packages/orchestrator/src/brokers/smoketest/scenario-driver/`
  `packages/orchestrator/src/brokers/smoketest/stamp-override/`
  `packages/orchestrator/src/brokers/smoketest/poll-quest-until-terminal/`
  `packages/orchestrator/src/brokers/smoketest/assert-final-state/`
  `packages/orchestrator/src/brokers/smoketest/run-teardown-checks/`
  `packages/orchestrator/src/brokers/smoketest/teardown-quest/`
  `packages/orchestrator/src/brokers/smoketest/ensure-guild/`
  `packages/orchestrator/src/state/smoketest-run/`
  `packages/orchestrator/src/state/smoketest-scenario/`
- **Orchestrator — hydrator:**
  `packages/orchestrator/src/brokers/quest/hydrate/quest-hydrate-broker.ts`
  `packages/orchestrator/src/brokers/quest/hydrate/build-hydrate-input-layer-broker.ts`
  `packages/orchestrator/src/statics/quest-hydrate-strategy/quest-hydrate-strategy-statics.ts`
- **Orchestrator — role propagation:**
  `packages/orchestrator/src/transformers/build-work-unit-for-role/build-work-unit-for-role-transformer.ts`
  `packages/orchestrator/src/brokers/quest/orchestration-loop/run-{codeweaver,lawbringer,siegemaster,blightwarden,pathseeker,spiritmender}-layer-broker.ts`
- **Orchestrator — prompts, scenarios, catalog, blueprint, contracts:**
  `packages/orchestrator/src/statics/smoketest/smoketest-statics.ts`
  `packages/orchestrator/src/statics/smoketest-prompts/smoketest-prompts-statics.ts`
  `packages/orchestrator/src/statics/smoketest-case-catalog/smoketest-case-catalog-statics.ts`
  `packages/orchestrator/src/statics/smoketest-blueprints/smoketest-blueprints-statics.ts`
  `packages/orchestrator/src/statics/smoketest-scenarios/smoketest-scenarios-statics.ts`
  `packages/orchestrator/src/contracts/{smoketest-assertion,smoketest-teardown-check,smoketest-scenario,scenario-instance,quest-blueprint,active-smoketest-run}/`
- **Orchestrator — transformers:**
  `packages/orchestrator/src/transformers/flows-strip-observables/`
  `packages/orchestrator/src/transformers/work-items-skip-roles/`
- **Orchestrator — adapters for teardown checks:**
  `packages/orchestrator/src/adapters/net/check-port-free/`
  `packages/orchestrator/src/adapters/process/signal/`
- **Shared contracts:**
  `packages/shared/src/contracts/smoketest-suite/`
  `packages/shared/src/contracts/smoketest-case-result/` (+ optional `output: AgentOutput`)
  `packages/shared/src/contracts/smoketest-run-id/`
  `packages/shared/src/contracts/work-item/work-item-contract.ts` (+ optional `smoketestPromptOverride`)
  `packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts` (+
  `'smoketest-progress'`, `'quest-persisted'`)

## Done

### Shared contracts (packages/shared)

- `smoketest-suite/` — `SmoketestSuite` enum (`'all' | 'mcp' | 'signals' | 'orchestration'`)
- `smoketest-case-result/` — `SmoketestCaseResult` with optional `output: AgentOutput` for the tail of the agent's
  captured stream text
- `smoketest-run-id/` — `SmoketestRunId` branded UUID
- `work-item/work-item-contract.ts` — extended with optional `smoketestPromptOverride: PromptText`
- `orchestration-event-type/` — added `'smoketest-progress'` and `'quest-persisted'` event types
- `contracts.ts` barrel updated

### Orchestrator (packages/orchestrator)

- `contracts/quest-blueprint/` —
  `questContract.pick({...}).extend({ targetStatus?, skipRoles, fixedQuestId?, rolePromptOverrides })`
- `contracts/work-unit/work-unit-contract.ts` — each per-role variant extended with optional `smoketestPromptOverride`
- `contracts/active-smoketest-run/` — contract for the tracked active run
- `contracts/smoketest-assertion/` — discriminated union (`quest-status`, `work-item-status-histogram`,
  `work-item-role-count`)
- `contracts/smoketest-teardown-check/` — discriminated union (`port-free`, `process-gone`)
- `contracts/smoketest-scenario/` — `{ caseId, name, blueprint, scripts, assertions, postTeardownChecks? }`
- `contracts/scenario-instance/` — `{ scripts, callOrdinals }` for the runtime scenario state
- `transformers/work-items-skip-roles/` — drops items by role, rewires `dependsOn` transitively
- `transformers/flows-strip-observables/` — strips observables from flows for the `no-observables` transition
- `transformers/build-work-unit-for-role/` — includes `smoketestPromptOverride` conditionally in the output per role
  variant
- `statics/quest-hydrate-strategy/` — per-status walk map + walkPath + exhaustive regression tests (coverage against
  `questStatusInputAllowlistStatics`, `questStatusTransitionsStatics`, `questGateContentRequirementsStatics`)
- `statics/smoketest/` — fixed IDs (`guildId`, `questId`, `guildName`, `defaultTimeoutMs`, `orchestrationCaseTimeoutMs`)
- `statics/smoketest-prompts/` — prompt bank: `signalComplete`, `signalFailed`, `signalFailedReplan`, 16 `callMcp<Tool>`
  probes, `siegeVerifyDevServer`. Every MCP/signal prompt begins with a `ToolSearch` call using `select:<tool-name>` to
  surface the deferred MCP tools before invoking them.
- `statics/smoketest-case-catalog/` — per-suite case list (`mcp` + `signals` with `promptKey` + `expectedSignal`;
  `orchestration` references 5 full scenarios from `smoketestScenariosStatics`)
- `statics/smoketest-blueprints/` — hand-crafted minimal-but-valid blueprint that hydrates to `in_progress` with
  codeweaver/siegemaster/lawbringer/blightwarden work items; `skipRoles: ['ward']`; integration test proves hydrator
  walk
- `statics/smoketest-scenarios/` — 5 orchestration scenarios: `orchHappyPath`, `orchCodeweaverFail`,
  `orchLawbringerFail`, `orchDepthExhaustion`, `orchBlightwardenReplan`
- `state/smoketest-run/` — singleton for active run + event buffer
- `state/smoketest-scenario/` — per-quest scenario state (register/dispense/unregister/getActive) with concurrency gate
- `brokers/quest/hydrate/quest-hydrate-broker.ts` + `build-hydrate-input-layer-broker.ts` — walks modify-quest to
  targetStatus, replaces workItems at in_progress with filtered+stamped chain, injects pre-completed pathseeker at head
- `brokers/agent/spawn-by-role/agent-spawn-by-role-broker.ts` — substitutes `smoketestPromptOverride` when present
- `brokers/agent/spawn-unified/agent-spawn-unified-broker.ts` +
  `adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.ts` — thread optional
  `model: ClaudeModel` into the Claude CLI `--model` flag
- `contracts/claude-model/` — `'haiku' | 'sonnet' | 'opus'` contract + stub + colocated tests
- `brokers/smoketest/run-single-agent-case/` — spawns a single claude agent with override, reads `expectedSignal` to
  decide `passed`, always populates `output` (tail of capturedOutput) whether verified or failed
- `brokers/smoketest/run-orchestration-case/` + `build-case-result-layer-broker` — full per-scenario pipeline
- `brokers/smoketest/scenario-driver/` + `create-driver-handler-layer-broker` +
  `smoketest-sweep-pending-work-items-layer-broker` — async factory that awaits initial sweep, subscribes to
  `quest-modified`, periodic 250ms re-sweep
- `brokers/smoketest/stamp-override/` — read-under-lock, mutate one work item's override, persist atomically
- `brokers/smoketest/poll-quest-until-terminal/` + `create-poll-handler-layer-broker` +
  `load-quest-by-id-layer-broker` — 250ms polling + subscribe; terminal if quest.status ∈ {complete, blocked, abandoned}
  OR all work items terminal. All three detection branches (initial check, periodic tick, event handler) pass `status`
  AND `workItems` to the terminal guard; the earlier miss on the periodic tick was what blocked every failure-routing
  scenario from detecting termination.
- `brokers/smoketest/assert-final-state/` — evaluates assertion list, returns `{ passed, failures }`
- `brokers/smoketest/run-teardown-checks/` — evaluates port-free + process-gone
- `brokers/smoketest/teardown-quest/` — deletes quest + unregisters scenario (idempotent)
- `brokers/smoketest/ensure-guild/` — checks `guildListBroker` for `__smoketests`, creates via `guildAddBroker` if
  missing; returns actual guildId
-
`brokers/quest/orchestration-loop/run-{codeweaver,lawbringer,siegemaster,blightwarden,pathseeker,spiritmender}-layer-broker.ts` —
propagate `workItem.smoketestPromptOverride` into `buildWorkUnitForRoleTransformer` so retry-spawned items also spawn
with the canned prompt; siegemaster short-circuits build/dev-server preflight when override is set
- `guards/is-smoketest-poll-terminal-status/` — accepts `complete | blocked | abandoned`, plus the workItems-terminal
  fallback via the extended signature
- `responders/smoketest/run/` — wraps the whole body in `try { … } finally { smoketestRunState.end(); }` so the
  active-run flag always clears; branches on suite; wires state callbacks for orchestration cases; ensures
  `__smoketests` guild; emits `smoketest-progress` events (case-started payloads include `name` so the UI can render
  `Now: <case-name>`)
- `responders/smoketest/state/` — returns current active run + events
- `flows/smoketest/smoketest-flow.ts` — `SmoketestFlow.run()` + `SmoketestFlow.getState()`
- `startup/start-orchestrator.ts` — exposes `StartOrchestrator.runSmoketest()` + `.getSmoketestState()`
- Adapters: `net-check-port-free` (binds a server to probe port), `process-signal` (wraps `process.kill(pid, signal)`)

### Server (packages/server)

- `statics/api-routes/api-routes-statics.ts` — added `tooling.smoketestRun` + `tooling.smoketestState` routes
- `statics/http-status/http-status-statics.ts` — added `clientError.conflict = 409`
- `adapters/orchestrator/run-smoketest/` — pass-through to `StartOrchestrator.runSmoketest`
- `adapters/orchestrator/get-smoketest-state/` — pass-through to `StartOrchestrator.getSmoketestState`
- `responders/tooling/smoketest-run/` — validates `suite`, resolves `startPath` via `configRootFindBroker` (repo root,
  not `process.cwd()`), 409 on concurrent, 500 on other errors
- `responders/tooling/smoketest-state/` — returns current state
- `flows/tooling/tooling-flow.ts` — Hono sub-app registering POST/GET routes
- `startup/start-server.ts` — mounts `ToolingFlow()`
- `transformers/dev-log-generic-event-format/` — extended to format `suite`, `phase`, `case`, `verified`/`FAILED`, and
  `passed:N/total` fields from smoketest-progress events

### Web (packages/web)

- `statics/web-config/web-config-statics.ts` — added `toolingSmoketestRun` + `toolingSmoketestState` routes
- `brokers/tooling/run-smoketest/` — POSTs via `fetchPostAdapter`, parses result through `smoketestRunIdContract`
- `bindings/use-smoketest-run/` — React hook exposing
  `{ opened, running, runId, total, currentCase, results, open, close, run }`; owns a persistent WS connection that
  subscribes to `smoketest-progress` messages and upserts per-case results as they arrive (pre-POST-resolve); POST
  response merges as the final authoritative list
- `transformers/merge-smoketest-case-result/` — upsert-by-caseId used by both the WS path and the POST resolve
- `widgets/tooling-dropdown/` — 36px `IconTool` icon button (spins `IconLoader2` while running); Mantine `Menu` with
  items (All, MCP, Signals, Orchestration) + `position="top-end"` so the menu opens above the button; clicking the
  button while running calls `onReopen` instead of opening the menu; testids `TOOLING_DROPDOWN_TRIGGER`,
  `TOOLING_SMOKETEST_<SUITE>`
- `widgets/smoketest-drawer/` — Mantine `Drawer` with progress counter `(N/M)`, `Now: <case-name>` row while running,
  and per-case `[verified]` (green) / `[failed]` (red) rows followed by summary/errorMessage + `<pre>` block of captured
  agent output; reuses `emberDepthsThemeStatics`
- `widgets/app/app-widget.tsx` — tooling slot is a `position: fixed` wrapper at `bottom: 16, right: 16, zIndex: 1000` (
  gated on `!isSessionRouteGuard(pathname)`); mounts the drawer and passes `total`/`currentCase` through

### Ward status

Full `npm run ward` passes green across all 13 packages (lint, typecheck, unit, integration, e2e).

## Smoke test observations

Empirical results from running each suite against a live dev server (`npm run dev` from repo root, port 4751):

- **Signals suite (3 cases)** — all three render as `[verified]` (green). `signal-failed` and
  `signal-failed-replan` now pass because `expectedSignal` per case matches the scripted
  signal, not a hardcoded `'complete'`. Drawer shows summary + `Signaled.` output tail.
- **MCP suite (16 cases)** — 11/16 verified against the fixed prompts + repo-root startPath;
  the last 5 hit the Claude usage rate limit (`"You've hit your limit · resets 12pm"`) and
  reported `[failed]` with that error text in the drawer output block. Not a code defect —
  16 sequential Claude sessions burn through the daily quota.
- **Orchestration happy-path case** — still shows `final-status=complete` after all 4 roles
  (codeweaver, siegemaster, lawbringer, blightwarden) complete in sequence.
- **Orchestration failure-path cases** — not yet re-validated since the poll-broker fix; the
  terminal-detection bug that made them time out has been fixed but a live run is still
  required to confirm end-to-end.

## Failure modes already debugged (root causes documented)

- **"MCP tools not available in deferred tool list"** on every MCP case → the spawned
  Claude subprocess's cwd was `packages/server/` (npm workspace behavior) instead of the
  repo root, so `.mcp.json` wasn't discovered. Fixed: responder resolves `startPath` via
  `configRootFindBroker`. Prompts also now explicitly call `ToolSearch` first to surface
  the deferred MCP tools.
- **Signals suite shown as 1 green + 2 red** → the broker hardcoded `passed = signal === 'complete'`.
  Fixed: `expectedSignal` per case.
- **Failure-path orchestration cases time out at 300s** → the periodic poll tick was
  missing `workItems` in its terminal check. Fixed: all three detection branches now pass
  `workItems`.
- **Drawer "No run yet" + "Running…" overlap** → rendered unconditionally. Fixed: both rows
  gated on their relevant state.
- **Disabled button while running** → user could not reopen the drawer after closing it
  mid-run. Fixed: button stays clickable, click while running calls `onReopen` instead of
  opening the menu.

## What is left to do

- **Orchestration suite — full verification.** Only the happy-path case has been confirmed
  end-to-end. `orchCodeweaverFail`, `orchLawbringerFail`, `orchDepthExhaustion`,
  `orchBlightwardenReplan` still need a live run to confirm the poll-broker fix actually
  unblocks their termination path and their assertions pass.
- **Claude rate-limit mitigation for full-suite runs.** A 16-case MCP run burns enough
  tokens to hit the daily limit. Options: prompt caching (re-bill the session startup once
  per run instead of per-case), Haiku (currently unreliable at MCP tool use even with the
  ToolSearch preamble — revisit), or splitting the MCP suite into batches. The
  `ClaudeModel` plumbing is in place for whichever path wins.
- **Drawer restore on reload.** The `/api/tooling/smoketest/state` endpoint exists but the
  binding does not poll it. A full-reload mid-run loses drawer state.
- **Playwright e2e.** Not written.
- **Siegemaster subcase wiring.** The `siegeVerifyDevServer` prompt is authored in the prompts
  bank but NOT yet referenced by any scenario's scripts. A future scenario could exercise
  `runSiegemasterLayerBroker`'s real dev-server lifecycle (it currently short-circuits when an
  override is present) + port-free/process-gone teardown checks.

## Manual smoke test (sequence)

### Prerequisites

- A working `claude` CLI on PATH (the user has this — they use Claude Code).
- Dependencies installed: `npm install` in repo root.

### Sequence

1. **Build everything:**
   ```bash
   npm run build
   ```

2. **Run full ward:**
   ```bash
   npm run ward
   ```
   Must be green.

3. **Start the dev server** (root-only; never workspace-scoped):
   ```bash
   npm run dev
   ```
   Dev binds to `devServer.port` (default 4750 server / 4751 web preview).

4. **Open Chrome to the web UI:**
    - URL: `http://dungeonmaster.localhost:4751/`
    - Expect:
        - Pixel-art dungeon theme page loads.
        - Bottom-right of the viewport there is a 36px square icon button (wrench icon, ember-depths styled, testid
          `TOOLING_DROPDOWN_TRIGGER`).
        - The button is NOT visible on any `/:guildSlug/quest/...` route.

5. **Click the Tooling icon:**
    - Expect: Mantine menu opens above the button with label "Smoketests" and four items: "All", "MCP", "Signals", "
      Orchestration". Each has testid `TOOLING_SMOKETEST_<SUITE_UPPERCASE>`.

6. **Click "Signals" (3 cases, fastest):**
    - Right-side drawer opens ("Smoketest Results" title). Header shows `runId: …`, `Running… (0/3)`, and
      `Now: Signal: complete` while the first case runs. The icon button spins.
    - After ~30-90 seconds, three `[verified]` (green) rows appear: `Signal: complete`, `Signal: failed`,
      `Signal: failed-replan`. Each has a dim summary line and a small `<pre>` block with `Signaled.` tail.
    - Status flips to `Idle (3/3)` in green.

7. **Close drawer, click Tooling → MCP (16 cases):**
    - Drawer opens and shows up to 16 rows over ~5-7 minutes as cases stream in via WebSocket.
    - `Now: MCP: <case>` updates each case-start; per-case rows append as case-completes fire.
    - Expected: 16 `[verified]`. Rate-limit `[failed]` rows at the tail are not a code bug.

8. **Close drawer, click Tooling → Orchestration (5 scenarios):**
    - Drawer opens for the full 5-scenario suite. Each scenario hydrates a fresh quest, runs the
      real orchestration loop against scripted prompts, polls to terminal, runs assertions, tears
      the quest down.
    - Case 5 (blightwarden-replan) will actually run `npm run ward` (via command spawner) as part
      of its retry chain; expect ~100s for that step.

9. **Click the Tooling icon while a run is active:**
    - The icon is spinning and dimmed. Clicking re-opens the drawer if it was closed; it does NOT start a second run.
      The server also returns 409 if the endpoint is hit directly while one is active.

10. **Navigate to a guild's quest route** (e.g. click a guild, then a session):
    - The Tooling icon is NOT shown on the quest route (only on the root home page).

### If something breaks

- **No icon visible on root page:** inspect browser console for React errors. Check
  `AppWidget` renders `ToolingDropdownWidget` under `!isQuestRoute`. Verify you're at `/` and
  not a guild sub-route.
- **Click does nothing:** check network tab — `POST /api/tooling/smoketest/run` should fire.
  If 404, the server didn't register the route (check `start-server.ts` mounts `ToolingFlow()`).
  If 500, check server logs.
- **Every case fails with "tools not available / ToolSearch returned no matches":** the
  spawned Claude subprocess is running with the wrong cwd and cannot find `.mcp.json`. Check
  the dev log for the responder's resolved `startPath` and that it matches the repo root.
  `configRootFindBroker` walks up to `.dungeonmaster.json`; if that file is missing or
  renamed, resolution fails.
- **Every case fails with "Agent exited without emitting a signal":** `claude` CLI may not
  be on PATH, or rate-limited. Verify `claude --version` runs and check the `output` block
  in the drawer row — a rate-limit message there is not a code bug.
- **Signals row shows `[failed]` instead of `[verified]`:** `expectedSignal` on the case
  catalog entry doesn't match the scripted prompt. Check
  `smoketestCaseCatalogStatics.signals` — `signal-failed` should have `expectedSignal: 'failed'`.
- **Failure-path orchestration case times out at 300s:** the poll broker's terminal check
  is missing `workItems` on one of its branches. Verify all three branches (initial,
  interval, handler) pass both `status` AND `workItems` to `isSmoketestPollTerminalStatusGuard`.
- **Drawer stuck on "Running…":** the broker rejected after state was set. Most likely the
  try/finally in `SmoketestRunResponder` didn't fire (a throw outside the try block, or
  `smoketestEnsureGuildBroker` throwing synchronously). Restart the dev server to clear
  `smoketestRunState`.

## Reminders

- **`npm run dev` / `npm run prod` are root-only.** Never a workspace-scoped form, never
  `cd packages/<pkg> && npm run dev`. The root script handles kill/ports/env; bypassing it
  silently produces wrong-cwd bugs (that's exactly how MCP discovery broke for smoketests).
- **Always `npm run build` before `npm run ward`** — cross-package typecheck needs `dist/` up to date.
- **NEVER `cd` into a package for ward** — run from repo root with `-- packages/<name>` passthrough.
- **Always pass `timeout: 600000`** to Bash when running ward (full ward takes 3-4 min).
- **Never use `rm -rf` without asking** (triggers permission prompts).
- **Don't edit `.claude/settings.json`, `.mcp.json`, or `.env*` directly** — modify the install logic.
- **Lint rules to watch (these keep biting):**
    - Type alias with `readonly string[] | { caseId: string }` triggers ban-primitives.
    - `if`/ternary inside test bodies is banned — pre-compute at module scope.
    - `toHaveLength` is banned — use `toStrictEqual` on the full array or `.length).toBe(n)`.
    - Flow files need `.integration.test.ts`, not `.test.ts`.
    - Proxies must import every corresponding child proxy for imports in the implementation.
    - Responder exports must be `PascalCase` (incl. the proxy function).
    - `String(x)` where `x` is already string is banned — use a template literal or just `x`.
    - `brokers/` cannot import `state/` — use injected callbacks (the scenario-driver and poll
      broker take `subscribe`/`unsubscribe`/`dispense` as injected params; the responder wires
      the real state modules).
    - Self-import of `@dungeonmaster/orchestrator` from within the orchestrator package fails at
      tsc (circular build resolution).
- **Build cycle:** after editing shared contracts, run `npm run build --workspace=@dungeonmaster/shared`. After editing
  orchestrator exports, `npm run build --workspace=@dungeonmaster/orchestrator`.

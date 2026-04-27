# Quest-ID Routing Refactor

## Context

Three user-facing bugs all trace back to one architectural mistake — the live web surface keys on `sessionId` while every quest has N sessions (one per agent: codeweaver, lawbringer, pathseeker, etc):

- **BUG-INLINE-STREAMING** (image #1): no THINKING/tool entries appear in execution-panel accordions during streaming. Live chat-output emits drop because the page can't route them by sessionId reliably (slot-manager learns sessionId asynchronously; smoketest fake-CLI may never emit one). Replay only fires once per session and gets deduped, so completed work items only ever show partial-snapshot entries.
- **F5 → fresh chat panel** (image #2): server `quest-by-session-request` only matches `quest.activeSessionId === sessionId`. Non-active work-item sessions and completed quests (whose `activeSessionId` is undefined at terminal) all return `quest-by-session-not-found`, dropping the user into a readonly fallback chat panel.
- **WS errors in console** (image #3): React StrictMode double-mount × 4 WS connections per page = 4 "WebSocket is closed before connection established" warnings. Cosmetic, parallel cleanup, not in scope here.

Switching live routing to `questId` collapses these symptoms. Sessions stay on the wire as metadata for per-workitem bucketing inside the binding; the routing key becomes `questId`. Sessions get a first-class readonly viewer for debugging individual JSONL files (parent OR sub-agent).

The hotload mechanism the user wants (first message creates quest + spawns chaoswhisperer immediately) **already exists** in `chatSpawnBroker` (`packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.ts:110-117`): when called with no sessionId/questId, it calls `questUserAddBroker` to create the quest, fires `onQuestCreated({ questId })`, then directly spawns the Claude CLI via `agentSpawnUnifiedBroker`. The execution-queue runner is bypassed for the spec phase. No new orchestrator wiring needed for hotload itself — only the URL/WS routing changes around it.

## Concurrency model (confirmed)

- A guild can have many quests; many can be `pending` in the queue at once.
- Exactly **one quest is `in_progress` at a time** across the whole runner — `quest-execution-queue-state` is cross-guild FIFO, single runner, head-of-queue gets the active loop.
- The user can have N tabs each on a different `/:guildSlug/quest/:questId`. Each subscribes independently. Tabs on non-active quests display queued state until their quest reaches the head.

## URL model

| Route | Mounts | Purpose | Live? |
|---|---|---|---|
| `/` | `HomeContentWidget` | Guild list + sessions list (unchanged) | yes |
| `/:guildSlug/quest` | `QuestChatWidget` (no questId) | New chat — first message creates quest, server returns questId, page replace-navigates to `/:guildSlug/quest/:questId` | yes |
| `/:guildSlug/quest/:questId` | `QuestChatWidget` (with questId) | Live quest workspace — subscribes by questId, renders execution panel + chat | yes |
| `/:guildSlug/session/:sessionId` | new `SessionViewWidget` (~30 lines) | Readonly raw JSONL viewer for ANY session — parent or sub-agent (sub-agents are already listed on the home screen) | no |
| **deleted** | `/:guildSlug/session`, live `/:guildSlug/session/:sessionId`, `/:guildSlug/quest/:sessionId` (mis-named param) | — | — |

The same `QuestChatWidget` mounts both `/:guildSlug/quest` and `/:guildSlug/quest/:questId`. Branches on `useParams().questId` presence — no-id state = chat input panel awaiting first message; with-id state = subscribed live workspace.

## Wire protocol — complete event-type plan

Audit of all 13 outbound `orchestrationEventTypeContract` types and 3 inbound `wsIncomingMessageContract` types:

### Outbound — per-quest scoped (9 types, gain `questId`+`workItemId` and route via subscription)

| Event | Emit sites | Today's payload | New payload | Plumbing |
|---|---|---|---|---|
| `chat-output` | 9 sites: `chat-start-responder.ts:91, 142, 182`; `chat-replay-responder.ts:33`; `design-chat-start-responder.ts:47`; `run-orchestration-loop-layer-responder.ts:110`; `orchestration-resume-responder.ts:174`; `recover-guild-layer-responder.ts:150`; `quest-modify-responder.ts:82` | `{ chatProcessId, entries, sessionId? }` | `{ questId, workItemId, chatProcessId, entries, sessionId? }` | Loop responders already have questId in scope. Slot manager already knows workItemId per slot. chat-start-responder captures questId in closure from `onQuestCreated`. chat-replay-responder does quest lookup BEFORE replay (already does it after — just reorder). design-chat-start-responder takes questId as input. |
| `chat-complete` | 3 sites: `chat-start-responder.ts:204`; `design-chat-start-responder.ts:88`; `chat-replay-responder.ts:69` | `{ chatProcessId, exitCode, sessionId }` | `{ questId, workItemId, chatProcessId, exitCode, sessionId }` | Same closures as above. |
| `chat-session-started` | 2 sites: `chat-start-responder.ts:128`; `design-chat-start-responder.ts:54` | `{ chatProcessId, sessionId }` | `{ questId, workItemId, chatProcessId, sessionId }` | Same. **Note:** web doesn't currently consume this event — the sessionId reaches the work item via `quest-modified` from the outbox instead. Could be deleted entirely; safer to keep + tag for now. |
| `chat-history-complete` | 1 site: `chat-replay-responder.ts:69` | `{ chatProcessId, sessionId }` | `{ questId, workItemId, chatProcessId, sessionId }` | quest lookup result already in scope. |
| `clarification-request` | 1 site: `chat-start-responder.ts:104` | `{ chatProcessId, questions }` | `{ questId, chatProcessId, questions }` | questId from chat-start closure. |
| `quest-modified` | outbox watcher in `server-init-responder.ts:290-310` | `{ questId, quest }` | unchanged | Already keyed by questId — only the broadcast filter changes. |
| `quest-created` | outbox watcher (via `questPersistBroker`) | `{ questId, quest }` | unchanged | Same as quest-modified. |
| `quest-session-linked` | 3 sites: `chat-start-responder.ts:84`; `chat-replay-responder.ts:55`; `design-chat-start-responder.ts:41` | `{ questId, chatProcessId, role? }` | unchanged | Already has questId. |
| `chat-patch` | **none** (zero emit sites — dead code) | `{ toolUseId, agentId }` (defined but unused) | **delete entirely** | Web handler `use-session-chat-binding.ts:156-173` deleted in stage 6. Convergence happens in orchestrator pre-emission per orchestrator/CLAUDE.md. |

### Outbound — global (3 types, stay broadcast-to-all)

| Event | Emit sites | Why global |
|---|---|---|
| `execution-queue-updated` | `execution-queue-bootstrap-responder.ts:101, 125` | Queue state changes affect every guild's view of the cross-guild runner — every connected client needs to refetch. |
| `execution-queue-error` | `execution-queue-bootstrap-responder.ts:108` | Queue runner crashed — global error banner. |
| `smoketest-progress` | `smoketest-run-responder.ts:39, 46, 59, 66` | Smoketest lifecycle is its own operational stream, independent of any one quest. |

### Outbound — direct-send response (1 type, not affected by subscription model)

| Event | Where |
|---|---|
| `quest-by-session-not-found` | `server-init-responder.ts:123, 149` — sent only to the requesting client in response to inbound `quest-by-session-request`. Goes away when that inbound type is dropped (stage 7). |

### Inbound (`wsIncomingMessageContract`)

| Type | Today's handler | Refactor action |
|---|---|---|
| `replay-history` | `server-init-responder.ts:83-113` | **Keep.** Readonly `SessionViewWidget` uses it to load any session's JSONL on demand. |
| `quest-by-session-request` | `server-init-responder.ts:115-156` | **Delete in stage 7.** No live consumer once URL is questId-keyed; readonly viewer doesn't need quest correlation. |
| `ward-detail-request` | `server-init-responder.ts:157-192` | **Keep.** Already questId-scoped. |
| `subscribe-quest { questId }` | new | Add to clientSubscriptions; immediately fire replay-on-subscribe. |
| `unsubscribe-quest { questId }` | new | Remove from clientSubscriptions. |
| `replay-quest-history { questId }` | new | Walk `quest.workItems[]`, replay each non-empty JSONL via existing `chatHistoryReplayBroker`, emit chat-output frames tagged with questId+workItemId. |

## Server changes

| File | Action |
|---|---|
| `packages/server/src/responders/server/init/server-init-responder.ts` | Rewrite WS lifecycle: `clientSubscriptions: Map<WsClient, Set<QuestId>>` replaces `clients: Set<WsClient>`. Per-quest event handlers route by `payload.questId` and only forward to subscribed clients. Global events (`execution-queue-updated`, `execution-queue-error`, `smoketest-progress`) keep broadcast-to-all. New inbound handlers for `subscribe-quest`/`unsubscribe-quest`/`replay-quest-history`. Drop `processRoleMap` (chat-output payloads now carry workItemId — role derivable from quest). Drop `quest-by-session-request` handler in stage 7. Pipeline buffer (100ms slot batching) preserved but routes per-questId. |
| `packages/server/src/contracts/ws-incoming-message/ws-incoming-message-contract.ts` | Add `subscribe-quest`, `unsubscribe-quest`, `replay-quest-history` discriminated variants. Drop `quest-by-session-request` in stage 7. |
| `packages/server/src/contracts/chat-output-payload/chat-output-payload-contract.ts` | Add `questId: questIdContract`, `workItemId: questWorkItemIdContract` (both required after stage 1). |
| `packages/server/src/responders/quest/new/quest-new-responder.ts` (new) | `POST /api/guilds/:guildId/quests/chat` with `{ message }` — calls `orchestratorStartChatAdapter({ guildId, message })`, returns `{ questId, chatProcessId }`. Single round-trip: creates quest + spawns chaoswhisperer. |
| `packages/server/src/responders/quest/chat/quest-chat-responder.ts` (new) | `POST /api/quests/:questId/chat` — loads quest, decides chat-start vs resume vs clarify-answer, delegates to existing orchestrator adapters. |
| `packages/server/src/responders/quest/clarify/quest-clarify-responder.ts` (new) | `POST /api/quests/:questId/clarify` — moves clarify off session-scoped URL. |
| `packages/server/src/responders/session/{chat,new,clarify}/...` | Delete in stage 7. |
| `packages/server/src/flows/quest/...` | Add new responder routes; remove session ones. |
| `packages/server/src/statics/api-routes/api-routes-statics.ts` | Add `quests.new`, `quests.chat`, `quests.clarify`. Drop `sessions.new`, `sessions.chat`, `sessions.clarify` in stage 7. |
| `packages/server/src/brokers/session/list/session-list-broker.ts` | Walk `quest.workItems[]` collecting all sessionIds for the home Sessions panel (Bug #8 unblock — needed for completed-smoketest sessions to appear). |

## Orchestrator changes

| File | Action |
|---|---|
| `packages/orchestrator/src/contracts/chat-output-emit-payload/chat-output-emit-payload-contract.ts` | Add required `questId`, required `workItemId`. |
| `packages/orchestrator/src/transformers/build-orchestration-loop-on-agent-entry/build-orchestration-loop-on-agent-entry-transformer.ts` | Accept `questId` + `workItemId`, stamp on payload. |
| `packages/orchestrator/src/responders/execution-queue/bootstrap/run-orchestration-loop-layer-responder.ts` | Pass `questId` (already in scope) + slot's `workItemId` (from slot manager) into transformer. |
| `packages/orchestrator/src/responders/orchestration/resume/orchestration-resume-responder.ts` | Same plumbing change — uses the same transformer. |
| `packages/orchestrator/src/responders/orchestration/startup-recovery/recover-guild-layer-responder.ts` | Same. |
| `packages/orchestrator/src/responders/quest/modify/quest-modify-responder.ts` | Same. |
| `packages/orchestrator/src/responders/chat/replay/chat-replay-responder.ts` | Reorder: do quest lookup BEFORE the chat-output emit loop (lookup at line 47-66 already happens, just runs after). Stamp `questId`+`workItemId` on chat-output / chat-history-complete / quest-session-linked payloads. |
| `packages/orchestrator/src/responders/chat/start/chat-start-responder.ts` | Capture questId from `onQuestCreated` closure (already fires at `chatSpawnBroker:115`). Stamp on every subsequent `orchestrationEventsState.emit` in the responder (chat-output, chat-complete, chat-session-started, clarification-request, quest-session-linked). For workItemId: chaoswhisperer work item is created at quest-add time — look up after `onQuestCreated`. |
| `packages/orchestrator/src/responders/design-chat/start/design-chat-start-responder.ts` | questId is already a required input; workItemId from glyphsmith work item lookup. Stamp on all four emits. |
| `packages/orchestrator/src/brokers/slot-manager/orchestrate/...` | Verify `onAgentEntry` callback already passes workItemId — if not, plumb through. |

## Web changes

### New bindings/widgets/brokers

| File | Purpose |
|---|---|
| `packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts` (new) | Owns the live workspace: opens WS, sends `subscribe-quest`, accumulates per-workitem entries from chat-output frames, exposes `sendMessage`, replay-on-subscribe handled server-side. Replaces both `use-session-chat-binding` (live half) and `use-quest-events-binding`. |
| `packages/web/src/bindings/use-session-replay/use-session-replay-binding.ts` (new) | Readonly: opens WS, sends `replay-history { sessionId }`, accumulates entries, no input/clarify/stop surface. Extracted from `use-session-chat-binding`'s replay path (lines 186-244). |
| `packages/web/src/widgets/session-view/session-view-widget.tsx` (new, ~30 lines) | Thin composer: reads `useParams().sessionId`, mounts `useSessionReplayBinding`, renders existing `<ChatPanelWidget entries readOnly />`. **Reuses** existing `readOnly` mode on `ChatPanelWidget` (`widgets/chat-panel/chat-panel-widget.tsx:34, 52, 123`) — does NOT fork. |
| `packages/web/src/flows/session-view/session-view-flow.tsx` (new) | One Route: `/:guildSlug/session/:sessionId` → `<SessionViewWidget />`. |
| `packages/web/src/brokers/quest/new/quest-new-broker.ts` (new) | POST `/api/guilds/:guildId/quests/chat` with `{ message }`. Returns `{ questId, chatProcessId }`. |
| `packages/web/src/brokers/quest/chat/quest-chat-broker.ts` (new) | POST `/api/quests/:questId/chat` with `{ message }`. Pause→resume logic moves here from `session-chat-broker`. |
| `packages/web/src/brokers/quest/clarify/quest-clarify-broker.ts` (new) | POST `/api/quests/:questId/clarify`. |
| `packages/web/src/guards/is-quest-route/is-quest-route-guard.ts` (new) | Matches `/:guildSlug/quest` and `/:guildSlug/quest/:questId`. |
| `packages/web/src/guards/is-workspace-route/is-workspace-route-guard.ts` (new) | Matches quest OR session routes — for `app-widget` layout switching. |

### Edited files

| File | Action |
|---|---|
| `packages/web/src/flows/quest-chat/quest-chat-flow.tsx` | Replace four routes with two: `/:guildSlug/quest` and `/:guildSlug/quest/:questId`. Both mount `QuestChatWidget`. |
| `packages/web/src/flows/app/app-flow.tsx` | Add `{SessionViewFlow()}` next to `{HomeFlow()}` and `{QuestChatFlow()}`. |
| `packages/web/src/widgets/quest-chat/quest-chat-widget.tsx` | Read `useParams().questId`. Drop `wasLoadedFromUrlRef`/`sessionHasNoQuest` fallback (lines 400-416 — load-bearing today, dead after stage 5), `activeQueueSessionId`/`fallbackQuestSessionId` redirect logic (lines 79-123), `currentSessionId`/`useSessionChatBinding` references, the embedded execution-WS useEffect (lines 267-346 — folded into binding). Mount `useQuestChatBinding({ questId })`. New-chat surface (questId === undefined): just render `ChatPanelWidget` with `onSendMessage` that calls `questNewBroker`, navigates on success. |
| `packages/web/src/widgets/quest-queue-bar/quest-queue-bar-widget.tsx` | Switch `openHref` (line 38-40) and per-row `href` (line 152-154) from `/${guildSlug}/session/${activeSessionId}` to `/${guildSlug}/quest/${questId}`. **`questQueueEntryContract` already has `questId`** — no contract change. Pending rows now have a real link target on day one (Bug #15 incidentally fixed). |
| `packages/web/src/widgets/home-content/home-content-widget.tsx` | `onAdd` (line 138-147): navigate to `/${slug}/quest` (no id). User types message there; first send creates quest. |
| `packages/web/src/widgets/tooling-dropdown/tooling-dropdown-widget.tsx` | After `useSmoketestRunBinding.run()` (binding already returns `{ questId, guildSlug }`), navigate to `/${guildSlug}/quest/${questId}`. |
| `packages/web/src/widgets/app/app-widget.tsx` | Replace `isSessionRouteGuard` (line 32) with `isWorkspaceRouteGuard` (matches both quest and session routes). |
| `packages/web/src/statics/web-config/web-config-statics.ts` | Add `questNew: '/api/guilds/:guildId/quests/chat'`, `questChat: '/api/quests/:questId/chat'`, `questClarify: '/api/quests/:questId/clarify'`. Drop `sessionChat`, `sessionNew`, `sessionClarify` in stage 7. |
| `packages/web/src/contracts/chat-output-payload/chat-output-payload-contract.ts` | Add `questId` + `workItemId` (optional during stage 1, required after stage 4). |
| `packages/web/src/brokers/session/clarify/session-clarify-broker.ts` | Repoint to `/api/quests/:questId/clarify` OR delete + caller switches to `quest-clarify-broker`. |

### Deleted files (stage 6 cleanup, after consumers migrate)

- `packages/web/src/bindings/use-session-chat/...`
- `packages/web/src/bindings/use-quest-events/...`
- `packages/web/src/brokers/session/chat/...`
- `packages/web/src/guards/is-session-route/...`
- (server) `packages/server/src/responders/session/{chat,new,clarify}/...`

## Migration order

Each stage compiles, passes `npm run ward`, and is independently usable.

1. **[x] Orchestrator: chat-output payload carries `questId` + `workItemId`.** All 9 emit sites threaded. chat-complete/chat-session-started/chat-history-complete/clarification-request also gain questId. Web/server pass-through; no consumer reads them yet. Forward-compat shape.
2. **[x] Server: new endpoints + WS subscription handlers.** `quest-new-responder`, `quest-chat-responder`, `quest-clarify-responder`, new inbound `subscribe-quest`/`unsubscribe-quest`/`replay-quest-history` handlers (additive — old broadcast-to-all loop and `quest-by-session-request` stay parallel). API routes added.
3. **Web: new bindings + brokers + readonly viewer.** `use-quest-chat-binding`, `use-session-replay-binding`, `quest-new-broker`, `quest-chat-broker`. New `SessionViewWidget` + `SessionViewFlow`. Old session route still mounts old `QuestChatWidget`.
4. **Web: rewire — quest route + queue bar + home onAdd + tooling dropdown.** New route `/:guildSlug/quest/:questId` mounts the rewritten `QuestChatWidget` (now reads `:questId`, uses `use-quest-chat-binding`). New `/:guildSlug/quest` mounts the same widget for new-chat. Queue bar links switch to questId. Home `+` button navigates to `/quest`. Tooling dropdown navigates to questId. **Manual smoketest verification here — fixes images #1 + #2.**
5. **Web: switch `/:guildSlug/session/:sessionId` to `<SessionViewWidget />`.** Old `QuestChatWidget` no longer reachable via session URL. Old execution-WS useEffect inside `quest-chat-widget.tsx` is now dead code.
6. **Web cleanup:** delete `use-session-chat-binding`, `use-quest-events-binding`, `session-chat-broker`, `is-session-route-guard`, `chatPatchPayloadContract` web-side handler. Update `app-widget` layout guard. Remove `wasLoadedFromUrlRef`/redirect blocks from `quest-chat-widget`.
7. **Server cleanup:** delete `session-chat-responder`, `session-new-responder`, `session-clarify-responder`. Drop `quest-by-session-request` WS handler, `processRoleMap`, broadcast-to-all chat-output loop, `chat-patch` from `orchestrationEventTypeContract`. Drop `sessions.new`/`sessions.chat`/`sessions.clarify` from `api-routes-statics`.
8. **Smoketest QA doc rewrite** (`tmp/smoketest-qa.md`): routing language updated; refresh-test reframed; Bug #8/Bug B/Bug #15 marked resolved.

## Verification

After stage 4 (the manual-test gate):

1. **Kill all dev processes per `tmp/smoketest-qa.md` "kill dev before fix" protocol.** `pgrep -af "tsx watch.*server-entry|server-entry.ts|node.*codex-of-consentient-craft.*vite|npm run dev"` must be empty before restart.
2. `npm run build && npm run dev`.
3. Open Chrome at `http://dungeonmaster.localhost:4751/`.
4. Click `Tooling` → Smoketests → Signals.
5. From the queue bar, click `OPEN ▸`. URL should land on `/smoketests/quest/<questId>` (NOT `/session/<sessionId>`).
6. Wait for first work item to complete. Click ▸ to expand the FLOOR row. **Acceptance:** the accordion shows the agent's THINKING + tool_use entries (the YOU prompt is already shown today). Image #1 passes.
7. Press F5. **Acceptance:** page reloads on the same `/quest/<questId>` URL and re-renders the live execution panel — no fresh chat panel, no NOT FOUND. Image #2 passes.
8. Run the same flow with the MCP suite (more work items) and Orchestration suite (full agent chain).
9. Click any session in the home Sessions list. **Acceptance:** lands on `/quest/<questId>` if it correlates to a quest, or on the readonly `/session/<sessionId>` view if not. The readonly view shows the JSONL contents flat with no input box.
10. DevTools console — image #3 (4 WS errors) is unrelated and will still appear; not in scope.

After stage 7 cleanup:
- `npm run ward` from repo root, `timeout: 600000`.
- Manual smoketest re-run of all three suites end-to-end.
- Verify the home Sessions list now shows completed smoketest sessions (Bug B unblock).

## Critical files (modified)

- `packages/orchestrator/src/contracts/chat-output-emit-payload/chat-output-emit-payload-contract.ts`
- `packages/orchestrator/src/transformers/build-orchestration-loop-on-agent-entry/build-orchestration-loop-on-agent-entry-transformer.ts`
- `packages/orchestrator/src/responders/chat/start/chat-start-responder.ts`
- `packages/orchestrator/src/responders/chat/replay/chat-replay-responder.ts`
- `packages/orchestrator/src/responders/design-chat/start/design-chat-start-responder.ts`
- `packages/orchestrator/src/responders/execution-queue/bootstrap/run-orchestration-loop-layer-responder.ts`
- `packages/orchestrator/src/responders/orchestration/resume/orchestration-resume-responder.ts`
- `packages/orchestrator/src/responders/orchestration/startup-recovery/recover-guild-layer-responder.ts`
- `packages/orchestrator/src/responders/quest/modify/quest-modify-responder.ts`
- `packages/server/src/responders/server/init/server-init-responder.ts`
- `packages/server/src/contracts/ws-incoming-message/ws-incoming-message-contract.ts`
- `packages/server/src/contracts/chat-output-payload/chat-output-payload-contract.ts`
- `packages/server/src/statics/api-routes/api-routes-statics.ts`
- `packages/server/src/brokers/session/list/session-list-broker.ts`
- `packages/web/src/widgets/quest-chat/quest-chat-widget.tsx`
- `packages/web/src/widgets/quest-queue-bar/quest-queue-bar-widget.tsx`
- `packages/web/src/widgets/home-content/home-content-widget.tsx`
- `packages/web/src/widgets/tooling-dropdown/tooling-dropdown-widget.tsx`
- `packages/web/src/widgets/app/app-widget.tsx`
- `packages/web/src/flows/quest-chat/quest-chat-flow.tsx`
- `packages/web/src/flows/app/app-flow.tsx`
- `packages/web/src/statics/web-config/web-config-statics.ts`
- `packages/web/src/contracts/chat-output-payload/chat-output-payload-contract.ts`

## Reused primitives (do NOT recreate)

- `ChatPanelWidget` `readOnly` prop (`packages/web/src/widgets/chat-panel/chat-panel-widget.tsx:34, 52, 123`) — readonly viewer mounts this directly.
- `replay-history` WS plumbing — `replayHistoryMessageContract` (`packages/web/src/contracts/replay-history-message/`), inbound handler at `server-init-responder.ts:83-113`. Readonly viewer reuses verbatim.
- `chatSpawnBroker` hotload path (`packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.ts:110-117`) — quest creation + chaoswhisperer spawn already wired in one call. New `quest-new-responder` just wraps it.
- `useSmoketestRunBinding` already returns `{ questId, guildSlug }` — tooling dropdown wires up directly.
- `questQueueEntryContract` already has `questId` — queue bar switch is one line per href.
- Outbox watcher (`server-init-responder.ts:290-310`) already broadcasts `quest-modified`/`quest-created` keyed by questId — only the broadcast filter changes.
- `chatHistoryReplayBroker` (orchestrator) — `replay-quest-history` handler invokes it per work item, no new replay machinery.

## Related cleanup — smoketests under the codex guild

**Independent of the quest-id-routing refactor; can land before, alongside, or after.** The user observed that smoketest creates its own `smoketests` guild but the actual Claude CLI sessions are physically written under the codex repo's `~/.claude/projects/<encoded-cwd>/` slot — because every agent spawn resolves `cwd: repoRootCwd` via `cwdResolveBroker({ kind: 'repo-root' })`. The user is fine with smoketests living under the codex guild directly to reflect what's actually happening on disk.

**Audit findings:**
- Smoketests guild is created lazily at first run by `packages/orchestrator/src/brokers/smoketest/ensure-guild/smoketest-ensure-guild-broker.ts:29-47` with `path: homePath` (`~/.dungeonmaster-dev`).
- Each agent spawn (`packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.ts:135-146`) calls `cwdResolveBroker({ startPath: guildPath, kind: 'repo-root' })` — walks up from `~/.dungeonmaster-dev` and finds the codex `.dungeonmaster.json`. Claude CLI runs with `cwd = codex repo root`. JSONLs go to `~/.claude/projects/<encoded-codex-root>/<sessionId>.jsonl`.
- `chatHistoryReplayBroker` (`packages/orchestrator/src/brokers/chat/history-replay/chat-history-replay-broker.ts:62-88`) does the same `cwdResolveBroker` walk for lookup, which is why replay still works despite the guild/session disjunction.
- No queue/runner guard blocks smoketest quests carrying a non-smoketests guildId. `smoketest-clear-prior-quests-broker` already filters by `questSource` (the `smoketest-*` prefix), not by guildId — so the per-suite cleanup behavior survives the move.

**Files to edit:**
| File | Action |
|---|---|
| `packages/orchestrator/src/brokers/smoketest/ensure-guild/smoketest-ensure-guild-broker.ts` | Replace "find or create the smoketests guild" with "find the guild whose `path` walks up to the same repo root as the dungeonmaster home" — i.e. resolve the codex guild. If no such guild exists, fall back to creating a placeholder OR throw a clear error pointing the user to add a guild for the repo. |
| `packages/orchestrator/src/responders/smoketest/run/enqueue-bundled-suite-layer-responder.ts` | Consumer of `ensureGuildBroker` — no shape change since the broker still returns `{ guildId }`, just now points at the codex guild. |
| `tmp/smoketest-qa.md` | Drop references to "smoketests guild slug `smoketests`, UUID `b7c3c173-...`" — those become stale. Update sideline-stale-state instructions to use whatever the codex guild's path is. |

**URL impact:** smoketest URLs change from `/smoketests/quest/:questId` → `/<codexGuildSlug>/quest/:questId`. The `tooling-dropdown-widget` post-`run()` navigation and queue-bar `OPEN ▸` already use the entry's `guildSlug` from the queue entry — no widget change needed.

**Side effect (positive):** the home Sessions list under the codex guild automatically includes smoketest sessions — Bug B (completed smoketests don't appear in session list) gets simpler to fix because the sessions are now under a guild whose path resolves correctly.

**Caveat:** if the user has multiple guilds whose paths walk up to the same repo root (unlikely but possible), the broker needs a tiebreaker. Recommendation: pick the first match by guild creation order, with a one-line warning log.

## Out of scope

- WS adapter close-while-CONNECTING noise (image #3) — cosmetic, parallel small fix.
- Multi-process orphan dev server hygiene — `tmp/smoketest-qa.md` "kill dev before fix" protocol covers it.
- Web presence gate (`drainOnceLayerBroker`) — independent.
- Smoketest fake-CLI not emitting sessionId at system/init — with questId routing this stops mattering for live view.

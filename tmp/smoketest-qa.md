# Smoketest QA

Pickup doc for the manual-QA-driven debugging loop on the smoketest harness. The user records current bug state by running the suites fresh — this doc just captures conventions, run mechanics, and the open-bug list.

---

## ⚠️ CRITICAL: KILL DEV BEFORE FIXING ANY BUG ⚠️

When you find a bug and need to dispatch a fix agent, **YOU MUST KILL THE DEV SERVER FIRST.**

**Why this matters:**
- `npm run dev` does NOT replace the running instance — it spawns a new one. The "dev:kill" prelude only kills processes bound to ports `:4750/:4751`, NOT orphaned `tsx watch` / `vite` children whose parents have detached. Across a debugging session you will accumulate **3, 5, 8+ duplicate dev servers running concurrently**.
- Multiple servers cause WebSocket churn (clients disconnecting/reconnecting every few seconds), live `chat-output` broadcasts go to clients that aren't yours, and the page misses every LIVE message during streaming. You will spend hours chasing a "data race" that is actually just process pollution.

**Mandatory sequence every time you fix a bug:**

```bash
# 1. KILL EVERYTHING dev-related first — do NOT trust npm run dev:kill
pkill -9 -f "tsx watch.*server-entry" 2>/dev/null
pkill -9 -f "server-entry.ts" 2>/dev/null
pkill -9 -f "<repo>/node_modules/.bin/vite" 2>/dev/null   # match the FULL path so you don't kill unrelated vites
pkill -9 -f "npm run dev" 2>/dev/null
sleep 2
lsof -ti :4750 -ti :4751 2>/dev/null | xargs -r kill -9 2>/dev/null

# 2. VERIFY clean — these MUST both be empty
pgrep -af "tsx watch.*server-entry|server-entry.ts|node.*<repo>.*vite|npm run dev"
lsof -ti :4750 -ti :4751

# 3. THEN start ONE clean dev
npm run dev
```

If `pgrep` returns ANY processes, kill those PIDs explicitly with `kill -9 <pid>` and re-verify. Do not start a new dev until both checks return empty.

**Also kill before re-running the same smoketest after a fix.** Vite HMR does not re-create the WebSocket the page already opened, and orchestrator changes need a fresh tsx-watch server. Fix → kill → restart → retest. Every time.

---

## Conventions (do not violate)

- File naming kebab-case. Arrow exports `export const X = ({...}: {...}): R => ...`. No `function` keyword unless extending `Error`.
- Tests use `toStrictEqual` / `toBe` only. NO `toMatchObject` / `toContain` / `toEqual` / `toBeDefined` / `toBeTruthy` / `toBeFalsy` / `.includes()` inside `expect()`. NO `.not.toBe()`.
- Tests use `registerMock` from `@dungeonmaster/testing/register-mock`. NO `jest.mock()` / `jest.spyOn()` / `beforeEach` / `afterEach`. Inline setup per test, fresh proxy each test.
- All branded types from contracts; no raw `string` / `number` in signatures.
- Native Glob/Grep are blocked — use `mcp__dungeonmaster__discover` (call `mcp__dungeonmaster__get-project-map` FIRST).
- Never edit `.claude/settings.json`, `.mcp.json`, `.env*` directly. After MCP tool changes: `npm run build && npm link --workspaces && npm run init` to regenerate.
- Sideline stale quests with `mv` (not `rm`) → `tmp/sidelined-...`. Truncate `event-outbox.jsonl` between runs.
- Always pass `timeout: 600000` on `npm run ward` calls. `npm run build` mandatory before ward.
- `npm run dev` / `npm run prod` — root-only, never workspace-scoped.

---

## How to run a smoketest

> **MANUAL QA = drive Chrome yourself.** Do not poll `quest.json` and declare pass. Do not ask the user "what did the UI do?" — open Chrome via the `mcp__claude-in-chrome__*` tools, navigate to `http://dungeonmaster.localhost:4751/`, and watch the run with your own eyes. Take screenshots at each phase (queue, OPEN ▸, mid-run, terminal). Read the DevTools console. The verdict is what YOU see in the browser.

1. **Build + dev**
   ```bash
   npm run build
   npm run dev   # background; ports :4750 server, :4751 vite
   ```
   Open Chrome at `http://dungeonmaster.localhost:4751/` (the URL is `dungeonmaster.localhost`, not `localhost`). **Browser tab MUST be connected** — `drainOnceLayerBroker` short-circuits when no WS is attached, smoketest will stall.

2. **Sideline stale state**
   ```bash
   TS=$(date +%s); SIDELINE="tmp/sidelined-smoketest-$TS"
   mkdir -p "$SIDELINE" && mv .dungeonmaster-dev/guilds/<codex-guild-id>/quests/* "$SIDELINE/" 2>/dev/null
   truncate -s 0 .dungeonmaster-dev/event-outbox.jsonl
   ```
   > **STALE — pending smoketest-guild-consolidation cleanup.** The historical smoketests guild (slug `smoketests`, UUID `b7c3c173-2575-492a-9bea-18bd9880ded9`) is being retired by the cleanup section in `plan/now-that-you-have-magical-gadget.md` ("Related cleanup — smoketests under the codex guild"). After that lands, smoketest quests live under the codex guild whose path resolves to this repo root — adjust `<codex-guild-id>` above accordingly. Until consolidation lands, the old `<smoketests-guild-id>` path may still apply on existing dev homes; TODO: drop this note once the broker rewires `smoketestEnsureGuildBroker` to the codex guild.

3. **Trigger** — UI: `Tooling` button (bottom-right) → Smoketests → pick suite. Or curl:
   ```bash
   curl -X POST http://localhost:4750/api/tooling/smoketest/run \
     -H 'Content-Type: application/json' \
     -d '{"suite":"signals"}'   # or "mcp" or "orchestration"
   ```

4. **Run order recommendation** — signals → MCP → orchestration. Orchestration is longest and most fragile (5 multi-role scenarios; can OOM the vite dev process when 20+ claude-cli children run concurrently — consider re-batching if it recurs).

5. **Watch — drive Chrome yourself, UI is the source of truth**
   - **You** open Chrome via `mcp__claude-in-chrome__*` tools and observe the run. Required tools loaded via `ToolSearch`: `tabs_context_mcp`, `tabs_create_mcp`, `navigate`, `read_page`, `find`, `computer` (for screenshots + clicks), `read_console_messages`, `javascript_tool`.
   - Suggested cadence: screenshot home page after enqueue → screenshot after clicking `OPEN ▸` → screenshot mid-run (~30s in) → screenshot at terminal → `read_console_messages` with `onlyErrors: true` once at end.
   - **Browser is the only validator.** A suite "passes" when the UI renders and behaves correctly throughout the run, not when `quest.json` says `complete`. Backend data being intact does NOT mean the suite passed if the UI was broken at any point.
   - What to watch in the browser:
     - QuestQueueBar at top shows `Quest N/M — <title>` with `OPEN ▸`, head row clickable.
     - Clicking `OPEN ▸` lands on `/<guildSlug>/quest/<questId>` — the live execution view (split panel: execution panel left, agent output right). NOT `/session/<sessionId>` (that route is now the readonly raw JSONL viewer), NOT a fresh chat-input panel, NOT a NOT FOUND, NOT a stale completed view.
     - Each pending row in the queue bar links to its own `/<guildSlug>/quest/<questId>` URL (no more shared session URL across all pending rows).
     - Execution panel work-item rows render their THINKING / Tool entries as they stream.
     - Agent output panel scrolls fresh content; no blank panes, no spinner-stuck-forever, no console errors visible in DevTools.
     - On terminal: completed badge + history visible; sessions list on home page shows the run (every workItem session, not just `activeSessionId`).
     - Optional: visit `/<guildSlug>/session/<sessionId>` for any work item — it renders a readonly raw JSONL viewer (no input box, no clarify, no stop button).
   - **Dev log / API are diagnostics ONLY** — useful for understanding *why* the UI broke, not for declaring pass/fail:
     - `tail -f /tmp/claude-1001/.../tasks/<bashTaskId>.output` — `orchestration-loop questId=... ready=N terminal=...`, `🔗 quest-session-linked`.
     - `curl http://localhost:4750/api/quests/queue`, `curl http://localhost:4750/api/tooling/smoketest/state`.

6. **Verdict — UI-driven**
   - **Pass:** every UI surface above behaved correctly start to finish.
   - **Fail:** ANY UI breakage during the run (blank panel, NOT FOUND, frozen spinner, missing rows, wrong route, console errors). Even if the backend persists `status: complete` and `smoketestResults[0].passed: true`, the suite **fails** if the UI was broken.
   - Data inspection is OK as a secondary diagnostic, not as the verdict:
     ```bash
     cat .dungeonmaster-dev/guilds/<codex-guild-id>/quests/<questId>/quest.json \
       | python3 -c 'import json,sys; d=json.load(sys.stdin); print("status:",d["status"]); import json as J; print(J.dumps(d.get("smoketestResults",[]),indent=2))'
     ```

7. **Edge cases (only after primary smoke passes)**
   - **Refresh test**: trigger suite → click `OPEN ▸` → land on `/<guildSlug>/quest/<questId>` → F5. **Acceptance:** the page re-renders the live execution panel without flicker on the same `/quest/<questId>` URL. The previous bug where F5 dropped to a fresh chat panel (because `quest-by-session-request` only matched `quest.activeSessionId`) is resolved — routing is questId-keyed end-to-end now.
   - **Readonly viewer test**: while the run is live or after it terminates, navigate to `/<guildSlug>/session/<sessionId>` for any workItem session listed under the home Sessions panel. **Acceptance:** the readonly viewer renders the raw JSONL flat (THINKING + tool calls + results), with no input box / clarify / stop. Works for any workItem session, not just `activeSessionId`.
   - **Logo nav test**: trigger suite → wait ~5s → click DUNGEONMASTER logo → home page → top toolbar still shows the running smoketest with `OPEN ▸` → click → returns to live `/quest/<questId>` view.
   - **Completed-session test**: after `status: complete` → home → click the guild → click completed session in Sessions list → readonly viewer opens at `/<guildSlug>/session/<sessionId>` showing work-item history.

---

## Open bugs

### ✅ RESOLVED — BUG-INLINE-STREAMING — chat history NOT showing inline during streaming

**Resolution:** Resolved by the quest-id routing refactor (`plan/now-that-you-have-magical-gadget.md`). The live web surface now subscribes per-quest (`subscribe-quest { questId }`) instead of broadcasting `chat-output` to every connected client by sessionId. On subscribe the server replays every workItem JSONL through `chatHistoryReplayBroker` and emits frames stamped with `{ questId, workItemId }` — no more dedup race, no more sessionId-routing miss, no more reliance on the slot manager learning the sessionId asynchronously. Live chat-output frames now carry `workItemId` end-to-end (orchestrator emit → server route → web binding bucket), so the THINKING + tool_use entries land in the correct accordion row during streaming.

**Original bug context (kept for history):**

**Symptom (verified live with the user, screenshot in transcript):** Run MCP smoketest. Navigate to active session URL. Wait until 2/15+ work items complete. Click ▸ to expand a completed FLOOR row (e.g. FLOOR 1: discover, FLOOR 2: get-architecture). Expanded view shows ONLY:
```
Satisfies: smoketest-signal-received
Inputs: Void
Outputs: SmoketestPlaceholder
Expected signal: complete
Actual signal: complete
YOU
  <prompt text>     ← this MAY appear (it's read from the workItem's smoketestPromptOverride field, NOT from chat history)
Files: ...
Summary: ...
```
**No THINKING blocks. No tool_use rows. No inline ChatEntryListWidget content.**

After F5 reload of the page, the same expanded row DOES show full chat history (THINKING + tool calls + THINKING). So the **replay path works; the live path does not** — entries don't make it into `workItemSessionEntries` Map during streaming.

**Wire-level facts (verified by patching `quest-chat-widget.tsx` onMessage to capture every raw WS msg into `globalThis.__dbgRaw`, with ONE clean dev server):**

- Page WS receives 0 LIVE codeweaver `chat-output` messages during streaming.
- Page WS receives N `chat-output` messages with `chatProcessId: "exec-replay-<sid>"` after each `flushPendingReplays` triggered by questData updates.
- Server-side dev log shows the orchestrator IS emitting LIVE codeweaver chat-output (e.g. `[dev] ◂  chat-output  proc:74f89525  codeweaver  user/text`). Hundreds of these per smoketest.
- So the live broadcasts are emitted but never reach the client. Either: vite WS proxy drops them, the server `clients` set doesn't contain the page WS at the moment of broadcast, or some filter is in play that I didn't find.

**What's already in tree from the failed fix attempts (do NOT assume these "work" — only that they compile and pass scoped ward):**

- New orchestrator transformer `packages/orchestrator/src/transformers/build-orchestration-loop-on-agent-entry/build-orchestration-loop-on-agent-entry-transformer.ts` — memoizes per-slot sessionId, stamps `payload.chatProcessId = sessionId` and `payload.sessionId = sessionId` on every emit once known. Wired into `run-orchestration-loop-layer-responder.ts` + 3 sibling responders (resume, recover-guild, quest-modify).
- New contract `packages/orchestrator/src/contracts/chat-output-emit-payload/...` for the live emit shape.
- New web guard `packages/web/src/guards/is-bare-uuid-chat-process-id/is-bare-uuid-chat-process-id-guard.ts` — recognizes `^[0-9a-f]{8}-...$` chatProcessIds that AREN'T prefixed with any known orchestration prefix (`exec-replay-`, `replay-`, `chat-`, `design-`, etc.).
- `packages/web/src/widgets/quest-chat/quest-chat-widget.tsx` onMessage handler derives `targetSessionId = payload.sessionId ?? exec-replay-stripped-chatProcessId ?? bare-UUID-chatProcessId`. Always pushes to `workItemSessionEntries[targetSessionId]`.
- This SHOULD have made bare-UUID live emits route to the Map. They didn't, because the live emits aren't reaching the page WS in the first place.
- Also done: `chat-history-replay-broker` path resolution fix (walks startPath up to repo root via `cwdResolveBroker({kind:'repo-root'})`) — that one actually works and unblocked replay-from-disk for smoketest sessions.

**Diagnostic protocol for the next agent — DO ALL FOUR BEFORE TOUCHING ANY CODE:**

1. **Verify ONE dev server.** Do not skip this. Run:
   ```bash
   pgrep -af "tsx watch.*server-entry|server-entry.ts|node.*codex-of-consentient-craft.*vite|npm run dev"
   ```
   If more than one of each kind: kill them per the "KILL DEV BEFORE FIX" section above. Multiple dev servers cause severe WS churn (clients disconnect/reconnect every few seconds in the dev log) and make it impossible to reason about whether a message reaches a client.

2. **Patch onMessage to capture raw WS traffic.** In `packages/web/src/widgets/quest-chat/quest-chat-widget.tsx` inside the execution-WS `onMessage` callback, BEFORE `wsMessageContract.safeParse`:
   ```ts
   const _g = globalThis as unknown as { __dbgRaw?: unknown[] };
   if (!_g.__dbgRaw) _g.__dbgRaw = [];
   _g.__dbgRaw.push(message);
   ```
   This captures every message as it arrives, before any client-side filtering.

3. **Run a fresh smoketest with the page open.** Trigger MCP, navigate to `/smoketests/session/<activeSessionId>`. Wait for 5+ work items to complete. From DevTools console:
   ```js
   const arr = window.__dbgRaw;
   const co = arr.filter(m => m && m.type === 'chat-output');
   console.log('total:', arr.length, 'chat-output:', co.length);
   console.log('chatProcessId prefixes:', [...new Set(co.map(m => {
     const cp = m.payload?.chatProcessId || '';
     return cp.startsWith('exec-replay-') ? 'exec-replay' : (cp.startsWith('replay-') ? 'replay' : 'BARE');
   }))]);
   console.log('payload key sets:', co.reduce((a, m) => { const k = Object.keys(m.payload||{}).sort().join(','); a[k]=(a[k]||0)+1; return a; }, {}));
   ```
   - If `BARE` appears → live emits ARE reaching the client. Bug is then in client-side routing into Map/state. (Probably not the case — last verified the only prefix was `exec-replay`.)
   - If `BARE` does NOT appear → live broadcasts never reach the page. **THIS IS THE BUG.** Investigate transport: vite WS proxy config (`packages/web/vite.config.ts`), server `clients` set membership during the live emit window, server-init-responder broadcast loop.

4. **If the diagnosis points at vite WS proxy:** test bypass by changing the page's WS URL temporarily from `ws://${host}/ws` to `ws://localhost:4750/ws` (direct to server, skipping vite). If the bare/live messages start arriving in `__dbgRaw`, the bug is in the vite proxy.

**Things to NOT waste time on (the previous session ate 3 hours doing these — they were dead ends or already-applied):**

- Adding `payload.sessionId` to live emits — already done in `build-orchestration-loop-on-agent-entry-transformer`.
- Adding bare-UUID fallback on the client — already done in `is-bare-uuid-chat-process-id-guard`.
- "Maybe the contract strips the field" — `chatOutputPayloadContract` uses `.passthrough()`, it does not.
- "Maybe the slot manager isn't passing slotIndex" — it is, but slotIndex is independent of this bug. Codeweaver chat-output payloads in the dev log don't show `slot:N`, but that's likely a contract-stripping quirk in the dev log formatter; it doesn't affect routing.
- Listening for replay-only signals and assuming the streaming case "almost works" — it doesn't. The user verified end-to-end with one clean dev: streaming case is broken.

**Acceptance criteria when fixed:** With ONE clean dev, trigger MCP, navigate to active session, wait until FLOOR 1 (discover) is DONE. Click ▸. Expanded row shows: YOU prompt, THINKING, mcp__dungeonmaster__discover tool_use, THINKING, mcp__dungeonmaster__signal-back tool_use, THINKING — without F5.

---

### Bug A — install writes invalid `framework` default
**Symptom (production):** `dungeonmaster init` writes `.dungeonmaster.json` with `{ framework: 'node', schema: 'zod' }`. `'node'` is NOT a valid value in `dungeonmasterConfigContract`'s framework enum (valid: `react | vue | angular | svelte | solid | preact | express | fastify | koa | hapi | nestjs | nextjs | nuxtjs | remix | node-library | react-library | cli | ink-cli | monorepo`). Any orchestration agent that loads the config later hits a Zod throw: `Invalid configuration in <path>/.dungeonmaster.json: ... received 'node'`.

**Fix:** `packages/config/src/responders/install/create-config/install-create-config-responder.ts:43` writes the bad default. The colocated test `start-install.integration.test.ts:29` asserts the bad default — both change together. For end-user installs: detect monorepo via `package.json.workspaces` → `monorepo`; else default `node-library`. The repo's root `.dungeonmaster.json` is currently `framework: 'node'` (broken) — fix install logic and re-run init, OR ask user before editing.

### ✅ RESOLVED — Bug B — completed smoketests don't appear in session list

**Resolution:** `session-list-broker` now walks `quest.workItems[]` collecting every workItem `sessionId`, then dedupes against the cross-project glob results — so completed quests (whose `activeSessionId` is undefined at terminal) still surface every session they produced. Landed in the same refactor.

**Original bug context (kept for history):**

**Symptom:** After a smoketest completes (`passed: true` persisted), the home page Sessions panel for the guild shows "No sessions yet". `GET /api/guilds/<guild-id>/sessions` returns `[]`.

**Theory:** the queue entry's `activeSessionId` populates correctly during a run (post-#10h), but at terminal the queue entry is removed and the persisted quest's `activeSessionId` field is never set — it's a derived value via `questActiveSessionTransformer`, only computed at read-time by `quest-to-list-item-transformer`. The session-list broker filters on `quests[].activeSessionId !== undefined`, so completed smoketest quests get skipped.

**Fix paths:**
- Persist `activeSessionId` onto the quest at terminal so the field survives.
- OR have `session-list-broker` walk `quest.workItems[]` for sessionIds (per #8) — broader fix that also unblocks #13.

**Files:** `packages/server/src/brokers/session/list/session-list-broker.ts`. Investigation steps: confirm session JSONLs exist in `~/.claude/projects/<encoded-cwd>/`; check `.mcp.json`'s `DUNGEONMASTER_HOME`; trace whether the broker re-derives active session vs trusts the persisted field.

### ✅ RESOLVED — #8 — Session URLs only resolve for `quest.activeSessionId`; other work-item sessions 404 on refresh

**Resolution:** Live URLs are now `/:guildSlug/quest/:questId` and don't depend on session resolution at all. The readonly viewer at `/:guildSlug/session/:sessionId` uses the `replay-history` WS plumbing directly — it loads any session JSONL on demand without needing the session to correlate to `quest.activeSessionId`. `session-list-broker` walks `quest.workItems[]` so every workItem session shows on the home Sessions panel.

**Original bug context (kept for history):**

Smoketest quests have N codeweaver sessions (16 for MCP, 3 for Signals). `sessionListBroker` only correlated `quest.activeSessionId`. URL like `/smoketests/session/<work-item-sid>` worked while WS streamed but 404'd on refresh.

### #11 — Clicking a session from home Sessions list lands on the wrong quest's view
Re-verify post-routing-refactor. Sessions list links should now go to `/<guildSlug>/session/<sessionId>` (readonly viewer) directly per-row — which makes the per-row `sessionId` load-bearing in a different way. If the link href is still hardcoded to `quest.activeSessionId` in `packages/web/src/widgets/session-list/...`, the readonly viewer will pull the wrong JSONL. Should be straightforward to retest now that `session-list-broker` walks `workItems[]`.

### ✅ RESOLVED (with refactor) — #13 — Execution panel: earlier work-item rows don't render their THINKING/Tool entries

Same root cause as BUG-INLINE-STREAMING and #8 — fixed by the per-quest WS subscription + replay-on-subscribe (every workItem JSONL gets walked + emitted with its `workItemId`, so each row's accordion populates). Re-verify in the manual smoketest cycle. Files: `packages/web/src/widgets/execution-panel/execution-panel-widget.tsx`, `use-quest-chat-binding`.

### #14 — Orchestration `orch-happy-path` is missing codeweaver work items
The happy-path scenario should exercise the full chain (pathseeker → codeweaver → ward → siegemaster → lawbringer → blightwarden). Observed: finished in 23s while sibling cases took 60+ seconds, consistent with skipping codeweaver. **Files:**
- `packages/orchestrator/src/statics/smoketest-blueprints/smoketest-blueprints-statics.ts` — verify the shared blueprint emits a codeweaver work item.
- `packages/orchestrator/src/statics/smoketest-scenarios/smoketest-scenarios-statics.ts` — happy-path scenario script may need a codeweaver prompt entry.
- `stepsToWorkItemsTransformer` in `packages/orchestrator/src/transformers/...`

### ✅ RESOLVED — #15 — QuestQueueBar pending rows still link to `/:guildSlug/session`

**Resolution:** The "ONLY sessionId in URL" rule is gone. Live workspace URLs are `/:guildSlug/quest/:questId`, and `questQueueEntryContract` already carries `questId` — so every pending row now has a real link target on day one (its own `/:guildSlug/quest/:questId`), no shared URL across pending rows, no need to wait for `activeSessionId`. Tabs on non-active quests subscribe to their questId and render queued state until their quest reaches the head of the cross-guild runner.

**Original bug context (kept for history):**

Head row IS clickable to its own session (#10h). Pending entries (positions 2…N) all linked to the same URL — they had no `activeSessionId` yet, and the (now-removed) web rule forbade questId-in-URL routing.

**Files:** `packages/web/src/widgets/quest-queue-bar/quest-queue-bar-widget.tsx`.

### #16 — Orchestration scenarios don't actually exercise lawbringer
`orch-lawbringer-fail` name implies it should — but lawbringer isn't running anywhere across the 5 scenarios. The failure-routing path `lawbringer → spiritmender` is **not smoketested at all**. **Files:**
- `packages/orchestrator/src/statics/smoketest-blueprints/smoketest-blueprints-statics.ts`
- `packages/orchestrator/src/statics/smoketest-scenarios/smoketest-scenarios-statics.ts` — `orch-lawbringer-fail` scenario script must include a lawbringer prompt that signals `failed`, triggering spiritmender insertion at runtime.

### #17 — Missing smoketest coverage: spiritmender re-run after fix
When spiritmender succeeds at fixing a previous failure, the originally-failing step is supposed to **re-run** to verify the fix. There are no smoketest cases asserting this re-run loop. User wants:
- `lawbringer fails → spiritmender succeeds → lawbringer re-runs and passes`
- `ward fails → spiritmender succeeds → ward re-runs`
- `siegemaster fix chain` (codeweaver-fix → ward-rerun → siege-recheck)

Each new case asserts: after spiritmender complete signal, the work tracker appends (or unfreezes) the originally-failing role's work item; that retry must reach a successful terminal. **Order:** depends on #16.

**Files:** `packages/orchestrator/src/statics/smoketest-scenarios/smoketest-scenarios-statics.ts`.

### #7 — Pause/Resume flakiness on smoketest (low priority)
User retried — works on second attempt. Revisit if it recurs. Check:
- Pause responder `packages/server/src/responders/quest/pause/...` flips status to `paused` / `user_paused`.
- Resume responder transitions back to `in_progress` AND calls `runner.kick()`.
- `drainOnceLayerBroker` honors `isUserPausedQuestStatusGuard` for smoketest quests.

### "NOT FOUND" race during orchestration browser navigation (newly observed; revisit post-refactor)

The `quest-by-session-not-found` server response is **gone** as of stage 7 of the routing refactor (`quest-by-session-request` WS handler deleted). Live navigation lands on `/<guildSlug>/quest/<questId>` directly (no session lookup); the only NOT FOUND surface left is a malformed questId or readonly viewer for a sessionId that doesn't exist in any JSONL. Re-check whether the original "click head row mid-run" race still reproduces — most likely it's resolved.

### WS errors in DevTools console (image #3 — cosmetic, out of scope)

Four "WebSocket is closed before connection established" warnings appear on every page load. Cause: React StrictMode double-mounts the component, and the WS adapter calls `close()` while the underlying socket is still in `CONNECTING`. Cosmetic only — does not affect functionality. **Not in scope of the quest-id routing refactor; standalone fix.**

### Web presence gate (background context, not a separate item)
`drainOnceLayerBroker` short-circuits when `webPresenceState.getIsPresent()` is false. Browser must be open to drain. Workaround = open browser. **Code-fix option** (if you want to pursue): bypass the gate when queue head's `questSource` starts with `smoketest-`. File: `packages/orchestrator/src/brokers/quest/execution-queue-runner/drain-once-layer-broker.ts:66-68`.

---

## Key file map

**Smoketest framework**
- Scenarios (orch suite, 5 cases): `packages/orchestrator/src/statics/smoketest-scenarios/smoketest-scenarios-statics.ts`
- Orch blueprint: `packages/orchestrator/src/statics/smoketest-blueprints/smoketest-blueprints-statics.ts`
- Per-suite case catalog: `packages/orchestrator/src/statics/smoketest-case-catalog/smoketest-case-catalog-statics.ts`
- Per-MCP-tool probe args: `packages/orchestrator/src/statics/smoketest-probe-args/smoketest-probe-args-statics.ts`
- Canned prompts: `packages/orchestrator/src/statics/smoketest-prompts/smoketest-prompts-statics.ts`
- Live-id substitution (`{{questId}}` / `{{guildId}}` / `{{processId}}`): `packages/orchestrator/src/transformers/smoketest-substitute-work-item-placeholders/...`
- Suite enqueue (pre-registers proc-id, stamps assertions): `packages/orchestrator/src/responders/smoketest/run/enqueue-bundled-suite-layer-responder.ts`
- Smoketest assertion variants (incl. `work-item-signal-match`): `packages/orchestrator/src/contracts/smoketest-assertion/smoketest-assertion-contract.ts`
- Assert-final-state broker: `packages/orchestrator/src/brokers/smoketest/assert-final-state/smoketest-assert-final-state-broker.ts`

**MCP / cross-process**
- MCP `get-quest-status` HTTP bridge: `packages/mcp/src/brokers/orchestrator/get-quest-status/orchestrator-get-quest-status-broker.ts`
- Shared HTTP GET adapter: `packages/shared/src/adapters/fetch/get/fetch-get-adapter.ts`
- Port resolver: `packages/shared/src/brokers/port/resolve/port-resolve-broker.ts`

**Orchestration / queue**
- Active session derivation: `packages/orchestrator/src/transformers/quest-active-session/quest-active-session-transformer.ts`
- Queue state mutations: `packages/orchestrator/src/state/quest-execution-queue/quest-execution-queue-state.ts`
- Queue sync listener: `packages/orchestrator/src/brokers/quest/queue-sync-listener/process-sync-event-layer-broker.ts`
- Queue bootstrap (emits `execution-queue-updated` on every mutation): `packages/orchestrator/src/responders/execution-queue/bootstrap/execution-queue-bootstrap-responder.ts`
- Drain gate (web presence): `packages/orchestrator/src/brokers/quest/execution-queue-runner/drain-once-layer-broker.ts`
- Spawn hook stripping for smoketests: `packages/orchestrator/src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.ts`

**Server**
- Session list broker: `packages/server/src/brokers/session/list/session-list-broker.ts`
- Process status responder: `packages/server/src/responders/process/status/process-status-responder.ts`

**Web**
- Quest chat widget (live workspace, reads `useParams().questId`): `packages/web/src/widgets/quest-chat/quest-chat-widget.tsx`
- Quest chat binding (per-quest WS subscribe + per-workitem entry buckets): `packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts`
- Session view widget (readonly raw JSONL viewer at `/:guildSlug/session/:sessionId`): `packages/web/src/widgets/session-view/session-view-widget.tsx`
- Session replay binding (readonly): `packages/web/src/bindings/use-session-replay/use-session-replay-binding.ts`
- Execution panel: `packages/web/src/widgets/execution-panel/execution-panel-widget.tsx`
- Quest queue bar (per-row `/quest/:questId` href): `packages/web/src/widgets/quest-queue-bar/quest-queue-bar-widget.tsx`
- Tooling dropdown (post-run navigates to `/quest/:questId`): `packages/web/src/widgets/tooling-dropdown/tooling-dropdown-widget.tsx`
- Quest queue binding: `packages/web/src/bindings/use-quest-queue/use-quest-queue-binding.ts`

---

## Reporting back

When you finish a session, include:
- Suites that pass end-to-end (UI behaved correctly start to finish — backend `passed: true` is necessary but NOT sufficient).
- Edge case results per suite (refresh, logo-nav, completed-session).
- State of Bug A and Bug B.
- Any new bugs discovered + what was done.
- `npm run ward` result for any package touched.

# Startup Split: packages/orchastrator

## Status: `start-install.ts` already compliant. Only `start-orchestrator.ts` needs splitting.

## Problem

`start-orchestrator.ts` violates startup rules:
- **20+ branches** (if/ternary) — banned in startup
- **Imports from adapters/, brokers/, state/, transformers/** — all forbidden in startup
- Contains all business logic inline instead of delegating to flows

## Approach

Split `StartOrchestrator` object into 6 domain flows, each routing to action-specific responders.
The startup file becomes a thin object that maps each method to a flow function call.

---

## Flows to Create

### 1. `flows/guild/guild-flow.ts`
Exports: `guildAddFlow`, `guildGetFlow`, `guildListFlow`, `guildRemoveFlow`, `guildUpdateFlow`
Each delegates to its corresponding guild responder.

### 2. `flows/quest/quest-flow.ts`
Exports: `questAddFlow`, `questGetFlow`, `questListFlow`, `questLoadFlow`, `questModifyFlow`, `questVerifyFlow`
Each delegates to its corresponding quest responder.

### 3. `flows/orchestration/orchestration-flow.ts`
Exports: `orchestrationStartFlow`, `orchestrationGetStatusFlow`
Each delegates to its corresponding orchestration responder.

### 4. `flows/chat/chat-flow.ts`
Exports: `chatStartFlow`, `chatStopFlow`, `chatStopAllFlow`, `chatReplayFlow`
Each delegates to its corresponding chat responder.

### 5. `flows/directory/directory-flow.ts`
Exports: `directoryBrowseFlow`
Delegates to directory browse responder.

### 6. `flows/pathseeker/pathseeker-flow.ts`
Exports: `pathseekerPipelineFlow`
Delegates to pathseeker pipeline responder.

Each flow gets a companion `.integration.test.ts`.

---

## Responders to Create

Each responder gets: `[name]-responder.ts`, `[name]-responder.proxy.ts`, `[name]-responder.test.ts`

### Guild Domain (5 responders — all trivial, single broker call each)

| Responder | Path | Logic |
|-----------|------|-------|
| guild-add | `responders/guild/add/` | `guildAddBroker({...name && {name}, ...path && {path}})` |
| guild-get | `responders/guild/get/` | `guildGetBroker({guildId})` |
| guild-list | `responders/guild/list/` | `guildListBroker()` |
| guild-remove | `responders/guild/remove/` | `guildRemoveBroker({guildId})` |
| guild-update | `responders/guild/update/` | `guildUpdateBroker({guildId, ...})` + ternary for path |

### Quest Domain (6 responders)

| Responder | Path | Logic |
|-----------|------|-------|
| quest-add | `responders/quest/add/` | Calls `questAddBroker`, emits `quest-created` event on success |
| quest-get | `responders/quest/get/` | Calls `questGetBroker` with conditional `stage` spread |
| quest-list | `responders/quest/list/` | Calls `questListBroker` + `questToListItemTransformer` |
| quest-load | `responders/quest/load/` | Calls `questLoadBroker` (trivial) |
| quest-modify | `responders/quest/modify/` | Calls `questModifyBroker`, finds path on success, emits `quest-modified` event |
| quest-verify | `responders/quest/verify/` | Calls `questVerifyBroker` (trivial) |

### Orchestration Domain (2 responders)

| Responder | Path | Logic |
|-----------|------|-------|
| orchestration-start | `responders/orchestration/start/` | Validates quest status, registers process in state, calls `questPipelineBroker` (fire-and-forget), emits events |
| orchestration-get-status | `responders/orchestration/get-status/` | Looks up process in `orchestrationProcessesState`, throws if not found |

### Chat Domain (4 responders)

| Responder | Path | Logic |
|-----------|------|-------|
| chat-start | `responders/chat/start/` | Complex: resolves linked quest, spawns process via `chatSpawnBroker`, sets up readline streaming, processes lines via transformer, detects clarifications, manages state, emits events |
| chat-stop | `responders/chat/stop/` | Gets process from `chatProcessState`, calls `kill()` |
| chat-stop-all | `responders/chat/stop-all/` | Iterates all processes in `chatProcessState`, kills each |
| chat-replay | `responders/chat/replay/` | Calls `chatHistoryReplayBroker`, links quest if found, emits events |

### Directory Domain (1 responder)

| Responder | Path | Logic |
|-----------|------|-------|
| directory-browse | `responders/directory/browse/` | Calls `directoryBrowseBroker({path})` (trivial) |

### Pathseeker Domain (1 responder)

| Responder | Path | Logic |
|-----------|------|-------|
| pathseeker-pipeline | `responders/pathseeker/pipeline/` | Calls `pathseekerPipelineBroker(params)` (trivial) |

---

## Modified Files

### `startup/start-orchestrator.ts`
- Strip ALL broker/adapter/state/transformer imports
- Keep ONLY flow imports + contract type imports
- Each method becomes a one-liner delegating to the corresponding flow function
- No branching remains
- Exported `StartOrchestrator` object shape stays identical (no breaking changes)

### `startup/start-orchestrator.integration.test.ts`
- Logic-level tests (branching, validation, error cases) move to responder `.test.ts` files
- Wiring tests (startup → flow delegation) stay here but simplified
- Every original assertion must have a home in either a responder test or this file

---

## Test Redistribution Map

| Original Test | Destination |
|---------------|-------------|
| `listQuests ERROR: invalid guildId` | `quest-list-responder.test.ts` |
| `loadQuest ERROR: invalid questId` | `quest-load-responder.test.ts` |
| `startQuest ERROR: invalid questId` | `orchestration-start-responder.test.ts` |
| `startQuest ERROR: quest status not approved` | `orchestration-start-responder.test.ts` |
| `getQuestStatus ERROR: nonexistent processId` | `orchestration-get-status-responder.test.ts` |
| `modifyQuest ERROR: quest not found` | `quest-modify-responder.test.ts` |
| `modifyQuest VALID: successful modify` | `quest-modify-responder.test.ts` |
| `browseDirectories VALID: path undefined` | `directory-browse-responder.test.ts` |
| `browseDirectories ERROR: nonexistent path` | `directory-browse-responder.test.ts` |
| `getQuest ERROR: nonexistent questId` | `quest-get-responder.test.ts` |
| `getQuest ERROR: nonexistent questId + stage` | `quest-get-responder.test.ts` |
| `verifyQuest ERROR: nonexistent questId` | `quest-verify-responder.test.ts` |
| `addQuest INVALID_TITLE: empty title` | `quest-add-responder.test.ts` |
| `addQuest INVALID_USER_REQUEST: empty userRequest` | `quest-add-responder.test.ts` |
| `stopChat VALID: nonexistent chatProcessId` | `chat-stop-responder.test.ts` |
| `stopAllChats VALID: no active chats` | `chat-stop-all-responder.test.ts` |

---

## File Count Summary

| Category | Files |
|----------|-------|
| Flows | 6 |
| Flow integration tests | 6 |
| Responders | 19 |
| Responder proxies | 19 |
| Responder tests | 19 |
| Modified startup | 1 |
| Modified startup test | 1 |
| **Total new** | **69** |
| **Total modified** | **2** |

---

## Implementation Order

1. **Guild domain** (simplest — validate the pattern works)
2. **Directory + Pathseeker domains** (trivial — quick wins)
3. **Quest domain** (moderate complexity)
4. **Orchestration domain** (moderate — state management)
5. **Chat domain** (most complex — streaming, clarifications)
6. **Update startup file** (strip imports, delegate to flows)
7. **Redistribute tests** (move assertions from startup test to responder tests)
8. **Ward pass** (full lint + typecheck + test)

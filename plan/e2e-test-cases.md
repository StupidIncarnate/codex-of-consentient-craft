# E2E Test Cases: Web UI

**Status:** Active
**Related:** plan/cli-to-web-pivot.md Phase 4.1
**Test count:** 50 suites, 291 tests passing

## All Bugs Found & Fixed

| # | Severity | Flow                   | Description                                                                                             | Status     |
|---|----------|------------------------|---------------------------------------------------------------------------------------------------------|------------|
| 1 | Critical | Quest Detail           | API returns `{success, quest}` but broker parsed entire envelope instead of `response.quest`            | Fixed      |
| 2 | High     | Build/Dev              | Stale Vite dependency cache after adding new shared contracts. Requires rebuild + cache clear + restart | Documented |
| 3 | Medium   | Quest Create           | `.catch(() => undefined)` swallowed errors silently. Modal stayed open with no feedback                 | Fixed      |
| 4 | Medium   | Project Path           | Project Path was read-only `<Text>`, no fallback to type a path manually                                | Fixed      |
| 5 | Low      | App Load / UX          | Blank main area when projects exist but none selected. No guidance text                                 | Fixed      |
| 6 | Low      | Directory Browser / UX | `currentPath` started as null displayed as "/" instead of actual resolved home directory path           | Fixed      |
| 7 | Critical | Quest Create           | Server returns `{questId}` but broker extracted `response.id` (undefined). Field name mismatch          | Fixed      |
| 8 | Critical | Quest Modify           | Server returns `{success, error?}` but broker expected full Quest object. Zod parse always failed       | Fixed      |

---

## Test Suites

### 1. Smoke: App Load

| ID  | Case                               | Steps                               | Expected                                                                |
|-----|------------------------------------|-------------------------------------|-------------------------------------------------------------------------|
| 1.1 | Health endpoint responds           | GET /api/health                     | `{status: "ok", timestamp: <ISO>}`                                      |
| 1.2 | App renders without errors         | Navigate to localhost:5173          | "Dungeonmaster" header visible, no console errors                       |
| 1.3 | First-time empty state             | Load with no projects in DB         | Shows "Welcome to Dungeonmaster" + "Create your first project"          |
| 1.4 | Existing projects load in sidebar  | Load with projects in DB            | Sidebar lists project names, "Add Project" button visible               |
| 1.5 | No project selected shows guidance | Load with projects, don't click any | Main area shows "Select a project from the sidebar to view its quests." |

### 2. Project Management

| ID   | Case                                         | Steps                                                        | Expected                                                                     |
|------|----------------------------------------------|--------------------------------------------------------------|------------------------------------------------------------------------------|
| 2.1  | Open Add Project modal                       | Click "Add Project" (or "Create your first project")         | Modal opens with "Project Name" input, "Project Path" input, "Browse" button |
| 2.2  | Type project path manually                   | In modal, type `/home/user/my-project` in Project Path input | Path value updates, no browse required                                       |
| 2.3  | Browse directories                           | Click "Browse" in Add Project modal                          | Directory browser modal opens, shows home directory contents                 |
| 2.4  | Directory browser shows correct initial path | Open directory browser                                       | Path display shows `/home/brutus-home` (not "/")                             |
| 2.5  | Navigate into directory                      | Click a directory name in browser                            | Entries update to subdirectory contents, path updates                        |
| 2.6  | Navigate up                                  | Click "Go Up" after navigating into a directory              | Returns to parent directory                                                  |
| 2.7  | Select directory                             | Navigate to target, click "Select"                           | Browser closes, path populated in Add Project modal                          |
| 2.8  | Cancel directory browser                     | Click "Cancel" in directory browser                          | Browser closes, path unchanged                                               |
| 2.9  | Create button disabled without inputs        | Open modal, leave fields empty                               | "Create" button is disabled                                                  |
| 2.10 | Create button disabled with only name        | Type name only                                               | "Create" button remains disabled                                             |
| 2.11 | Create button disabled with only path        | Type path only                                               | "Create" button remains disabled                                             |
| 2.12 | Create project successfully                  | Fill name + path, click "Create"                             | Modal closes, project appears in sidebar, project auto-selected              |
| 2.13 | Cancel Add Project                           | Fill fields, click "Cancel"                                  | Modal closes, fields cleared, no project created                             |
| 2.14 | Invalid project shows orange in sidebar      | Create project with non-existent path                        | Project name renders orange (valid: false)                                   |

### 3. Quest List

| ID   | Case                                       | Steps                                     | Expected                                                            |
|------|--------------------------------------------|-------------------------------------------|---------------------------------------------------------------------|
| 3.1  | Empty quest list                           | Select project with no quests             | Shows "No quests found. Create a quest to get started."             |
| 3.2  | Quest list loads for project               | Select project with quests                | Table shows Title, Status (badge), Progress columns                 |
| 3.3  | Quest status badge colors                  | View quests with various statuses         | IN_PROGRESS=cyan, COMPLETE=green, etc. per questStatusColorsStatics |
| 3.4  | Refresh button                             | Click "Refresh"                           | Quest list reloads (button shows loading spinner)                   |
| 3.5  | Open create quest modal                    | Click "New Quest"                         | Modal with Title input + User Request textarea                      |
| 3.6  | Create quest - fields required             | Leave fields empty                        | "Create" button disabled                                            |
| 3.7  | Create quest successfully                  | Fill title + user request, click "Create" | Modal closes, quest list refreshes, new quest visible               |
| 3.8  | Create quest - error feedback              | Trigger server error (e.g. invalid data)  | Error alert shown in modal, modal stays open                        |
| 3.9  | Create quest - API contract (BUG #7 fixed) | Create quest, inspect network response    | Broker extracts `questId` from `{success, questId, ...}`            |
| 3.10 | Click quest row navigates to detail        | Click on a quest row                      | Quest detail view loads with tabs                                   |

### 4. Quest Detail

| ID   | Case                                       | Steps                                             | Expected                                                            |
|------|--------------------------------------------|---------------------------------------------------|---------------------------------------------------------------------|
| 4.1  | Quest detail loads correctly               | Click quest in list                               | Title, status badge, "Back to list", tabs visible                   |
| 4.2  | API envelope unwrapped correctly           | Load quest detail, check parsed data              | Title/status/dates populated (not "undefined")                      |
| 4.3  | Overview tab - summary counts              | View Overview tab                                 | Shows Requirements/Contexts/Observables/Steps/Contracts counts      |
| 4.4  | Requirements tab                           | Click "Requirements" tab                          | Lists requirements (or empty state)                                 |
| 4.5  | Steps tab                                  | Click "Steps" tab                                 | Lists dependency steps (or empty state)                             |
| 4.6  | Contracts tab                              | Click "Contracts" tab                             | Lists contracts (or empty state)                                    |
| 4.7  | Back to list navigation                    | Click "Back to list"                              | Returns to quest list, refreshes list                               |
| 4.8  | Verify quest - success                     | Click "Verify Quest" on valid quest               | Modal shows check results, all green badges                         |
| 4.9  | Verify quest - failures                    | Click "Verify Quest" on quest with issues         | Modal shows failed checks with red badges + messages                |
| 4.10 | Verify quest - error handling              | Click "Verify Quest" when server errors           | Falls back to `{success: false, checks: []}`                        |
| 4.11 | Start Quest button visibility              | View quest with status != "complete", not running | "Start Quest" button visible (green)                                |
| 4.12 | Start Quest hidden when complete           | View quest with status "complete"                 | "Start Quest" button hidden                                         |
| 4.13 | Start Quest hidden when running            | Start execution, view detail                      | "Start Quest" button hidden while isRunning=true                    |
| 4.14 | Quest modify - API contract (BUG #8 fixed) | Modify quest, inspect response handling           | Broker handles `{success, error?}`, returns void, throws on failure |

### 5. Quest Execution

| ID   | Case                              | Steps                                | Expected                                             |
|------|-----------------------------------|--------------------------------------|------------------------------------------------------|
| 5.1  | Start quest execution             | Click "Start Quest"                  | POST /api/quests/:id/start returns processId         |
| 5.2  | Execution dashboard renders       | After starting quest                 | Phase stepper, progress bar, slot grid visible       |
| 5.3  | Phase stepper shows current phase | During execution                     | Current phase highlighted, completed phases marked   |
| 5.4  | Progress bar updates              | During execution as steps complete   | Bar fills proportionally (completed/total)           |
| 5.5  | Slot grid shows active agents     | During codeweaver/siegemaster phases | Cards show slot index, agent role, step name, status |
| 5.6  | Empty slot grid                   | Before agents spawn                  | Shows "No active slots"                              |
| 5.7  | Agent output panels render        | During execution with active slots   | Dark terminal panels with ANSI-colored output        |
| 5.8  | Agent output buffer warning       | Output exceeds 400 lines             | Badge turns yellow at warning threshold              |
| 5.9  | Status polling works              | Start execution, monitor network     | GET /api/process/:processId every 2s                 |
| 5.10 | Polling stops on completion       | Wait for quest to complete           | Polling interval cleared, phase shows "complete"     |
| 5.11 | Polling stops on failure          | Quest fails during execution         | Polling stops, phase shows "failed"                  |

### 6. WebSocket Real-Time

| ID  | Case                                  | Steps                                              | Expected                                            |
|-----|---------------------------------------|----------------------------------------------------|-----------------------------------------------------|
| 6.1 | WebSocket connects on execution start | Start quest, monitor network                       | WS connection established to ws://localhost:3737/ws |
| 6.2 | Agent output streams via WebSocket    | During execution with active agents                | Messages with type "agent-output" received          |
| 6.3 | Output routed to correct slot         | Multiple agents running                            | Each slot's panel shows only its agent's output     |
| 6.4 | WebSocket closes on execution end     | Quest completes or fails                           | WS connection cleanly closed                        |
| 6.5 | Late-joiner output endpoint           | GET /api/process/:id/output after execution starts | Returns buffered output per slot                    |
| 6.6 | Batched output (100ms)                | High-frequency agent output                        | Messages batched, not sent per-line                 |

### 7. Agent-Facing Endpoints (HTTP API for spawned agents)

| ID  | Case                         | Steps                                                                | Expected                                                        |
|-----|------------------------------|----------------------------------------------------------------------|-----------------------------------------------------------------|
| 7.1 | Architecture overview        | GET /api/docs/architecture                                           | Returns `{content: <markdown>}` with folder types, import rules |
| 7.2 | Folder detail                | GET /api/docs/folder-detail/guards                                   | Returns `{content: <markdown>}` with guard patterns             |
| 7.3 | Folder detail - invalid type | GET /api/docs/folder-detail/invalid                                  | Returns 400 or empty result                                     |
| 7.4 | Syntax rules                 | GET /api/docs/syntax-rules                                           | Returns `{content: <markdown>}` with conventions                |
| 7.5 | Testing patterns             | GET /api/docs/testing-patterns                                       | Returns `{content: <markdown>}` with proxy patterns             |
| 7.6 | Discover - files by type     | POST /api/discover `{type:"files", fileType:"broker"}`               | Returns file list with metadata                                 |
| 7.7 | Discover - files by path     | POST /api/discover `{type:"files", path:"packages/web/src/brokers"}` | Returns tree of broker files                                    |
| 7.8 | Discover - files by name     | POST /api/discover `{type:"files", name:"quest-detail-broker"}`      | Returns specific file metadata                                  |
| 7.9 | Discover - standards         | POST /api/discover `{type:"standards"}`                              | Returns standards documentation                                 |

### 8. Error Handling & Edge Cases

| ID  | Case                                | Steps                                           | Expected                                           |
|-----|-------------------------------------|-------------------------------------------------|----------------------------------------------------|
| 8.1 | Server down - app load              | Stop API server, load app                       | Sidebar shows "No projects" (graceful degradation) |
| 8.2 | Server down - quest list            | Select project, then stop server, click Refresh | Error alert displayed                              |
| 8.3 | Network error on quest create       | Disconnect network mid-create                   | Error alert in modal: "Failed to create quest"     |
| 8.4 | Invalid quest ID in detail          | Navigate to quest detail with non-existent ID   | Shows "Quest not found" or error alert             |
| 8.5 | Directory browser - empty directory | Browse to directory with no subdirs             | Shows "No subdirectories found"                    |
| 8.6 | Directory browser - Go Up at root   | Click "Go Up" when at root level                | Button disabled or no-op                           |
| 8.7 | Concurrent project creation         | Create two projects rapidly                     | Both created, sidebar shows both                   |
| 8.8 | Switch project during quest load    | Click project A, then quickly click project B   | Shows project B's quests (not A's)                 |
| 8.9 | Rapid quest list clicks             | Click quest row multiple times quickly          | Loads detail once, no duplicate requests           |

### 9. Regression Tests (Previously Fixed Bugs)

| ID  | Case                                          | Original Bug | Steps                                        | Expected                                                     |
|-----|-----------------------------------------------|--------------|----------------------------------------------|--------------------------------------------------------------|
| 9.1 | Quest detail parses API envelope correctly    | Bug #1       | Load quest detail, verify fields populated   | Title, status, dates all present (not "undefined")           |
| 9.2 | Quest create shows error on failure           | Bug #3       | Trigger creation error                       | Red alert appears in modal with "Failed to create quest"     |
| 9.3 | Project path is editable text input           | Bug #4       | Open Add Project modal                       | Project Path is a TextInput (editable), not read-only Text   |
| 9.4 | Empty state guidance when no project selected | Bug #5       | Load with projects, don't select any         | "Select a project from the sidebar to view its quests."      |
| 9.5 | Directory browser shows actual resolved path  | Bug #6       | Open directory browser                       | Shows `/home/brutus-home` (not "/")                          |
| 9.6 | Vite cache rebuild after shared changes       | Bug #2       | Modify shared, rebuild, clear .vite, restart | New contracts available in web (not stale)                   |
| 9.7 | Quest create extracts questId correctly       | Bug #7       | Create quest, verify ID returned             | Broker reads `response.questId` (not `response.id`)          |
| 9.8 | Quest modify handles success/error response   | Bug #8       | Modify quest, verify no Zod parse error      | Broker returns void on success, throws on `{success: false}` |

---

## Priority Order

1. **Suites 1-4** - Core user flows (load, projects, quests, detail)
2. **Suite 9** - Regression coverage for all 8 fixed bugs
3. **Suite 5-6** - Execution and WebSocket (requires running orchestrator)
4. **Suite 7** - Agent-facing endpoints (curl-based, can test independently)
5. **Suite 8** - Edge cases and error handling

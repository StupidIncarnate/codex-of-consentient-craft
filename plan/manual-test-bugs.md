# Manual Testing Bug Report

**Date:** 2026-02-12
**Tester:** Claude Opus 4.6 (automated)
**Server:** http://localhost:3737
**Web:** http://localhost:5173

## Test Plan

1. App loads, shows project sidebar or empty state
2. Can create/add a project
3. Can browse directories for project path
4. Project sidebar lists projects
5. Quest list shows for selected project
6. Can create a quest (title + description)
7. Quest detail view loads with tabs
8. Can modify a quest
9. Can verify a quest
10. Can start quest execution
11. WebSocket connects and shows real-time updates
12. Health endpoint works

## Bugs Found

| # | Severity | Flow                   | Description                                                                                                                                                                                                                                                 | Status     |
|---|----------|------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------|
| 1 | Critical | Quest Detail           | Quest detail broker parses response incorrectly: API returns `{success, quest}` wrapper but broker calls `questContract.parse(response)` instead of `questContract.parse(response.quest)`. All fields show as undefined.                                    | Open       |
| 2 | High     | Build/Dev              | Stale Vite dependency cache after adding new contracts to `@dungeonmaster/shared`. Requires manual rebuild + Vite restart. Silently fails with empty Zod schemas - no console errors shown.                                                                 | Documented |
| 3 | Medium   | Quest Create           | Create Quest modal does not close after submission when Zod parse fails silently. Modal remains open with form data. User gets no error feedback - the `.catch(() => undefined)` swallows the error.                                                        | Open       |
| 4 | Medium   | Project Path           | Add Project modal has no manual text input for Project Path - only the Browse directory picker. If the directory browser fails, there is no fallback to type a path manually.                                                                               | Open       |
| 5 | Low      | App Load / UX          | When projects exist but none is selected, the main content area is completely blank. Should show guidance like "Select a project from the sidebar" instead of empty white space.                                                                            | Open       |
| 6 | Low      | Directory Browser / UX | Directory browser starts with `currentPath = null` displayed as "/" which is misleading. The actual initial browse loads the user's home directory, not the root filesystem. Path display should show the actual resolved path (e.g., `/home/brutus-home`). | Open       |

## Bug Details

### Bug 1: Quest Detail Broker Response Parsing (Critical)

**File:** `packages/web/src/brokers/quest/detail/quest-detail-broker.ts`

**What happens:**
The server endpoint `GET /api/quests/:questId` returns a response wrapped in an envelope:

```json
{
  "success": true,
  "quest": {
    "id": "test-quest",
    "title": "Test Quest",
    ...
  }
}
```

The broker does:

```typescript
return questContract.parse(response);
```

But it should be parsing `response.quest` (the inner object), not the entire envelope:

```typescript
return questContract.parse((response as { quest: unknown }).quest);
```

**Result:** Zod validation error is displayed in the quest detail UI with all fields showing "Required" / received "
undefined".

**Error message shown:**

```
[{"code":"invalid_type","expected":"string","received":"undefined","path":["id"],"message":"Required"},
 {"code":"invalid_type","expected":"string","received":"undefined","path":["folder"],"message":"Required"},
 {"code":"invalid_type","expected":"string","received":"undefined","path":["title"],"message":"Required"},
 {"code":"invalid_type","expected":"'pending' | 'in_progress' | 'blocked' | 'complete' | 'abandoned'","received":"undefined","path":["status"],"message":"Required"},
 {"code":"invalid_type","expected":"string","received":"undefined","path":["createdAt"],"message":"Required"}]
```

**Fix option A:** Change broker to unwrap the response:

```typescript
const response = await fetchGetAdapter<{ quest: unknown }>({url: ...});
return questContract.parse(response.quest);
```

**Fix option B:** Change the server to return the quest object directly (without wrapping).

---

### Bug 2: Stale Vite Dependency Cache (High)

**What happens:**
When new contracts are added to `@dungeonmaster/shared` (e.g., `projectListItemContract`, `directoryEntryContract`,
`projectIdContract`), the Vite dev server's pre-bundled dependency cache (
`node_modules/.vite/deps/@dungeonmaster_shared_contracts.js`) does not include the new exports.

**Root cause:** The `@dungeonmaster/shared` package must be rebuilt (`npm run build --workspace=@dungeonmaster/shared`)
AND the Vite dev server must be restarted for changes to take effect. The `optimizeDeps.include` in `vite.config.ts`
pre-bundles the contracts, and this bundle goes stale.

**Symptoms:**

- Project list shows "No projects" even when projects exist in the API
- Directory browser shows "No subdirectories found" even though API returns data
- No console errors are logged (Zod `.parse()` failures are caught silently)
- The contracts module has `totalKeys: 1` (only "default") instead of the expected ~100+ exports

**Fix:** After modifying `@dungeonmaster/shared`:

1. `npm run build --workspace=@dungeonmaster/shared`
2. Delete `packages/web/node_modules/.vite/`
3. Restart the Vite dev server

Consider adding a watcher or pre-build script to automate this.

---

### Bug 3: Silent Error Swallowing in Quest Create (Medium)

**File:** `packages/web/src/widgets/quest-list/quest-list-widget.tsx`

**What happens:**
The quest creation promise chain has `.catch(() => undefined)` at the end, which silently swallows all errors. When the
Zod parse in the response handler fails, the user gets no feedback - the modal stays open with the form data preserved.

```typescript
questCreateBroker({...})
    .then(() => {
        close();
        onRefresh();
    })
    .finally(() => {
        setSubmitting(false);
    })
    .catch(() => undefined);  // <-- silently swallows errors
```

**Expected behavior:** An error toast/notification should appear informing the user that creation failed.

---

### Bug 4: No Manual Path Input in Add Project Modal (Medium)

**File:** `packages/web/src/widgets/project-add-modal/project-add-modal-widget.tsx`

**What happens:**
The Project Path field is a read-only `<Text>` element, not a `<TextInput>`. Users cannot type a path manually - they
must use the directory browser. If the browser fails (or if the user knows the exact path), there is no alternative
input method.

**Expected behavior:** The path display should either be an editable text input, or there should be a secondary option
to type a path manually.

---

### Bug 5: Empty Main Area When No Project Selected (Low)

**What happens:**
When projects exist in the sidebar but none is selected, the main content area is completely empty/blank. This provides
no guidance to the user.

**Expected behavior:** Should display something like "Select a project from the sidebar to view its quests" or similar
guidance text, similar to how the empty state shows "Welcome to Dungeonmaster" when no projects exist.

---

### Bug 6: Directory Browser Shows "/" Instead of Actual Initial Path (Low)

**File:** `packages/web/src/bindings/use-directory-browser/use-directory-browser-binding.ts`

**What happens:**
The `currentPath` state starts as `null`, which is displayed as "/" in the UI. However, when `path` is `null`, the API
call returns the user's home directory (e.g., `/home/brutus-home`). The displayed path "/" does not match the actual
directory being browsed.

**Expected behavior:** After the initial API call resolves, `currentPath` should be updated to reflect the actual
resolved path (the home directory), not remain as `null`.

---

## Test Session Log

### Session 1 (2026-02-12, ~8:30 PM)

**Initial State:**

- App loaded at http://localhost:5173/
- Sidebar showed "No projects"
- Main area showed "Welcome to Dungeonmaster" with "Create your first project" button
- No console errors on load

**Test: Directory Browser (FAILED initially)**

- Clicked "Create your first project" -> Add Project modal appeared correctly
- Typed "Test Project" in name field
- Clicked "Browse" -> Browse Directory modal opened
- Directory browser showed "/" with "No subdirectories found" despite API returning 21 directories
- Root cause identified: Stale Vite dependency cache missing `directoryEntryContract`
- Network requests showed POST /api/directories/browse returned 200
- No console errors (Zod parse failure silently caught)

**Test: Project List (FAILED initially)**

- Sidebar showed "No projects" despite API returning 1 project
- Root cause: Same stale Vite cache missing `projectListItemContract`
- Created project via direct API call: `POST /api/projects` returned duplicate error (project already existed from
  earlier testing)

**Fix Applied:**

1. Rebuilt shared package: `npm run build --workspace=@dungeonmaster/shared`
2. Cleared Vite cache: `rm -rf packages/web/node_modules/.vite`
3. Restarted Vite dev server (killed PID 1577672, started new process on port 5173)

**Test: Project List (PASSED after fix)**

- Page reload showed "Test Project" in sidebar with "Add Project" button
- Selecting project showed Quests view with "New Quest" and "Refresh" buttons
- Empty quest list showed "No quests found. Create a quest to get started."

**Test: Directory Browser (PASSED after fix)**

- Browse button opened directory browser showing home directory contents (15 subdirectories)
- Navigation into `/home/brutus-home/projects` worked correctly, showing 10 project directories
- "Go Up" button worked correctly
- "Select" button enabled when a directory was navigated to
- Path display updated correctly during navigation

**Test: Quest Creation (PASSED)**

- Filled in title "Test Quest" and user request "Build a hello world feature"
- Create button became active after filling both fields
- POST /api/quests returned 201 (Created)
- After page reload, quest appeared in list with status "IN_PROGRESS" (cyan badge)

**Test: Quest Detail (FAILED)**

- Clicked on "Test Quest" row
- Quest detail view showed Zod validation error
- All fields (id, folder, title, status, createdAt) received undefined
- Root cause: API returns `{success: true, quest: {...}}` but broker parses the entire response object

**Test: API Health Endpoint (PASSED)**

- GET /api/health returned `{"status":"ok","timestamp":"..."}`
- Verified both via curl and browser navigation

**Test: API Projects Endpoint (PASSED)**

- GET /api/projects returned project array with correct data
- Project has `questCount: 1` after quest creation

**Test: Console Errors (PASSED)**

- No JavaScript console errors throughout the entire session
- Only standard Vite debug messages and React DevTools recommendation

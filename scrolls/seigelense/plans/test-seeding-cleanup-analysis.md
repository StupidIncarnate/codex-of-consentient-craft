# Deep Analysis: Test-to-Harness Seeding Call Sites & Architecture Cleanup

## 1. Executive Summary & Core Philosophy

The user identified the critical architectural defect in current test-to-harness usage:
> **"We don't patch a quest to a status, we seed it to a status and then check. Because quests have to go through various workflows to keep data integrity happening."**
> **"There needs to be a very clear layer between action site and data handling via seeder. Thats what the seed recipes are for."**
> **"Do we allow tests to call seeding directly or do they have to go through harnesses? If not, then whats to say tests cant directly then modify files directly and skip harnesses completely? I think there should be a clear cut line and a lint rule to protect it so that tests dont become unruly."**

In our deep codebase audit of all `*.e2e.ts` tests and harnesses, we found that tests currently conflate **four distinct testing intentions** into crude disk overwrites (`fs.writeFileSync`) and raw API short-circuits (`request.patch`):
1. **Initial Scenario Seeding**: Setting up a quest/session/guild at a known state *before* navigating the page.
2. **Live Transition Stimulation**: Testing how a live, already-mounted UI surface reacts to an event (e.g. WebSocket broadcast when a quest transitions from `review_observables` $\rightarrow$ `approved`).
3. **Out-of-Band State Staling (Race / Concurrency Simulation)**: Simulating the backend moving on underneath an open browser tab (e.g. quest moved to `abandoned` or `complete` while the user was typing a follow-up message).
4. **Resilience / Fault Injection (The Antagonist)**: Testing how crash handlers, error boundaries, and unreadable-file detectors behave when encountering corrupted bytes or invalid schemas.

---

## 2. The Strict Boundary: Tests MUST Go Through Harnesses

### Why Tests Cannot Call Seeding Directly or Perform I/O
If a test were permitted to call seeding brokers directly:
1. **Tests would become unruly**: Every test author would invent their own ad-hoc recipe plans, inline status transitions, or arbitrary hacks right inside test files.
2. **The slippery slope**: If a test can import and run seeding machinery directly, nothing stops someone from importing `fs` or `fetch` directly in a test to "quick fix" an edge case, completely destroying the boundary.
3. **The Action Site principle**: The test file is **strictly an Action Site / Verifier**. It should only know:
   - *"Ask the harness to set up the scenario."*
   - *"Drive the browser (click, type, navigate)."*
   - *"Assert the UI / observable outcomes."*

```
                       STRICT ARCHITECTURAL BOUNDARY
                       
   Test File (*.e2e.ts)  [THE ACTION SITE]
   ----------------------------------------
   - Only drives UI (`page.click`, `nav.navigateToQuest`)
   - Only asserts (`expect(...)`)
   - Talks ONLY to Harnesses
   - BANNED: fs.*, fetch(), request.*, direct dmRegistryBroker calls
            │
            │  calls async harness methods (e.g. `modal.setupTest`, `modal.stimulateApproval`)
            ▼
   Harness (*.harness.ts)  [THE DOMAIN SEEDER ADAPTER]
   ---------------------------------------------------
   - Encapsulates domain seeding and test scenario orchestration
   - Calls the Recipe Framework / Seeder underneath
   - Holds the contracts & state machine rules
   - Every seeding method is strictly ASYNC (returns Promise)
            │
            │  builds & runs declarative recipes
            ▼
   Hydration Recipe Engine (`dmRegistryBroker.run`)
   -------------------------------------------------
   - Walks real routes (`apiTarget`, `writeTarget`)
   - Walks legal transitions (`questReachRouteBroker`)
   - Enforces contracts, mints IDs, fires events
```

---

## 3. Two Complementary Local ESLint Rules

To ensure this boundary is permanently and mechanically enforced, we introduce two custom rules in `@dungeonmaster/local-eslint`:

### Rule 1: `@dungeonmaster-local/ban-direct-io-in-test-scenarios`
- **Scope**: All test scenario files (`packages/**/src/**/*.e2e.ts`, `packages/**/src/**/*.spec.ts`, `packages/**/src/**/*.integration.test.ts`).
- **Mechanics**:
  1. **Bans direct filesystem imports**: Flags any import from `'fs'`, `'node:fs'`, `'fs/promises'`, `'node:fs/promises'`.
  2. **Bans direct HTTP mutations in test bodies**: Flags raw calls to `fetch(...)`, `axios.*`, `request.post/patch/put/delete` inside test bodies.
  3. **Bans direct recipe framework imports**: Flags any direct imports of `recipesHydrationCreateBroker`, `dmRegistryBroker`, or `@dungeonmaster/hydration-recipes/*` inside test files.
- **Error Message**:
  > *"Direct I/O, direct network mutations, and direct recipe seeding are banned in test scenario files. All domain state setup and transitions must go through test harnesses (`*Harness`)."*

### Rule 2: `@dungeonmaster-local/ban-sync-seeding-methods`
- **Scope**: All harness files (`packages/**/test/**/harnesses/**/*.harness.ts`).
- **Mechanics**:
  - Any method returned by a harness factory matching seeding prefixes (`seed*`, `create*`, `write*`, `patch*`, `stamp*`) **MUST be declared `async` and return a `Promise`**.
- **Error Message**:
  > *"Harness seeding method '{{methodName}}' must be async and return a Promise. All seeding operations must be asynchronous."*

---

## 4. Deep Dive: The 4 Intentions Found Across Callsites

### Intention 1: Initial Scenario Seeding (Setup Before Navigation)
- **Call Sites**:
  - `followup.seedAndOpen`: **104 call sites** in `packages/web/src/flows/quest-chat/*.e2e.ts`.
  - `modalHarness.setupTest`: **6 call sites** in `packages/web/src/flows/home/quest-approved-modal.e2e.ts`.
  - `writeQuestFile`: **181 call sites** across 66 e2e files.
  - `createSessionFile`: **139 call sites** across 47 e2e files.
- **Current Defect**:
  - `modalHarness.setupTest` calls `quests.createQuest(...)` (which starts at `created`), and then immediately calls `quests.writeQuestFile({ status: 'review_observables', workItems: [...] })` using synchronous `fs.writeFileSync`.
  - It completely bypasses the real state transitions from `created` $\rightarrow$ `ready_for_review` $\rightarrow$ `review_observables`. If work items, outboxes, or database triggers were supposed to fire during those hops, they were completely skipped.
- **Proper Architecture**:
  - The harness method calls the declarative recipe framework underneath:
    ```ts
    const plan = recipe({ name: 'seed-quest-at-review' }, () => [
      dmRegistryBroker.quests.under({ guildId }).add(1, (q) => [
        q[0].set({
          status: 'review_observables',
          operations: DEFAULT_APPROVAL_OPERATIONS,
        }),
      ]),
    ])();
    await dmRegistryBroker.run(plan, dmTarget.apiTarget());
    ```
  - The recipe seeder's `questReachRouteBroker` automatically computes the shortest legal path to `review_observables`, walks each intermediate step through legitimate APIs, and registers child work items. The test receives a valid, production-faithful state.

---

### Intention 2: Live Transition Stimulation (Live Event Testing)
- **Concrete Example from User's Prompt**:
  `packages/web/src/flows/home/quest-approved-modal.e2e.ts:44, 74, 100, 141, 187, 212` (7 calls):
  ```ts
  // Test opens browser at review_observables:
  await nav.navigateToQuest({ urlSlug, questId });
  await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible();

  // Then patches status to test that the Begin Quest modal pops up via WebSocket:
  await quests.patchQuestStatus({ questId, status: 'approved' });
  await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible();
  ```
- **Current Defect**:
  - `patchQuestStatus` sends a raw HTTP `PATCH /api/quests/:id` with `{ status: 'approved' }`.
  - In a real environment, you cannot simply `PATCH` an arbitrary status without satisfying gate preconditions (e.g. `hasQuestGateContentGuard`, which checks for codeweaver operations).
  - Furthermore, if the quest transition requires multiple hops, a raw single `PATCH` fails or requires the harness to guess intermediate endpoints.
- **Proper Architecture**:
  - The test invokes a dedicated **Harness Transition Stimulator**:
    ```ts
    await modal.stimulateApproval({ questId });
    ```
  - The harness executes the transition through `questReachRouteBroker` on the live target, which hits the legitimate workflow endpoint (`POST /api/quests/:id/start`, `POST /api/quests/:id/approve`, etc.).
  - The server fires its real lifecycle hooks, emits the WebSocket frame, and the browser reacts to legitimate backend events.

---

### Intention 3: Out-of-Band State Staling (Concurrency / Disconnect Simulation)
- **Call Sites**:
  - `followup.setQuestStatusOnDisk`: **4 call sites** in `followup-rejection-shown-in-tab.e2e.ts` and `send-images-rejection.e2e.ts`.
  - `quests.rewindQuestStatus`: **1 call site** in `bughunt-begin-transition.e2e.ts:302`.
- **Why the Test Does This**:
  - In `followup-rejection-shown-in-tab.e2e.ts`:
    The user opened the "FOLLOW-UP" tab while the quest was at `blocked`. While the user's tab was still open, another actor/process transitioned the quest to `abandoned`. The user then types a follow-up message and hits Send. The test asserts that the backend returns HTTP 400 and the tab renders the rejection error text!
  - In `bughunt-begin-transition.e2e.ts`:
    The test simulates a server crash during the start-quest transition window, where the database/disk has advanced but the client needs to re-arm.
- **Current Defect**:
  - The test harness does `fs.writeFileSync(questFilePath, ...)` and manually appends an artificial line to `event-outbox.jsonl`.
- **Proper Architecture**:
  - This is **State Staling / Concurrent Actor Simulation**.
  - The harness exposes:
    ```ts
    await followup.simulateConcurrentAbandon({ questId });
    ```
  - For server crash simulation (`rewindQuestStatus`), provide an explicit tamper helper on the harness:
    ```ts
    await quests.tamperRewindQuestState({ questId, to: 'approved' });
    ```

---

### Intention 4: Time & Duration Simulation (UI Tick Tests)
- **Call Sites**:
  - `elapsed.stampWorkItems`: **40 call sites** across 10 files in `packages/web/src/flows/quest-chat/*.e2e.ts`.
- **Why the Test Does This**:
  - Tests verify that elapsed duration badges render `4m`, `1h`, or format elapsed execution time accurately.
- **Proper Architecture**:
  - `elapsedDurationHarness` provides async timestamp simulation:
    ```ts
    await elapsed.stampWorkItemsAsync({ questId, items: [...] });
    ```

---

### Intention 5: Fault Injection & Malformed Data (The Antagonist)
- **Call Sites**:
  - `writeUnparseableQuestFile`: **3 call sites** (`unreadable-quest-file-reported.e2e.ts`, `dispatch-survives-unparseable-quest-file.e2e.ts`).
  - `writeWardResultDetail`: **2 call sites** (`ward-crash-detail.e2e.ts`, `ward-discovery-mismatch-detail.e2e.ts`).
- **Why the Test Does This**:
  - Explicitly tests that the application reports error cards when a quest JSON file on disk is corrupted, contains invalid fields, or fails schema validation.
- **Proper Architecture**:
  - Dedicated **Tamper Helpers on the Harness**:
    ```ts
    await quests.tamperCorruptQuestFile({ questId, corruption: 'unparseable_json' });
    ```
  - Kept completely separate from the standard scenario seeder, making it explicit that contracts are intentionally violated for fault testing.

---

## 5. Concrete Before vs. After Code Examples

### Example: `packages/web/src/flows/home/quest-approved-modal.e2e.ts`

#### BEFORE (Sync direct writes + raw PATCH hacks)
```ts
test('VALID: modal appears when quest transitions to approved via WS', async ({ page, request }) => {
  const sessionId = `e2e-approved-${Date.now()}`;
  
  // 1. Direct sync filesystem writes: creates quest, then overwrites status to review_observables on disk
  const { questId, urlSlug, quests } = await modalHarness.setupTest({
    request,
    guildName: 'Approved Modal Guild',
    sessionId,
    status: 'review_observables',
  });

  const nav = navigationHarness({ page });
  await nav.navigateToQuest({ urlSlug, questId: String(questId) });
  await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

  // 2. RAW PATCH: Short-circuits state machine via bare HTTP PATCH
  await quests.patchQuestStatus({ questId, status: 'approved' });

  // Assert modal appears
  await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
    timeout: MODAL_TIMEOUT,
  });
});
```

#### AFTER (Strict Harness Boundary + Declarative Seeding Underneath)
```ts
test('VALID: modal appears when quest transitions to approved via WS', async ({ page, request }) => {
  const modal = questApprovedModalHarness({ request });
  const nav = navigationHarness({ page });

  // 1. The test only calls the harness (harness uses recipes to legitimately walk to review_observables):
  const { questId, urlSlug } = await modal.setupTest({
    guildName: 'Approved Modal Guild',
    status: 'review_observables',
  });

  // Action Site: Drives the browser
  await nav.navigateToQuest({ urlSlug, questId });
  await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

  // 2. The test asks harness to stimulate transition (harness calls real transition route):
  await modal.stimulateApproval({ questId });

  // Assert modal appears
  await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
    timeout: MODAL_TIMEOUT,
  });
});
```

---

## 6. Comprehensive Cleanup & Migration Roadmap

### Phase 1: Lint Rule & Mechanical Boundaries (`@dungeonmaster/local-eslint`)
1. Implement `@dungeonmaster-local/ban-direct-io-in-test-scenarios`:
   - Banned in test files: direct `fs`, `fetch`, `request.*` mutations, and direct `dmRegistryBroker` imports.
2. Implement `@dungeonmaster-local/ban-sync-seeding-methods`:
   - Banned in harness files: synchronous `() => void` seeding methods.
3. Configure both rules as `'warn'` in `eslint.config.js` during migration rollout.

### Phase 2: Upgrading Harnesses to Recipe-Backed Async APIs
1. **`questApprovedModalHarness`**:
   - `setupTest`: Rewritten to use recipe plan walking states legitimately.
   - `stimulateApproval`: Replaces raw `patchQuestStatus`.
2. **`questHarness`**:
   - `writeQuestFile` $\rightarrow$ `async seedQuestFile` using `dmRegistryBroker.quests.under(...).add(...)`.
   - `tamperCorruptQuestFile`: Async fault injection.
3. **`sessionHarness`**:
   - `createSessionFile`, `createSessionWithAssistantText`, subagent family methods $\rightarrow$ `async` using `dmRegistryBroker.sessions.under(...).add(...)`.
4. **`followupHarness`**:
   - `seedAndOpen`: Uses recipe seeder.
   - `simulateConcurrentAbandon`: Replaces raw `setQuestStatusOnDisk`.

### Phase 3: Migrate Callsites in Clean Batches
- **Batch 3A: Live Transition Stimulators**:
  - Replace all 7 `patchQuestStatus` calls in `quest-approved-modal.e2e.ts` and `followup-tab-bar.e2e.ts` with `await modal.stimulateApproval(...)` and `await followup.simulateConcurrentAbandon(...)`.
  - Replace `setQuestStatusOnDisk` in `followup-rejection-shown-in-tab.e2e.ts`.
- **Batch 3B: Session Harness Migration (~47 files)**:
  - Migrate all `createSessionFile`, `createSessionWithAssistantText`, and subagent calls to `await sessionHarness.*`.
- **Batch 3C: Scenario Seeder Migration (`followup.seedAndOpen` & `writeQuestFile`, ~66 files)**:
  - Update `followup.seedAndOpen` (104 call sites) and standard `writeQuestFile` calls to `await`.
- **Batch 3D: Time Simulation (`stampWorkItems`, 10 files)**:
  - Migrate `elapsed-duration.harness.ts` to `await elapsed.stampWorkItemsAsync(...)`.
- **Batch 3E: Fault Injection Tests (3 files)**:
  - Migrate `unreadable-quest-file-reported.e2e.ts` to `tamperCorruptQuestFile`.

### Phase 4: Final Enforcement & Rule Hardening
1. Delete deprecated sync direct writers (`writeQuestFile`, `createSessionFile`, `setQuestStatusOnDisk`, `patchQuestStatus`).
2. Upgrade both ESLint rules to `'error'`:
   - `@dungeonmaster-local/ban-direct-io-in-test-scenarios`: `'error'`
   - `@dungeonmaster-local/ban-sync-seeding-methods`: `'error'`
3. Run whole-repo `npm run ward` and `python3 scrolls/tools/seed-census.py --methods` to confirm 100% compliance.

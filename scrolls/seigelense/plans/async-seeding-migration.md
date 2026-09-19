# Plan: Comprehensive Async Seeding Migration, Boundary Delimitation & ESLint Rule

## 1. Overview & Core Architecture Law
The user stated the core architectural invariant:
> **"Everything in seeding should be async. We dont ever know what it needs or not needs and if it pivots to async, we have to rewrite a bunch of usage points. We should add a lint rule for that as well."**
> **"There needs to be a very clear layer between action site and data handling via seeder. Thats what the seed recipes are for."**

### Key Principles
1. **Seeding is Always Async (`Promise<...>`)**:
   - Any test harness method responsible for creating, writing, or seeding domain state MUST return a `Promise`.
   - Never expose synchronous `() => void` seeding methods in harnesses.
   - Decouples tests from underlying storage: whether state is backed by in-memory stubs, local disk, SQLite, PostgreSQL, or HTTP REST APIs, tests `await` the result uniformly.
2. **Strict Delimitation: Action Site vs. Data Handling via Seeders**:
   - **The Action Site (Test / Verification Driver)**: Drives the user actions, verifies the UI, clicks buttons, asserts outcomes, and triggers runs. It **must never** perform ad-hoc direct filesystem modifications or raw HTTP mutations to stand up a test scenario.
   - **Data Handling via Seeders (Recipes)**: Exclusively responsible for creating valid domain states, setting up models, and walking state transitions through proper contracts/endpoints.
3. **Explicit Segregation of Fault Injection (Tamper Layer / The Antagonist)**:
   - Tests specifically designed to verify parser crashes, corrupt JSON, or malformed schemas (e.g. `unreadable-quest-file-reported.e2e.ts`, `malformed-quest-file-reported.e2e.ts`) must NOT masquerade as standard seeding.
   - Dedicated asynchronous fault-injection helpers (e.g. `tamperQuestRawFile`, `writeUnparseableQuestFileAsync`) isolate storage-specific corruption and make clear that contract validation is intentionally bypassed.
4. **Standards & Prompts Enshrined**:
   - Enshrined in `scrolls/seigelense/siege-verification-remainder.md` (§ "The Core Law: Action Site vs. Data Handling via Seeders").
   - Verification drivers (flowrider, siegemaster) are drivers, not setup scripts. Reaching for direct `fs.writeFileSync` or direct fetches to bypass a missing recipe is an architectural violation.

---

## 2. Comprehensive Inventory of Direct Writes & Callsites to Convert

Based on the full repository audit across all 68 harnesses, here is the complete map of methods and callsites performing direct file operations (`fs.*`), raw HTTP mutations (`fetch`, `request.*`), or direct internal production broker imports:

### 2.1 `packages/web/test/harnesses/` (The Primary E2E Seeding Surface)

| Harness File | Method Name | Mechanism | Sync/Async | Call Sites | Conversion Target |
|---|---|---|---|---|---|
| `quest.harness.ts` | `writeQuestFile` | `fs.writeFileSync` | **Sync** | **181** | Convert to `async writeQuestFile` (or `seedQuestFile`) via `dmRegistryBroker.quests.under(...).add(...)` |
| `quest.harness.ts` | `patchQuestStatus` | Direct HTTP `request.patch` | Async | **7** | Convert to recipe `filter().set({ status })` walking transitions |
| `quest.harness.ts` | `writeUnparseableQuestFile` | `fs.writeFileSync` | **Sync** | **3** | Move to async fault injection helper (`tamperQuestUnparseableFile`) |
| `quest.harness.ts` | `writeWardResultDetail` | `fs.writeFileSync` | **Sync** | **2** | Convert to async recipe extra `withWardResultDetail` |
| `quest.harness.ts` | `rewindQuestStatus` | `fs.writeFileSync` | **Sync** | **1** | Convert to async fault injection tamper helper |
| `quest.harness.ts` | `seedInProgressWithOperations` | Calls `writeQuestFile` | **Sync** | 0 | Convert to async recipe plan |
| `session.harness.ts` | `createSessionFile` | `fs.writeFileSync` | **Sync** | **139** | Convert to `async createSessionFile` via `dmRegistryBroker.sessions.under(...).add(...)` |
| `session.harness.ts` | `cleanSessionDirectory` | `fs.rmSync` | **Sync** | **22** | Convert to async target teardown |
| `session.harness.ts` | `createSessionWithAssistantText` | `fs.writeFileSync` | **Sync** | **14** | Convert to `async createSessionWithAssistantText` via recipe |
| `session.harness.ts` | `createSubagentTailOnly` | `fs.writeFileSync` | **Sync** | **6** | Convert to `async createSubagentTailOnly` via subagent recipe |
| `session.harness.ts` | `appendMainSessionLine` | `fs.appendFileSync` | **Sync** | **5** | Convert to async stream appender adapter |
| `session.harness.ts` | `createAnsweredClarificationSession` | `fs.writeFileSync` | **Sync** | **2** | Convert to async recipe |
| `session.harness.ts` | `createSubagentTailMultiEntry` | `fs.writeFileSync` | **Sync** | **2** | Convert to async subagent recipe |
| `session.harness.ts` | `appendSubagentLine` | `fs.appendFileSync` | **Sync** | **2** | Convert to async stream appender adapter |
| `session.harness.ts` | `createSubagentSessionFiles` | `fs.writeFileSync` | **Sync** | **1** | Convert to async subagent recipe |
| `session.harness.ts` | `createInFlightSubagentSessionFiles` | `fs.writeFileSync` | **Sync** | **1** | Convert to async subagent recipe |
| `session.harness.ts` | `createMultiSubagentSessionFiles` | `fs.writeFileSync` | **Sync** | **1** | Convert to async subagent recipe |
| `session.harness.ts` | `createNestedSubagentSessionFiles` | `fs.writeFileSync` | **Sync** | **1** | Convert to async `withNestedChain` recipe |
| `followup.harness.ts` | `seedAndOpen` | Calls `writeQuestFile` | Async | **104** | Update to `await writeQuestFile` recipe |
| `followup.harness.ts` | `setQuestStatusOnDisk` | `fs.writeFileSync` | **Sync** | **5** | Convert to async recipe transition walk |
| `followup.harness.ts` | `seedTavernkeeperSession` | Calls `sessionHarness` | **Sync** | **4** | Convert to `await sessionHarness` |
| `followup.harness.ts` | `streamAssistantTurn` | Calls `sessionHarness` | **Sync** | **2** | Convert to `await sessionHarness` |
| `elapsed-duration.harness.ts` | `stampWorkItems` | `fs.readFileSync` + `writeFileSync` | **Sync** | **53** | Convert to async recipe modifier |
| `subagent-duration.harness.ts` | `seedChain` | `fs.writeFileSync` | **Sync** | **29** | Convert to async subagent recipe |
| `subagent-duration.harness.ts` | `seedNestedChain` | `fs.writeFileSync` | **Sync** | **11** | Convert to async subagent recipe |
| `subagent-duration.harness.ts` | `appendNotification` | `fs.appendFileSync` | **Sync** | **4** | Convert to async subagent event recipe |
| `subagent-duration.harness.ts` | `seedSiblingChains` | `fs.writeFileSync` | **Sync** | **2** | Convert to async subagent recipe |
| `rate-limits.harness.ts` | `writeLedger` | `fs.writeFileSync` | **Sync** | **12** | Convert to async rate-limits seeder |
| `rate-limits.harness.ts` | `writeSnapshot` | `fs.writeFileSync` | **Sync** | **2** | Convert to async rate-limits seeder |
| `quest-spec-readonly.harness.ts`| `seedDesignDecisionsAndTooling` | `fs.writeFileSync` | **Sync** | **2** | Convert to async recipe fields setter |

### 2.2 Backend & Tooling Package Harnesses (`server`, `orchestrator`, `ward`, `hooks`)

| Package / Harness File | Method Name | Mechanism | Sync/Async | Call Sites | Conversion Target |
|---|---|---|---|---|---|
| `server/server-app.harness.ts` | `seedQuest` | `fs.writeFileSync` | **Sync** | **7** | Convert to `async seedQuestFields` via recipe framework |
| `server/server-app.harness.ts` | `seedImageFile` | `fs.writeFileSync` | **Sync** | **6** | Convert to async asset seeder adapter |
| `server/server-app.harness.ts` | `registerRealGuild` | Direct import of `StartOrchestrator.addGuild` | Async | **1** | Replace direct orchestrator import with seeder API |
| `server/server-app.harness.ts` | `seedSymlinkEscapingImagesDir` | `fs.writeFileSync` + `symlinkSync` | **Sync** | **1** | Convert to async fault-injection helper |
| `orchestrator/orchestration-quest.harness.ts` | `createGuildAndQuest` | Direct import of `GuildAddResponder`, `QuestUserAddResponder` | Async | **5** | Route through recipe/seeder boundary |
| `orchestrator/orchestration-quest.harness.ts` | `seedFlowsAndComments` | Direct import of `questPersistBroker`, `questLoadBroker` | Async | **2** | Route through recipe/seeder boundary |
| `orchestrator/quest-seed.harness.ts` | `seed` | `fs.writeFileSync` | **Sync** | **2** | Convert to async quest seeder |
| `orchestrator/orchestration-environment.harness.ts`| `seedQuestRepoPackages` | `fs.writeFileSync` | **Sync** | **7** | Convert to async fixture seeder |
| `orchestrator/orchestration-environment.harness.ts`| `seedRepoRootGuild` | Direct import of `guildAddBroker` | Async | **1** | Route through recipe/seeder boundary |
| `orchestrator/quest-outbox.harness.ts` | `appendQuestLine` | `fs.appendFileSync` | **Sync** | **1** | Convert to async outbox seeder |
| `ward/e2e-artifacts.harness.ts` | `seedDir`, `seedFile` | `fs.writeFileSync`, `utimesSync` | **Sync** | **1** | Convert to async artifact fixture helper |
| `hooks/transcript.harness.ts` | `write` | `fs.writeFileSync` | **Sync** | **4** | Convert to async transcript seeder |
| `hooks/fresh-project.harness.ts`| `create` | `fs.writeFileSync` | **Sync** | **1** | Convert to async project fixture helper |

---

## 3. ESLint Rule: `@dungeonmaster-local/ban-sync-seeding-methods`

### Purpose
Mechanically prohibit any synchronous seeding method in test harnesses across the monorepo.

### Package Location
`packages/local-eslint/`

### Rule Specifications
- **Name**: `ban-sync-seeding-methods` (exported under plugin `@dungeonmaster-local/ban-sync-seeding-methods`)
- **Scope File Guard**: `packages/**/test/**/harnesses/**/*.harness.ts`
- **Target Identifiers**: Methods returned by a harness factory matching prefixes:
  - `seed*` (e.g., `seedQuest`, `seedChain`, `seedInProgressWithOperations`)
  - `create*` (e.g., `createQuest`, `createSessionFile`, `createSubagentSessionFiles`)
  - `write*` (e.g., `writeQuestFile`, `writeWardResultDetail`, `writeLedger`)
  - `patch*` (e.g., `patchQuestStatus`)
  - `stamp*` (e.g., `stampWorkItems`)
- **Assertion**:
  - The function must be declared `async` (`node.value.async === true`) OR return a `Promise` in its TypeScript return type annotation.
  - If a harness method matching the seeding pattern returns non-Promise (e.g. `void`), ESLint flags an error:
    `"Harness seeding method '{{methodName}}' must be async and return a Promise. All seeding operations must be asynchronous."`

### Unit Tests
- `packages/local-eslint/src/brokers/rule/ban-sync-seeding-methods/rule-ban-sync-seeding-methods-broker.test.ts`
  - Valid: `seedQuest: async () => {}`
  - Valid: `createQuest: async () => {}`
  - Valid: `extractUrlSlug: () => {}` (ignored: not a seeding/creation method)
  - Invalid: `writeQuestFile: () => void` (triggers error)
  - Invalid: `createSessionFile: () => void` (triggers error)
  - Invalid: `seedChain: () => void` (triggers error)

---

## 4. Phased Execution & Call-Site Migration Batches

To guarantee green builds with zero regressions across the monorepo at every commit:

### Phase 1: Infrastructure, Documentation & ESLint Rule (Groundwork)
1. **Standards Enshrined**: Confirm `scrolls/seigelense/siege-verification-remainder.md` (§ "The Core Law: Action Site vs. Data Handling via Seeders").
2. **ESLint Rule**: Implement `rule-ban-sync-seeding-methods` in `packages/local-eslint`.
3. **Register in ESLint**: Register in `LocalEslintCreateResponder` and root `eslint.config.js` (initially `'warn'` to permit step-by-step migration).
4. **Verify**: `npm run ward -- -- packages/local-eslint`.

### Phase 2: Session Harness & Transcripts Migration (~47 files, 170+ callsites)
1. **Harness Conversion**: Update `packages/web/test/harnesses/session/session.harness.ts` to make all `createSession*`, `append*SessionLine`, and subagent methods `async`.
2. **Recipe Plumbing**: Route standard session and subagent JSONL writes through `dmRegistryBroker.sessions.under(...).add(...)`.
3. **Callsite Updates**: Update all ~47 e2e specs that call `sessionHarness` methods to `await`.
4. **Subagent Duration**: Update `subagent-duration.harness.ts` methods (`seedChain`, `seedNestedChain`) to `async` and update its call sites.
5. **Verify**: `npm run ward -- --only e2e -- <session specs>`.

### Phase 3: Quest Harness & Secondary Web Harnesses (~66 files, 250+ callsites)
1. **Harness Conversion**: Update `questHarness.writeQuestFile` to `async` and return `Promise<Quest>`. Route through `dmRegistryBroker.quests.under(...).add(...)` and walk transitions.
2. **Fault Injection Isolation**: Extract `writeUnparseableQuestFile` and `rewindQuestStatus` into dedicated async fault-injection tamper helpers (`tamperQuestUnparseableFile`, `tamperQuestStatus`).
3. **Secondary Harnesses**:
   - Update `followup.harness.ts` (`seedAndOpen`, `setQuestStatusOnDisk`) to `async`.
   - Update `elapsed-duration.harness.ts` (`stampWorkItems`) to `async`.
   - Update `rate-limits.harness.ts` (`writeLedger`, `writeSnapshot`) to `async`.
   - Update `quest-spec-readonly.harness.ts` (`seedDesignDecisionsAndTooling`) to `async`.
4. **Callsite Migration**: Update the e2e specs in 2 batches (~33 files each) to `await` the async calls.
5. **Verify**: `npm run ward -- --only e2e -- <quest specs>`.

### Phase 4: Backend & Tooling Package Harnesses (`server`, `orchestrator`, `ward`, `hooks`)
1. **Server Harness**: Update `server-app.harness.ts` (`seedQuest`, `seedImageFile`, `seedSymlinkEscapingImagesDir`) to `async` and eliminate direct orchestrator responder imports.
2. **Orchestrator Harnesses**: Update `orchestration-quest.harness.ts`, `quest-seed.harness.ts`, and `orchestration-environment.harness.ts` to `async` and route domain data through the recipe/seeder boundary.
3. **Ward & Hooks**: Update `e2e-artifacts.harness.ts`, `transcript.harness.ts`, and `fresh-project.harness.ts` to `async`.
4. **Verify**: `npm run ward -- --only integration,unit -- packages/server packages/orchestrator packages/ward packages/hooks`.

### Phase 5: Hardening & Final Enforcement
1. **Upgrade ESLint Rule**: Switch `@dungeonmaster-local/ban-sync-seeding-methods` from `'warn'` to `'error'`.
2. **Census Verification**: Run `python3 scrolls/tools/seed-census.py --methods` to confirm all convertible methods route through the framework and no sync direct writers remain.
3. **Full Quality Pass**: Run `npm run ward -- --committed` across the whole repository.

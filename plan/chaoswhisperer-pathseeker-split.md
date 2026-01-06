# Plan: Split Pathseeker into ChaosWhisperer + PathSeeker

## Summary

Split the current Pathseeker agent (which does both discovery AND file mapping) into two specialized agents:

- **ChaosWhisperer**: User dialogue, observable definition, contracts, tooling requirements
- **PathSeeker**: Repo analysis, file mapping, dependency steps with many-to-many task links

---

## User Decisions (Confirmed)

1. **Data Model**: Separate `steps[]` array with many-to-many links to `tasks[]`
2. **Observables**: All types (API, DB, Browser, File, Process, etc.) + ChaosWhisperer can suggest new tooling
3. **Modification**: Modify quest in place, preserve IDs

---

## Final Data Model

```
Quest
├── contexts[] ──────────────────────── WHERE (reusable environments)
│   ├── id: ContextId (uuid)
│   ├── name: string ─────────────────── "User Admin - Permissions Section"
│   ├── description: string ──────────── Human-readable location description
│   └── locator: NESTED ──────────────── { page?: '/admin/users', section?: '#permissions' }
│
├── observables[] ───────────────────── BDD-STYLE, defined by ChaosWhisperer
│   ├── id: ObservableId (uuid)
│   ├── contextId: ContextId ─────────── ID ref to context (GIVEN)
│   ├── trigger: string ──────────────── Action description (WHEN) - "Click 'Edit' button"
│   ├── dependsOn[]: ObservableId[] ──── ID refs for chained observables
│   └── outcomes[]: NESTED array ─────── Multiple verifications (THEN)
│       ├── type: OutcomeType ─────────── 'api-call' | 'db-query' | 'ui-state' | ...
│       ├── description: string
│       └── criteria: NESTED ──────────── Type-specific verification rules
│
├── tasks[] ─────────────────────────── Defined by ChaosWhisperer
│   ├── id: TaskId (uuid)
│   ├── name, type, description
│   ├── dependencies[]: TaskId[] ──────── ID refs to other tasks
│   └── observableIds[]: ObservableId[] ─ ID refs to observables this task requires
│
├── toolingRequirements[] ────────────── Identified by ChaosWhisperer
│   ├── id: ToolingRequirementId (uuid)
│   └── requiredByObservables[]: ObservableId[] ─ ID refs to observables
│
└── steps[] ──────────────────────────── Defined by PathSeeker
    ├── id: StepId (uuid)
    ├── taskLinks[]: TaskId[] ─────────── ID refs to tasks (many-to-many)
    ├── observablesSatisfied[]: ObservableId[] ─ ID refs to observables this step enables
    ├── dependsOn[]: StepId[] ─────────── ID refs to other steps
    └── filesToCreate/Modify[]: FilePath[] ─ string paths (not IDs)
```

**BDD Structure (Given/When/Then):**

```
GIVEN: context (where the user is)
WHEN:  trigger (what action they take)
THEN:  outcomes[] (what should happen - multiple verifications)
```

**Example Observable:**

```json
{
  "id": "obs-edit-permission",
  "contextId": "ctx-admin-permissions",
  "trigger": "Click 'Edit' button on permission row",
  "outcomes": [
    {
      "type": "api-call",
      "method": "GET",
      "endpoint": "/api/permissions/{id}"
    },
    {
      "type": "ui-state",
      "selector": "[data-modal='edit-permission']",
      "state": "visible"
    }
  ]
}
```

**Legend:**

- `NESTED` = Full object embedded inline
- `ID refs` = UUID string pointing to another entity
- `FilePath[]` = Plain strings (file paths), not IDs

**Relationships:**

- Context → Observables: "These observables operate in this environment"
- Task → Observables: "This task is complete when these observables pass"
- Step → Tasks: "This step contributes to these tasks"
- Step → Observables: "This step enables verification of these observables"
- Observable → Observable: "This observable requires prior observable to pass (chaining)"

---

## Outcome Types (12 Built-in + Custom)

Each observable can have multiple **outcomes** in its `outcomes[]` array. These are the verifiable results of a trigger
action.

| Type            | Purpose                     | Key Criteria                                   | Tooling                               |
|-----------------|-----------------------------|------------------------------------------------|---------------------------------------|
| `api-call`      | HTTP endpoint verification  | method, endpoint, expectedStatus, expectedBody | Built-in (fetch)                      |
| `file-exists`   | File system state           | path, condition, expectedContent               | Built-in (fs)                         |
| `environment`   | Env variable state          | variable, condition, expectedValue             | Built-in                              |
| `log-output`    | Console/log verification    | source, pattern, patternType                   | Built-in                              |
| `process-state` | Service/port verification   | port, processName, healthEndpoint              | Built-in (net)                        |
| `performance`   | Performance metrics         | metric, threshold, operator                    | Built-in                              |
| `ui-state`      | Browser/Playwright UI       | selector, expectedState, action                | **@dungeonmaster/outcome-playwright** |
| `cache-state`   | Cache (Redis)               | key, condition, expectedValue                  | **@dungeonmaster/outcome-redis**      |
| `db-query`      | Database state verification | queryPattern, expectedRowCount, expectedValues | Via toolingRequirements               |
| `queue-message` | Message queue state         | queueName, messageType, expectedPayload        | Via toolingRequirements               |
| `external-api`  | External API mock calls     | service, endpoint, expectedCall                | Via toolingRequirements               |
| `custom`        | New tooling needed          | toolName, toolingRequirementId, parameters     | Via toolingRequirements               |

**Default Packages (installed with dungeonmaster):**

- `@dungeonmaster/outcome-playwright` - Browser/UI verification via Playwright
- `@dungeonmaster/outcome-redis` - Cache state verification via Redis

**On-demand (via toolingRequirements[]):**

- DB drivers (pg, mysql2, better-sqlite3, mongodb)
- Queue clients (amqplib, bullmq)
- Mock libraries (nock, msw)
- Custom tools as needed

---

## Implementation Phases

### Phase 1: Contracts (packages/shared)

**Create:**

```
packages/shared/src/contracts/
├── context/
│   ├── context-contract.ts             # Reusable environments (WHERE)
│   ├── context-contract.test.ts
│   └── context-contract.stub.ts
├── observable/
│   ├── observable-contract.ts          # BDD observables (trigger + outcomes[])
│   ├── observable-contract.test.ts
│   └── observable-contract.stub.ts
├── outcome/
│   ├── outcome-contract.ts             # 12 outcome types + criteria
│   ├── outcome-contract.test.ts
│   └── outcome-contract.stub.ts
├── tooling-requirement/
│   ├── tooling-requirement-contract.ts # Tool/package requirements
│   ├── tooling-requirement-contract.test.ts
│   └── tooling-requirement-contract.stub.ts
└── dependency-step/
    ├── dependency-step-contract.ts     # Steps with taskLinks[]
    ├── dependency-step-contract.test.ts
    └── dependency-step-contract.stub.ts
```

**Modify:**

- `quest-contract.ts` - Add `contexts[]`, `observables[]`, `steps[]`, `toolingRequirements[]`
- `quest-task-contract.ts` - Add `observableIds[]` array (ID refs, not nested)
- `task-type-contract.ts` - Sync with add-quest-input (currently out of sync!)
    - Current task-type: `implementation | testing | documentation | refactoring`
    - Current add-quest-input: `discovery | implementation | testing | review | documentation`
    - Target: `discovery | implementation | testing | review | documentation | configuration | migration | refactoring`
- `contracts.ts` barrel file - Export all new contracts

### Phase 2: Storage + MCP Tools (packages/mcp)

**Storage Migration: File-based → LowDB**

Current system writes individual JSON files. Migrate to LowDB for upsert support:

```typescript
// npm install lowdb
import {Low} from 'lowdb'
import {JSONFile} from 'lowdb/node'

const db = new Low(new JSONFile('.dungeonmaster-quests/db.json'), {quests: []})
await db.read()

// Find quest
const quest = db.data.quests.find(q => q.id === questId)

// Update and persist
quest.tasks.push(newTask)
await db.write()
```

**Create:**

```
packages/mcp/src/
├── adapters/lowdb/
│   ├── lowdb-adapter.ts              # LowDB wrapper
│   └── lowdb-adapter.proxy.ts
├── contracts/
│   ├── get-quest-input/
│   │   └── get-quest-input-contract.ts
│   ├── get-quest-result/
│   │   └── get-quest-result-contract.ts
│   ├── modify-quest-input/
│   │   └── modify-quest-input-contract.ts
│   └── modify-quest-result/
│       └── modify-quest-result-contract.ts
└── brokers/quest/
    ├── get/
    │   ├── quest-get-broker.ts
    │   └── quest-get-broker.test.ts
    └── modify/
        ├── quest-modify-broker.ts
        └── quest-modify-broker.test.ts
```

**Modify:**

- `mcp-tools-statics.ts` - Add `get-quest`, `modify-quest` tool definitions
- `start-mcp-server.ts` - Add handlers for new tools
- `package.json` - Add `lowdb` dependency
- `quest-add-broker.ts` - **Switch to LowDB** (currently writes individual files)
- `add-quest-input-contract.ts` - Add `contexts[]`, `observables[]` fields

**MCP Tools (3 total for quests):**

```typescript
// add-quest: Create new quest (MODIFIED - add contexts/observables)
{
    title: string,
        userRequest
:
    string,
        contexts ? : Context[],
        observables ? : Observable[],
        tasks ? : Task[]
} → {
    questId: string
}

// get-quest: Read quest by ID (NEW)
{
    questId: string
} → {
    quest: Quest
}

// modify-quest: Upsert by ID (NEW)
{
    questId: string,
        contexts ? : Context[],      // upsert: existing ID → update, new ID → add
        observables ? : Observable[],
        tasks ? : Task[],
        steps ? : Step[],
        toolingRequirements ? : ToolingRequirement[]
} → {
    success: boolean
}
```

**Upsert semantics:**

- Items with existing ID in quest → **update** (merge fields)
- Items with new ID → **add** to array
- Items in quest but not in input → **unchanged** (no deletions)
- To delete: add separate `$pull` field with IDs to remove (optional)

### Phase 3: ChaosWhisperer Agent (packages/cli)

**Create:**

```
packages/cli/src/
├── statics/chaoswhisperer-prompt/
│   ├── chaoswhisperer-prompt-statics.ts
│   └── chaoswhisperer-prompt-statics.test.ts
└── brokers/agent/chaoswhisperer/spawn/
    ├── chaoswhisperer-spawn-broker.ts
    ├── chaoswhisperer-spawn-broker.test.ts
    └── chaoswhisperer-spawn-broker.proxy.ts
```

**ChaosWhisperer Prompt Focus:**

ChaosWhisperer is the **BDD (Behavior-Driven Development) architect** responsible for:

1. **Socratic Dialogue** - Interactive Q&A to understand user intent
2. **Context Definition** - Define reusable environments (WHERE things happen)
    - Pages, sections, pre-existing UI state
    - Shared across multiple observables
3. **BDD Observable Creation** - Structure acceptance criteria as Given/When/Then:
    - **GIVEN** (context): Where the user is, what state exists
    - **WHEN** (trigger): What action the user takes
    - **THEN** (outcomes[]): Multiple verifiable results of that action
4. **Observable Chaining** - Define dependencies between observables
    - "Click button → modal opens" must pass before "submit modal → API call"
5. **System Contracts** - Define interfaces between systems
    - API shapes, request/response formats
    - Data flows between frontend ↔ backend ↔ database
6. **Tooling Assessment** - Identify when new packages/tools are needed
    - Playwright for browser verification
    - Database drivers for DB queries
    - Custom tools for novel verification needs
7. **Task Grouping** - Bundle related observables into coherent tasks

**MCP Tool Usage:**

- `add-quest` - Create initial quest with contexts, observables, tasks
- `modify-quest` - Refine as dialogue evolves (upsert by ID, preserve existing)

### Phase 4: PathSeeker Narrowing (packages/cli)

**Modify:**

- `pathseeker-prompt-statics.ts` - Narrow to file mapping only

**Create:**

```
packages/cli/src/brokers/agent/pathseeker/spawn/
├── pathseeker-spawn-broker.ts
├── pathseeker-spawn-broker.test.ts
└── pathseeker-spawn-broker.proxy.ts
```

**PathSeeker Prompt Focus:**

- Read quest with contexts, observables, tasks (from ChaosWhisperer)
- Examine repo state using MCP discover tools
- Map tasks/observables to concrete files
- Create dependency steps with:
    - `taskLinks[]` - Many-to-many link to tasks
    - `observablesSatisfied[]` - Which observables this step addresses
    - `dependsOn[]` - Step dependencies
    - `filesToCreate[]`, `filesToModify[]` - File operations
- Call `modify-quest` to upsert `steps[]`

### Phase 5: Agent Orchestration (packages/cli)

**Create:**

```
packages/cli/src/
├── brokers/agent/orchestrate/
│   ├── agent-orchestrate-broker.ts
│   ├── agent-orchestrate-broker.test.ts
│   └── agent-orchestrate-broker.proxy.ts
└── guards/is-quest-ready-for-pathseeker/
    ├── is-quest-ready-for-pathseeker-guard.ts
    └── is-quest-ready-for-pathseeker-guard.test.ts
```

**Orchestration Flow:**

```
User Input
    │
    ▼
┌─────────────────────┐
│   ChaosWhisperer    │  Spawned first
│   (BDD Architect)   │  Uses: add-quest, modify-quest
└─────────┬───────────┘
          │ Quest has contexts[], observables[], tasks[]
          ▼
┌─────────────────────┐
│   PathSeeker        │  Spawned after ChaosWhisperer exits
│   (File Mapping)    │  Uses: modify-quest (upsert steps[])
└─────────┬───────────┘
          │ Quest has steps[] with taskLinks[]
          ▼
    Implementation Ready
```

**Guard: isQuestReadyForPathseekerGuard:**

```typescript
// Returns true when:
// 1. Quest exists
// 2. observables[].length > 0
// 3. tasks[].length > 0
// 4. Each task has at least one observableId
```

---

## File Summary

### New Packages to Create

| Package                             | Purpose                                |
|-------------------------------------|----------------------------------------|
| `@dungeonmaster/outcome-playwright` | Browser/UI verification via Playwright |
| `@dungeonmaster/outcome-redis`      | Cache state verification via Redis     |

### Create (25+ files + tests)

| Package            | Path                                                                        | Purpose                              |
|--------------------|-----------------------------------------------------------------------------|--------------------------------------|
| shared             | contracts/context/context-contract.ts                                       | Reusable environments (WHERE)        |
| shared             | contracts/observable/observable-contract.ts                                 | BDD observables (trigger + outcomes) |
| shared             | contracts/outcome/outcome-contract.ts                                       | 12 outcome types + criteria          |
| shared             | contracts/tooling-requirement/tooling-requirement-contract.ts               | Tool requirements                    |
| shared             | contracts/dependency-step/dependency-step-contract.ts                       | Steps with taskLinks                 |
| mcp                | adapters/lowdb/lowdb-adapter.ts                                             | LowDB wrapper for JSON persistence   |
| mcp                | contracts/get-quest-input/get-quest-input-contract.ts                       | Get quest input schema               |
| mcp                | contracts/get-quest-result/get-quest-result-contract.ts                     | Get quest result type                |
| mcp                | contracts/modify-quest-input/modify-quest-input-contract.ts                 | Upsert input schema                  |
| mcp                | contracts/modify-quest-result/modify-quest-result-contract.ts               | Result type                          |
| mcp                | brokers/quest/get/quest-get-broker.ts                                       | Quest retrieval logic                |
| mcp                | brokers/quest/modify/quest-modify-broker.ts                                 | Quest upsert logic                   |
| cli                | statics/chaoswhisperer-prompt/chaoswhisperer-prompt-statics.ts              | BDD architect prompt                 |
| cli                | brokers/agent/chaoswhisperer/spawn/chaoswhisperer-spawn-broker.ts           | Spawn logic                          |
| cli                | brokers/agent/pathseeker/spawn/pathseeker-spawn-broker.ts                   | Spawn logic                          |
| cli                | brokers/agent/orchestrate/agent-orchestrate-broker.ts                       | Pipeline control                     |
| cli                | guards/is-quest-ready-for-pathseeker/is-quest-ready-for-pathseeker-guard.ts | Handoff guard                        |
| outcome-playwright | src/adapters/playwright/playwright-adapter.ts                               | Playwright browser control           |
| outcome-playwright | src/brokers/verify/ui-state-verify-broker.ts                                | UI state verification                |
| outcome-redis      | src/adapters/redis/redis-adapter.ts                                         | Redis client wrapper                 |
| outcome-redis      | src/brokers/verify/cache-state-verify-broker.ts                             | Cache state verification             |

### Modify (12 files)

| Package | Path                                                   | Changes                                                       |
|---------|--------------------------------------------------------|---------------------------------------------------------------|
| shared  | contracts/quest/quest-contract.ts                      | Add contexts[], observables[], steps[], toolingRequirements[] |
| shared  | contracts/quest-task/quest-task-contract.ts            | Add observableIds[] (ID refs)                                 |
| shared  | contracts/task-type/task-type-contract.ts              | Sync with add-quest-input, add configuration, migration       |
| shared  | contracts.ts                                           | Export all new contracts (barrel file)                        |
| mcp     | contracts/add-quest-input/add-quest-input-contract.ts  | Add contexts[], observables[] fields                          |
| mcp     | brokers/quest/add/quest-add-broker.ts                  | Switch to LowDB, handle new fields                            |
| mcp     | statics/mcp-tools/mcp-tools-statics.ts                 | Add get-quest, modify-quest tools                             |
| mcp     | startup/start-mcp-server.ts                            | Add handlers for new tools                                    |
| mcp     | package.json                                           | Add lowdb dependency                                          |
| cli     | statics/pathseeker-prompt/pathseeker-prompt-statics.ts | Narrow to file mapping only                                   |
| cli     | brokers/agent/spawn/agent-spawn-broker.ts              | May need to reference orchestrator                            |
| root    | package.json                                           | Add outcome-playwright, outcome-redis as workspace packages   |

---

## Execution Order

1. **Phase 1**: Contracts first (shared package) - foundation for everything
2. **Phase 2**: modify-quest MCP tool - enables iterative quest updates
3. **Phase 3**: ChaosWhisperer prompt + spawn broker
4. **Phase 4**: PathSeeker prompt narrowing + spawn broker
5. **Phase 5**: Agent orchestration + handoff guard
6. **Testing**: Integration tests for full pipeline

Build shared package after Phase 1: `npm run build --workspace=@dungeonmaster/shared`

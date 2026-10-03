# chronicle-llm: Comprehensive Implementation Plan

Status: Ready for orchestration.  
Target Home: `<repoRoot>/.dungeonmaster` (dogfood) / `~/.dungeonmaster` (installed).  
Relevant specs: [design.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/design.md), [schema.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/schema.md), [manual-test-plan.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/manual-test-plan.md), [followup-home-state-to-db.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/followup-home-state-to-db.md), and [field-maps/](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/field-maps/).

---

### Session Hand-off State (Read First)

- **Active Worktree:** `/home/brutus-home/projects/codex-of-consentient-craft/worktrees/chronicle-llm` on branch `chronicle-llm`.
- **Master Merge Status:** `master` has been merged into `chronicle-llm` (`898f78823`).
- **Completed Work:**
  - **Phase 0:** All tasks (0.1–0.5) complete.
  - **Phase 1 Waves #1–#6:** Complete (`1.1.1` through `1.6.1`). Packages `@dungeonmaster/chronicle-llm`, `@dungeonmaster/chronicle-llm-claude-code`, and `@dungeonmaster/chronicle-llm-antigravity` are scaffolded with tests passing.
- **PRIORITY FIX BEFORE CONTINUING (Vite Browser Build Blocker):**
  - **Problem:** `npm run build` fails at `@dungeonmaster/web` because Vite externalizes Node built-in `buffer` into `__vite-browser-external`, but `packages/@gateway/node/src/buffer/buffer-schema.ts` has `import { Buffer } from 'buffer'`.
  - **Cause:** `@dungeonmaster/web` imports from `@dungeonmaster/shared/contracts`. The barrel exports `blobStoreReadResultContract` (added in Task 1.2.2), which transitively imports `bufferSchema` from `#gateway/node/buffer`.
  - **Fix to Apply First:** Dispatch a worker to fix `bufferSchema` in `packages/@gateway/node/src/buffer/` so Vite bundling does not fail on `import { Buffer } from 'buffer'` (e.g. guard against undefined Buffer / use `Uint8Array` compatible schema for browser builds), and verify `npm run build` succeeds.
- **Immediate Next Step (After Vite Fix):** **Phase 1 Wave #7 (Foundation Brokers & Spool Hooks)**:
  - Tasks in this wave: `1.7.1`, `1.7.2`, `1.7.3`, `1.8.1`, `1.9.2`.
  - **No Planner Needed:** All tasks and files are fully specified below in this document. Proceed directly to worker dispatch.
  - **Parallel Dispatch:** Dispatch workers up to active concurrency limit in a single `invoke_subagent` call (e.g. 1.7.1, 1.7.2, 1.7.3), then continuously feed in remaining tasks (1.8.1, 1.9.2) as workers complete.
  - **No Per-Row Reviewer:** Commit row atomically once all 5 tasks pass scoped ward.
- **Standing Operator Rules:** Strict adherence to [`.agents/skills/operator/SKILL.md`](file:///home/brutus-home/projects/codex-of-consentient-craft/.agents/skills/operator/SKILL.md). Parent is strictly administrative. Workers must call `get-architecture`, `get-testing-patterns`, and `get-folder-detail` before writing code. Full bare `npm run ward` runs only at Level 3 feature completion before merging into master.

---

### Execution Progress Tracker

```text
Phase 0 (Standalone Quick Fixes · [COMPLETE])
  #1  0.1 [✓]  0.2 [✓]  0.3 [✓]
  #2  0.4 [✓]  0.5 [✓]

Phase 1 (The Core Data Layer · [IN PROGRESS])
  #1  1.1.1 [✓]  1.1.2 [✓]
  #2  1.2.1 [✓]  1.2.2 [✓]
  #3  1.3.1 [✓]  1.3.2 [✓]
  #4  1.4.1 [✓]  1.4.2 [✓]
  #5  1.5.1 [✓]  1.5.2 [✓]
  #6  1.6.1 [✓]
  #7  1.7.1 [ ]  1.7.2 [ ]  1.7.3 [ ]  1.8.1 [ ]  1.9.2 [ ]
  #8  1.8.2 [ ]
  #9  1.9.1 [ ]
  #10 1.10.1 [ ] 1.10.2 [ ]
  #11 1.11 (DQ Review) [ ]

Phase 1b (Reasoning Effort Migration · [PENDING])
  #1  1b.1 [ ]
  #2  1b.2 [ ]
  #3  1b.3 [ ]

Phase 2 (Server Reads, Quest Health & View Context · [PENDING])
  #1  2.1 [ ]
  #2  2.2 [ ]
  #3  2.3 [ ]  2.5 [ ]
  #4  2.4 [ ]
  #5  2.6 [ ]

Phase 3 (Chat UI Migration · [PENDING])
  #1  3.1 [ ]
  #2  3.2 [ ]
  #3  3.3 [ ]

Phase 4 (Timeline & Command Center · [PENDING])
  #1  4.1 [ ]  4.2 [ ]
  #2  4.3 [ ]

Phase 5 (First-Party Sources & Rate Limits · [PENDING])
  #1  5.1 [ ]  5.2 [ ]
  #2  5.3 [ ]

Phase 6 (Next Harness Pluggability · [PENDING])
  #1  6.1 [ ]
```

---

## 0. Strict Dungeonmaster Architecture & Testing Guardrails

All code generated during orchestration
**MUST** comply with the Dungeonmaster architecture (`get-architecture`), testing patterns (`get-testing-patterns`), and folder-specific constraints (`get-folder-detail`):

### 0.1 Folder Types & Structural Rules

1. **Forbidden
   Folders:** Never create `utils/`, `helpers/`, `lib/`, `common/`, `types/`, `models/`, `validators/`, or `services/`.
2. **Canonical Folder Mapping:**
    - **`brokers/` (Depth: exactly 2
      levels):** `brokers/[domain]/[action]/[domain]-[action]-broker.ts`. Business logic orchestration. Requires `[domain]-[action]-broker.proxy.ts` and `[domain]-[action]-broker.test.ts`.
    - **`transformers/` (Depth: exactly 1
      level):** `transformers/[domain]/[domain]-transformer.ts`. Pure data transformations. Requires `[domain]-transformer.test.ts`. Proxy is
      **forbidden**. Normalizers belong here as pure record transformers.
    - **`guards/` (Depth: exactly 1
      level):** `guards/[domain]/[domain]-guard.ts`. Pure boolean functions. Must start with `is*`, `has*`, `can*`, `should*`, `will*`, `was*`. Requires `[domain]-guard.test.ts`. Proxy is
      **forbidden**.
    - **`contracts/` (Depth: exactly 1
      level):** `contracts/[domain]/[domain]-contract.ts`. Zod schemas and branded types. Requires `[domain].stub.ts` and `[domain]-contract.test.ts` (unless a pure method/generic interface type).
    - **`statics/` (Depth: exactly 1
      level):** `statics/[domain]/[domain]-statics.ts`. Immutable configuration and magic number eliminations. Requires `[domain]-statics.test.ts`.
    - **`errors/` (Leaf
      node):** `errors/[name]/[name]-error.ts`. Custom error classes extending `Error`. Can import nothing.
    - **`startup/` (Depth: 0
      levels):** `startup/start-[name].ts`. Wiring only; zero branching (`if`, `switch`, ternary). Can
      **only** import `flows/`, `contracts/`, `statics/`, `errors/`. Cannot import `brokers/` directly. Requires `start-[name].integration.test.ts`.
    - **`flows/` (Depth: 1
      level):** `flows/[domain]/[domain]-flow.ts`. Entry-point orchestrator routing to responders. Requires `[domain]-flow.integration.test.ts`.
    - **`responders/` (Depth: exactly 2
      levels):** `responders/[domain]/[action]/[domain]-[action]-responder.ts`. Request handlers. Requires `.proxy.ts` and `.test.ts`.
    - **`migrations/` (Leaf node):** `migrations/[nnnn]-[name].ts`. Database migration scripts.

### 0.2 Package Creation Rule

- **Never hand-craft** `tsconfig.json`, `tsconfig.build.json`, or `jest.config.js`.
- Always scaffold new workspace packages via:
  ```bash
  node packages/cli/dist/bin/cli-entry.js create-package --name <package-name> --type <programmatic-service|library>
  ```

### 0.3 Coding Rules & Conventions

1.
**Exports:** Single `export const` arrow function per file. Never `export default`. Classes are allowed strictly for errors extending `Error`.
2. **Type Exports:** Use `export type {Thing} from ...`, never `export {type Thing}`.
3. **JSDoc Placement:** `/** PURPOSE: ... */` block must sit **above all
   imports** at the top of the file, not immediately above the function.
4. **Gateway
   Boundary:** Never import Node built-ins or npm modules directly. Import solely through `#gateway/<folder>/<subpath>` (e.g. `#gateway/node/sqlite`, `#gateway/node/zlib`, `#gateway/node/fs`, `#gateway/npm/zod`).
5. **No Magic Numbers:** All numbers (except `-1`, `0`, `1`, indices, defaults) must be declared in `statics/`.
6. **No Silent Catches:** Never swallow errors. Every `.catch()` must log to `process.stderr` or rethrow.
7. **No `while (true)`:** Use bounded recursion.

### 0.4 Testing Standards

1. **Type Safety in Tests:** Test and proxy files
   **cannot** import types from contracts. Use `ReturnType<typeof ThingStub>` where a type is needed.
2. **Describe Blocks &
   Prefixes:** Describe blocks required. Test names must follow `{input} => result` with mandatory prefixes: `VALID:`, `INVALID:`, `ERROR:`, `EDGE:`, `EMPTY:`.
3. **Exact Assertions:**
    - Objects and arrays: `expect(a).toStrictEqual(b)` (Never `.toEqual()` or `.toMatchObject()`).
    - Primitives: `expect(a).toBe(b)` (Never `.toBeTruthy()`, `.toBeDefined()`, `.toContain()`).
    - Match exact values, never counts or existence.
4. **Proxy
   Encapsulation:** Fresh proxy per test. Proxies expose semantic setup methods (`setupX({ ... })`), never leaking child proxies.

---

## 0.5 Integrated User Decisions & Errata

1. **Spool Redaction:** The server executes `secretRedactTransformer`
   *before* appending to `<home>/data/spool/<sessionId>.stdout.jsonl` and `<home>/data/spool/dispatch.jsonl`, ensuring no raw plaintext credentials touch disk.
2. **Initial Import Cap
   Behavior:** On first start, chronicle-llm imports the last 7 days first, then streams older history in batches, pausing when the 4 GB storage cap is reached.
3. **Tier 1 Eviction &
   Deletions:** If a source file is present, it is parsed and archived. If a subsequent re-parse finds the original transcript was purged by the harness (e.g. Claude 30-day purge), the database marks the source/session as `historical` / `gone` and retains all existing parsed relational rows without error.
4. **Claude Effort
   Precedence:** When both `effort` and `perTurnEffort` exist on an assistant record, `effort` takes precedence over `perTurnEffort`.
5. **Deterministic Message Link
   Key:** Agent messages are joined using `<senderSessionKey>:<recipientAgentId>:<pos>:<sha256(body)>` to eliminate collisions on identical messages.
6. **Chronicle Daemon Log Location:** Process logs and fatal errors are written to `<home>/logs/chronicle.log`.
7. **Parity Tool
   Signature:** The parity verification tool is executed via `node packages/cli/dist/bin/cli-entry.js chronicle parity --quest <questId>`.
8. **Schema Column
   Authority:** [schema.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/schema.md) is the absolute authority on SQL column names: foreign references use `<thing>_ref` (e.g. `parent_session_ref`, `root_session_ref`, `spawned_by_tool_call_ref`, `tool_call_ref`), never `<thing>_id`.

---

## Phase 0: Standalone Quick Fixes

### Objective

Resolve high-impact legacy replay bottlenecks, old quest contract locks, and Node engine requirements before introducing new packages.

### Pre-Phase Verification & Alignment

- [ ] Confirm baseline repository status: `npm run ward -- --committed --uncommitted`.
- [ ] Verify reference quests exist in `tmp/chronicle-reference/` (`1918a5ee-...` and `c8171a64-...`).

---

### Step 0.1: Engine & Dependencies Floor

- **Files to Edit:**
    - `package.json`
- **Action:** Update `engines.node` from `>=14.0.0` to `>=22.16.0`.
- **Verification:** Run `node -v` to ensure running on Node `>=22.16`. Run `npm run ward -- -- package.json`.

---

### Step 0.2: Legacy Quest Contract Backward-Compatibility

- **Files to Edit:**
    - `packages/shared/src/contracts/quest/quest-contract.ts`
    - `packages/shared/src/contracts/quest/quest.stub.ts`
    - `packages/shared/src/contracts/quest/quest-contract.test.ts`
-
**Action:** Allow optional legacy signoff keys (`*Signoff`, `verifierSignoff`, `plannerSignoff`) on completed historical quests so quests `c8171a64`, `1dac5395`, and `b4c31633` parse without validation failure.
-
**Verification:** `npm run ward -- -- packages/shared/src/contracts/quest/quest-contract.ts packages/shared/src/contracts/quest/quest-contract.test.ts`.

---

### Step 0.3: Web Client Frame Upsert Optimization

- **Files to Edit:**
    - `packages/web/src/bindings/quest/use-quest-chat-binding.ts`
    - `packages/web/src/bindings/quest/use-quest-chat-binding.test.tsx`
-
**Action:** Replace whole-map copying per incoming replay frame with mutable batch buffer flush (`requestAnimationFrame` / debounce batching) to eliminate 21.5s CPU spike on quest load.
- **Verification:** `npm run ward -- -- packages/web/src/bindings/quest/use-quest-chat-binding.ts`.

---

### Step 0.4: Watcher Sub-Agent First Line Read

- **Files to Edit:**
    - `packages/server/src/brokers/chat-replay/session-watcher-broker.ts`
    - `packages/server/src/brokers/chat-replay/session-watcher-broker.test.ts`
-
**Action:** When discovering subagent JSONL files, read only line 0 to extract metadata instead of loading the entire transcript file into memory every poll tick.
- **Verification:** `npm run ward -- -- packages/server/src/brokers/chat-replay/session-watcher-broker.ts`.

---

### Step 0.5: Phase 0 Verification & Manual Review

- [ ] Execute `CL-PRF-05` (baseline replay timing on quest `c8171a64`).
- [ ] Confirm old quests `c8171a64`, `1dac5395`, and `b4c31633` successfully mount in the browser.

---

## Phase 1: The Core Data Layer (Parsers, Tables, Ingest, Archive, Spools)

### Objective

Build `@dungeonmaster/chronicle-llm`, `@dungeonmaster/chronicle-llm-claude-code`, and `@dungeonmaster/chronicle-llm-antigravity`. Stand up the SQLite database (`40 tables, 2 views`), raw segment compressor, secret redactor, normalizers, session assembler, spools, and parity verification.

### Pre-Phase Verification & Chunk Re-Evaluation

- [ ] Verify Phase 0 commits are clean and merged.
- [ ] Check `packages/@gateway/node/src/sqlite` status; ensure ready for DatabaseSync pass-through.
- [ ] Re-evaluate Phase 1 chunk boundaries before launching Batch 1.1.

---

### Batch 1.1: Gateway Additions (`node:sqlite` & `node:zlib` zstd)

#### 1.1.1: Re-export zstd in `@gateway/node/zlib`

- **Files to Edit:**
    - `packages/@gateway/node/src/zlib/zlib.ts`
    - `packages/@gateway/node/src/zlib/zlib.test.ts`
-
**Action:** Export `zstdCompress`, `zstdCompressSync`, `zstdDecompress`, `zstdDecompressSync` from `node:zlib`. Update unit test to assert export identity against Node's built-in.
-
**Verification:** `npm run ward -- -- packages/@gateway/node/src/zlib/zlib.ts packages/@gateway/node/src/zlib/zlib.test.ts`.

#### 1.1.2: Complete `node:sqlite` Gateway Wrapper

- **Files to Edit / Create:**
    - `packages/@gateway/node/src/sqlite/sqlite.ts`
    - `packages/@gateway/node/src/sqlite/sqlite.test.ts`
    - `packages/@gateway/node/src/sqlite/database-sync.stub.ts`
-
**Action:** Export `DatabaseSync`, `StatementSync` from `node:sqlite`. Ensure experimental warning is suppressed on Node 22.
-
**Verification:** `npm run ward -- -- packages/@gateway/node/src/sqlite/sqlite.ts packages/@gateway/node/src/sqlite/sqlite.test.ts`.

---

### Batch 1.2: Secret Redaction & Content-Addressed Blob Storage

#### 1.2.1: Secret Redaction Transformer

- **Files to Create:**
    - `packages/shared/src/transformers/secret-redact/secret-redact-transformer.ts`
    - `packages/shared/src/transformers/secret-redact/secret-redact-transformer.test.ts`
-
**Action:** Pure regex string transformer scanning for `api-key`, `token`, `private-key`, `password`, `auth-header`, and `connection-string`. Replaces with `REDACTED-SECRET-<kind>`. Returns `{ text: string, redactionCount: number }`. Must stop replacements at quote boundaries to preserve JSON validity.
-
**Verification:** `npm run ward -- -- packages/shared/src/transformers/secret-redact/secret-redact-transformer.ts packages/shared/src/transformers/secret-redact/secret-redact-transformer.test.ts`.

#### 1.2.2: Content-Addressed Blob Storage Broker

- **Files to Create:**
    - `packages/shared/src/brokers/blob-store/write/blob-store-write-broker.ts`
    - `packages/shared/src/brokers/blob-store/write/blob-store-write-broker.proxy.ts`
    - `packages/shared/src/brokers/blob-store/write/blob-store-write-broker.test.ts`
    - `packages/shared/src/brokers/blob-store/read/blob-store-read-broker.ts`
    - `packages/shared/src/brokers/blob-store/read/blob-store-read-broker.proxy.ts`
    - `packages/shared/src/brokers/blob-store/read/blob-store-read-broker.test.ts`
-
**Action:** Writes blobs to `<home>/data/blobs/ab/cd/<sha256>`. Uses temporary file with `fs.renameSync` for atomic persistence. Reads decompressed stream by hash.
- **Verification:** `npm run ward -- -- packages/shared/src/brokers/blob-store/`.

---

### Batch 1.3: Package Scaffolding & Initial Migration (`0001-initial`)

#### 1.3.1: Scaffold `@dungeonmaster/chronicle-llm`

- **Command:**
  ```bash
  node packages/cli/dist/bin/cli-entry.js create-package --name @dungeonmaster/chronicle-llm --type programmatic-service
  ```
-
**Action:** Initialize workspace package correctly through Dungeonmaster scaffolding. Verify `package.json`, `tsconfig.json`, `jest.config.js`.
- **Verification:** Root `npm run ward -- -- packages/chronicle-llm/package.json`.

#### 1.3.2: SQLite Connection Broker & Migration Runner

- **Files to Create:**
    - `packages/chronicle-llm/src/brokers/database/connect/database-connect-broker.ts`
    - `packages/chronicle-llm/src/brokers/database/connect/database-connect-broker.proxy.ts`
    - `packages/chronicle-llm/src/brokers/database/connect/database-connect-broker.test.ts`
    - `packages/chronicle-llm/src/brokers/database/migration-run/database-migration-run-broker.ts`
    - `packages/chronicle-llm/src/brokers/database/migration-run/database-migration-run-broker.proxy.ts`
    - `packages/chronicle-llm/src/brokers/database/migration-run/database-migration-run-broker.test.ts`
    - `packages/chronicle-llm/src/migrations/0001-initial.ts`
- **Action:**
    - Connection broker initializes SQLite at `<home>/data/chronicle.db` in `WAL` mode, sets `busy_timeout=5000`, `synchronous=NORMAL`, `foreign_keys=ON`, `journal_size_limit=67108864`.
    - Migration runner checks `PRAGMA user_version` against `schema_migrations`, executing migrations in separate transactions.
    - `0001-initial.ts` contains the exact DDL for all 40 tables and 2 views defined in [schema.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/schema.md).
-
**Verification:** Integration test with `installTestbedCreateBroker` executing full initial migration and verifying all 40 tables exist.

---

### Batch 1.4: Raw Archive & Segment Sealer

#### 1.4.1: Segment Append Broker

- **Files to Create:**
    - `packages/chronicle-llm/src/brokers/archive/segment-append/archive-segment-append-broker.ts`
    - `packages/chronicle-llm/src/brokers/archive/segment-append/archive-segment-append-broker.proxy.ts`
    - `packages/chronicle-llm/src/brokers/archive/segment-append/archive-segment-append-broker.test.ts`
-
**Action:** Appends uncompressed raw records into `raw_tail` in the current database transaction. Calculates sha256 of original unredacted content.
- **Verification:** `npm run ward -- -- packages/chronicle-llm/src/brokers/archive/segment-append/`.

#### 1.4.2: Archive Segment Sealer Broker

- **Files to Create:**
    - `packages/chronicle-llm/src/brokers/archive/segment-seal/archive-segment-seal-broker.ts`
    - `packages/chronicle-llm/src/brokers/archive/segment-seal/archive-segment-seal-broker.proxy.ts`
    - `packages/chronicle-llm/src/brokers/archive/segment-seal/archive-segment-seal-broker.test.ts`
-
**Action:** Compresses `raw_tail` records in 1 MB chunks using `zstdCompressSync` (level 3). Appends chunk to `<home>/data/archive/<id>.seg`, `fsync`s the file, updates `raw_records` chunk pointers, deletes `raw_tail` records, and updates `archive_segments.committed_bytes` in one transaction. On boot, truncates any segment back to `committed_bytes`.
- **Verification:** Integration test simulating crash before commit, proving truncated segment recovery.

---

### Batch 1.5: Harness Definition Contracts & Claude Code Normalizer

#### 1.5.1: Harness Definition Contract

- **Files to Create:**
    - `packages/chronicle-llm/src/contracts/harness-definition/harness-definition-contract.ts`
-
**Action:** Types-only contract defining `HarnessDefinition`: `id`, `discovery`, `readers`, `detectVersion`, `normalizers`, `usage`, `pricing`, `subagents`, `failures`, `stdout`.
- **Verification:** Typecheck via ward.

#### 1.5.2: Scaffold `@dungeonmaster/chronicle-llm-claude-code`

- **Command:**
  ```bash
  node packages/cli/dist/bin/cli-entry.js create-package --name @dungeonmaster/chronicle-llm-claude-code --type library
  ```
- **Files to Create:**
    - `packages/chronicle-llm-claude-code/src/transformers/claude-record-v1/claude-record-v1-transformer.ts`
    - `packages/chronicle-llm-claude-code/src/transformers/claude-record-v1/claude-record-v1-transformer.test.ts`
- **Action:**
    - Pure transformer: raw JSONL line -> candidate canonical rows (`events`, `messages`, `content_blocks`, `tool_calls`, `tool_results`).
    - Implements field mappings from [claude-code-assistant.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/field-maps/claude-code-assistant.md) and [claude-code-user-and-tool-results.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/field-maps/claude-code-user-and-tool-results.md).
    - Fixtures test asserting exact parsed rows against sample lines from frozen quest `1918a5ee`.
- **Verification:** `npm run ward -- -- packages/chronicle-llm-claude-code/`.

---

### Batch 1.6: Antigravity Normalizer

#### 1.6.1: Scaffold `@dungeonmaster/chronicle-llm-antigravity`

- **Command:**
  ```bash
  node packages/cli/dist/bin/cli-entry.js create-package --name @dungeonmaster/chronicle-llm-antigravity --type library
  ```
- **Files to Create:**
    - `packages/chronicle-llm-antigravity/src/transformers/agy-conversation-v1/agy-conversation-v1-transformer.ts`
    - `packages/chronicle-llm-antigravity/src/transformers/agy-conversation-v1/agy-conversation-v1-transformer.test.ts`
- **Action:**
    - Translates agy SQLite conversation rows (`steps`, `gen_metadata`, `executor_metadata`) into canonical candidate rows.
    - Implements mappings from [antigravity.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/field-maps/antigravity.md).
    - Handles in-place step status mutations (pending -> running -> done/error) by incrementing `revision` and linking `(source_ref, sub_table, pos, revision)`.
- **Verification:** Unit test with fixture SQLite rows verifying terminal vs streaming step parsing.

---

### Batch 1.7: Session Assembler, Change Feed & Drift Observer

#### 1.7.1: Multi-Source Session Assembler Broker

- **Files to Create:**
    - `packages/chronicle-llm/src/brokers/assembler/session-assemble/assembler-session-assemble-broker.ts`
    - `packages/chronicle-llm/src/brokers/assembler/session-assemble/assembler-session-assemble-broker.proxy.ts`
    - `packages/chronicle-llm/src/brokers/assembler/session-assemble/assembler-session-assemble-broker.test.ts`
-
**Action:** Merges candidate rows from transcripts, sidefiles, and stdout. Applies merge rules: transcript wins over stdout; global deterministic deduplication on message ID and tool use ID; natural key generation per [schema.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/schema.md).
- **Verification:** Unit tests verifying merged row ownership and conflict resolution.

#### 1.7.2: Change Feed & Tombstone Broker

- **Files to Create:**
    - `packages/chronicle-llm/src/brokers/change-feed/change-feed-write/change-feed-write-broker.ts`
    - `packages/chronicle-llm/src/brokers/change-feed/change-feed-write/change-feed-write-broker.proxy.ts`
    - `packages/chronicle-llm/src/brokers/change-feed/change-feed-write/change-feed-write-broker.test.ts`
-
**Action:** Increments `meta.next_change_seq` at commit time; stamps `change_seq` on every inserted/updated row; writes deleted rows to `tombstones`.
- **Verification:** `npm run ward -- -- packages/chronicle-llm/src/brokers/change-feed/`.

#### 1.7.3: Schema Drift Observer Broker

- **Files to Create:**
    - `packages/chronicle-llm/src/brokers/drift/schema-drift-observe/drift-schema-drift-observe-broker.ts`
    - `packages/chronicle-llm/src/brokers/drift/schema-drift-observe/drift-schema-drift-observe-broker.proxy.ts`
    - `packages/chronicle-llm/src/brokers/drift/schema-drift-observe/drift-schema-drift-observe-broker.test.ts`
-
**Action:** Inspects raw record keys against normalizer `declaredFields`. Emits unparsed keys to `schema_observations` and new structural variants to `schema_drift`. Bypasses opaque subtrees (`x.*`).
- **Verification:** Unit test verifying drift detection on unknown fields.

---

### Batch 1.8: Spools, Redaction Integration & Quest Mirror

#### 1.8.1: Server Spool Redaction & Append

- **Files to Create / Edit:**
    - `packages/server/src/brokers/spool/spool-redact-append/spool-spool-redact-append-broker.ts`
    - `packages/server/src/brokers/spool/spool-redact-append/spool-spool-redact-append-broker.proxy.ts`
    - `packages/server/src/brokers/spool/spool-redact-append/spool-spool-redact-append-broker.test.ts`
    - `packages/server/src/brokers/spawn/spawn-one-agent-layer-broker.ts`
- **Action:**
    - Server runs `secretRedactTransformer` on stdout lines and dispatch records before appending to `<home>/data/spool/<sessionId>.stdout.jsonl` and `<home>/data/spool/dispatch.jsonl`.
    - Dispatches `register` line with `--session-id` before child spawn.
- **Verification:** `npm run ward -- -- packages/server/src/brokers/spool/`.

#### 1.8.2: Quest Mirror Sync Broker

- **Files to Create:**
    - `packages/chronicle-llm/src/brokers/quest-mirror/quest-mirror-sync/quest-mirror-quest-mirror-sync-broker.ts`
    - `packages/chronicle-llm/src/brokers/quest-mirror/quest-mirror-sync/quest-mirror-quest-mirror-sync-broker.proxy.ts`
    - `packages/chronicle-llm/src/brokers/quest-mirror/quest-mirror-sync/quest-mirror-quest-mirror-sync-broker.test.ts`
-
**Action:** Tails `event-outbox.jsonl`, reads referenced `quest.json` files, and updates `quests` and `work_items` tables. Sets `llm_sessions.quest_ref` and `work_item_ref`.
- **Verification:** Integration test asserting `quests` mirror updates on outbox line.

---

### Batch 1.9: Background Process, Lockfile & Unix Domain Socket

#### 1.9.1: Daemon Startup & Flow

- **Files to Create:**
    - `packages/chronicle-llm/src/startup/start-chronicle-daemon.ts`
    - `packages/chronicle-llm/src/startup/start-chronicle-daemon.integration.test.ts`
    - `packages/chronicle-llm/src/flows/chronicle-daemon/chronicle-daemon-flow.ts`
    - `packages/chronicle-llm/src/flows/chronicle-daemon/chronicle-daemon-flow.integration.test.ts`
    - `packages/chronicle-llm/src/responders/chronicle/daemon-run/chronicle-daemon-run-responder.ts`
    - `packages/chronicle-llm/src/responders/chronicle/daemon-run/chronicle-daemon-run-responder.proxy.ts`
    - `packages/chronicle-llm/src/responders/chronicle/daemon-run/chronicle-daemon-run-responder.test.ts`
    - `packages/chronicle-llm/src/brokers/process/process-lock/process-process-lock-broker.ts`
    - `packages/chronicle-llm/src/brokers/process/process-lock/process-process-lock-broker.proxy.ts`
    - `packages/chronicle-llm/src/brokers/process/process-lock/process-process-lock-broker.test.ts`
- **Action:**
    - Startup file calls `chronicleDaemonFlow` with zero branching.
    - Takes exclusive lock on `<home>/data/chronicle.lock`.
    - Handles `parent-bound` mode (exits when parent pipe closes) and `persistent` mode.
    - Redirects logs to `<home>/logs/chronicle.log`.
- **Verification:** Unit test asserting second process fails to acquire lock and exits cleanly.

#### 1.9.2: Reader Notification Unix Socket

- **Files to Create:**
    - `packages/chronicle-llm/src/brokers/socket/chronicle-socket-serve/socket-chronicle-socket-serve-broker.ts`
    - `packages/chronicle-llm/src/brokers/socket/chronicle-socket-serve/socket-chronicle-socket-serve-broker.proxy.ts`
    - `packages/chronicle-llm/src/brokers/socket/chronicle-socket-serve/socket-chronicle-socket-serve-broker.test.ts`
-
**Action:** Listens on `<home>/data/chronicle.sock`. Sends `{change_seq}` to connected readers upon transaction commit. Handles `status`, `reingest`, `pause` commands.
- **Verification:** Integration test verifying socket event broadcast on database commit.

---

### Batch 1.10: CLI Status, Query & Parity Verification

#### 1.10.1: CLI Subcommands

- **Files to Create / Edit:**
    - `packages/cli/src/brokers/chronicle/status/chronicle-status-broker.ts`
    - `packages/cli/src/brokers/chronicle/status/chronicle-status-broker.proxy.ts`
    - `packages/cli/src/brokers/chronicle/status/chronicle-status-broker.test.ts`
    - `packages/cli/src/brokers/chronicle/query/chronicle-query-broker.ts`
    - `packages/cli/src/brokers/chronicle/query/chronicle-query-broker.proxy.ts`
    - `packages/cli/src/brokers/chronicle/query/chronicle-query-broker.test.ts`
    - `packages/cli/src/brokers/chronicle/drift/chronicle-drift-broker.ts`
    - `packages/cli/src/brokers/chronicle/drift/chronicle-drift-broker.proxy.ts`
    - `packages/cli/src/brokers/chronicle/drift/chronicle-drift-broker.test.ts`
    - `packages/cli/src/entrypoints/chronicle-entry.ts`
-
**Action:** Implements `dungeonmaster chronicle status`, `dungeonmaster chronicle query "<sql>"`, and `dungeonmaster chronicle drift --ack <id>`.
- **Verification:** `npm run ward -- -- packages/cli/src/brokers/chronicle/`.

#### 1.10.2: Phase 1 Parity Verification Script

- **Files to Create:**
    - `packages/chronicle-llm/src/brokers/parity/quest-replay-parity/parity-quest-replay-parity-broker.ts`
    - `packages/chronicle-llm/src/brokers/parity/quest-replay-parity/parity-quest-replay-parity-broker.proxy.ts`
    - `packages/chronicle-llm/src/brokers/parity/quest-replay-parity/parity-quest-replay-parity-broker.integration.test.ts`
-
**Action:** Implements parity comparator between `chatHistoryReplayBroker` output and chronicle `events` query. Exposes via `node packages/cli/dist/bin/cli-entry.js chronicle parity --quest <questId>`.
- **Verification:** Run against frozen reference quest `1918a5ee`.

---

### Step 1.11: Phase 1 Dedicated Manual Test & Data Quality Review (DQ Review)

Before declaring Phase 1 complete, run and record all applicable test cases from [manual-test-plan.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/manual-test-plan.md):

- [ ] **Process & Lock (`CL-PRC-*`):** Verify single-writer lockfile, graceful shutdown, and parent-bound auto-exit.
- [ ] **Schema Conformance (`CL-SCH-*`):** Verify `0001-initial` created 40 tables, 2 views, and all `*_ref` columns.
- [ ] **Import Behavior (`CL-IMP-*`):**
    - Verify last 7 days import first under `recent` priority.
    - Verify older history pauses when reaching 4 GB cap.
- [ ] **Crash Recovery (`CL-CRA-*`):**
    - Test crash during segment sealing; verify segment truncates to `committed_bytes`.
- [ ] **Secret Redaction (`CL-SEC-*`):**
    - Verify canary secrets in stdout spools are redacted before disk write.
    - Verify raw archive and database contain zero plaintext canaries.
- [ ] **Parity Verification (`CL-PAR-*`):**
    - Run `dungeonmaster chronicle parity --quest 1918a5ee-...`. Confirm 100% entry match against legacy replay.
- [ ] **Data Quality (DQ) Checklist
  Review:** Complete DQ-1 through DQ-20 in [manual-test-plan.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/manual-test-plan.md#L20).

---

## Phase 1b: Reasoning Effort Migration Test

### Objective

Prove live schema migration and raw archive re-normalization by adding `messages.effort` (`migration 0002`).

### Pre-Phase Verification & Chunk Re-Evaluation

- [ ] Verify Phase 1 is fully committed and DQ review passed.
- [ ] Confirm `schema_observations` and `schema_drift` hold unacknowledged rows for `effort` and `perTurnEffort`.

---

### Step 1b.1: Migration `0002-effort`

- **Files to Create:**
    - `packages/chronicle-llm/src/migrations/0002-effort.ts`
-
**Action:** DDL: `ALTER TABLE messages ADD COLUMN effort TEXT;`. Updates `schema_migrations` and bumps `PRAGMA user_version = 2`.
- **Verification:** `npm run ward -- -- packages/chronicle-llm/src/migrations/0002-effort.ts`.

---

### Step 1b.2: Normalizer Version Bump & Re-Normalization

- **Files to Create / Edit:**
    - `packages/chronicle-llm-claude-code/src/transformers/claude-record-v2/claude-record-v2-transformer.ts`
    - `packages/chronicle-llm-claude-code/src/transformers/claude-record-v2/claude-record-v2-transformer.test.ts`
    - `packages/chronicle-llm-antigravity/src/transformers/agy-conversation-v2/agy-conversation-v2-transformer.ts`
    - `packages/chronicle-llm-antigravity/src/transformers/agy-conversation-v2/agy-conversation-v2-transformer.test.ts`
-
**Action:** Declare `effort` in normalizers. For Claude: `effort` takes precedence over `perTurnEffort`. Trigger per-session re-normalization from raw archive (`ingest_jobs.cause = 'reingest:normalizer-bump'`).
- **Verification:** `npm run ward -- -- packages/chronicle-llm-claude-code/ packages/chronicle-llm-antigravity/`.

---

### Step 1b.3: Phase 1b Manual Verification (`CL-EFF-*`)

- [ ] Run `CL-EFF-01` through `CL-EFF-13` from [manual-test-plan.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/manual-test-plan.md).
- [ ] Confirm `dungeonmaster chronicle drift --ack-all` clears acknowledged rows.
- [ ] Confirm `messages.effort` contains expected values (`medium`, `high`, `xhigh`) for both Claude and Antigravity sessions.

---

## Phase 2: Server Reads, Quest Health & View Context

### Objective

Expose the query module and typed Zod contracts. Stand up the server read worker thread, socket change listener, health panel UI, View Context drawer, `get-quest-health` MCP tool, and retire `usage-ledger.json`.

### Pre-Phase Verification & Chunk Re-Evaluation

- [ ] Verify `chronicle.db` holds validated Phase 1 data.
- [ ] Re-evaluate server integration boundaries in `packages/server/`.

---

### Batch 2.1: Query Module & Shared Zod Contracts

- **Files to Create:**
    - `packages/shared/src/contracts/chronicle-query/chronicle-query-contract.ts`
    - `packages/shared/src/contracts/chronicle-query/chronicle-query.stub.ts`
    - `packages/shared/src/contracts/chronicle-query/chronicle-query-contract.test.ts`
    - `packages/chronicle-llm/src/brokers/query/execute/query-execute-broker.ts`
    - `packages/chronicle-llm/src/brokers/query/execute/query-execute-broker.proxy.ts`
    - `packages/chronicle-llm/src/brokers/query/execute/query-execute-broker.test.ts`
    - `packages/chronicle-llm/src/transformers/row-to-camel/row-to-camel-transformer.ts`
    - `packages/chronicle-llm/src/transformers/row-to-camel/row-to-camel-transformer.test.ts`
-
**Action:** Implements typed queries over `node:sqlite` read connection. Transforms `snake_case` SQL columns to `camelCase` contract objects.
- **Verification:** Unit tests verifying contract parsing and type conversion.

---

### Batch 2.2: Server Read Worker Thread & Socket Client

- **Files to Create / Edit:**
    - `packages/server/src/workers/chronicle-reader-worker.ts`
    - `packages/server/src/brokers/chronicle/socket-client/chronicle-socket-client-broker.ts`
    - `packages/server/src/brokers/chronicle/socket-client/chronicle-socket-client-broker.proxy.ts`
    - `packages/server/src/brokers/chronicle/socket-client/chronicle-socket-client-broker.test.ts`
-
**Action:** Runs read-only queries in worker thread to prevent blocking event loop. Connects to `chronicle.sock` to listen for `{change_seq}` updates.
- **Verification:** Integration test verifying worker query execution and timeout bounding.

---

### Batch 2.3: Quest Health Endpoints & MCP Tool

- **Files to Create / Edit:**
    - `packages/server/src/responders/quest/health-get/quest-health-get-responder.ts`
    - `packages/server/src/responders/quest/health-get/quest-health-get-responder.proxy.ts`
    - `packages/server/src/responders/quest/health-get/quest-health-get-responder.test.ts`
    - `packages/mcp/src/tools/get-quest-health/get-quest-health-tool.ts`
-
**Action:** Exposes `GET /api/guilds/:guildId/quests/:questId/health`. Returns failed calls by canonical cause, ward mismatches, cost by role, and recovery metrics. Implements `get-quest-health` MCP tool.
-
**Verification:** `npm run ward -- -- packages/server/src/responders/quest/health-get/ packages/mcp/src/tools/get-quest-health/`.

---

### Batch 2.4: UI Health Overview & View Context Side Drawer

- **Files to Create / Edit:**
    - `packages/web/src/widgets/quest-health/quest-health-widget.tsx`
    - `packages/web/src/widgets/quest-health/view-context-drawer-widget.tsx`
-
**Action:** Mounts health summary in right panel above coverage summary. "View Context" button opens side drawer showing window of transcript rows centered on failed tool call.
- **Verification:** `npm run ward -- -- packages/web/src/widgets/quest-health/`.

---

### Batch 2.5: Retire `usage-ledger.json`

- **Files to Delete / Edit:**
    - `packages/server/src/brokers/rate-limits/` (delete old transcript scanner)
    - `packages/server/src/brokers/dispatch/hold-evaluate/dispatch-hold-evaluate-broker.ts` (point to `usage` table)
-
**Action:** Quota accounting and dispatch rate-limit hold read directly from chronicle `usage` table. Delete legacy `usage-ledger.json` poller and remove leaked `.tmp.*` files.
- **Verification:** `npm run ward -- -- packages/server/src/brokers/dispatch/`.

---

### Step 2.6: Phase 2 Manual Verification (`CL-SRV-*`, `CL-HLT-*`, `CL-LDG-*`)

- [ ] Run `CL-HLT-01` through `CL-HLT-07` from [manual-test-plan.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/manual-test-plan.md).
- [ ] Verify View Context drawer scrolls to highlighted failed call.
- [ ] Run `CL-LDG-*` to confirm quota display matches `usage` rollups without `usage-ledger.json`.

---

## Phase 3: Chat UI Migration to chronicle-llm

### Objective

Migrate the live chat UI to read entirely from chronicle-llm change feed and delete legacy replay/emitter infrastructure.

### Pre-Phase Verification & Chunk Re-Evaluation

- [ ] Verify Phase 2 health and query modules operate without latency regressions.
- [ ] Confirm parity tests remain 100% green on all active quests.

---

### Batch 3.1: Cursor-Based Chat API & Store State Banners

- **Files to Create / Edit:**
    - `packages/server/src/responders/quest/timeline-get/quest-timeline-get-responder.ts`
    - `packages/server/src/responders/quest/timeline-get/quest-timeline-get-responder.proxy.ts`
    - `packages/server/src/responders/quest/timeline-get/quest-timeline-get-responder.test.ts`
    - `packages/web/src/widgets/store-status/store-status-banner-widget.tsx`
-
**Action:** Exposes `GET /api/guilds/:guildId/quests/:questId/timeline?cursor=<change_seq>`. Web client handles store status banners: "First-run import in progress", "Upgrading data", "History trimmed".
- **Verification:** `npm run ward -- -- packages/server/src/responders/quest/timeline-get/`.

---

### Batch 3.2: Switch Web Chat Binding & Delete Legacy Infrastructure

- **Files to Edit / Delete:**
    - `packages/web/src/bindings/quest/use-quest-chat-binding.ts` (switch to chronicle feed)
    - `packages/server/src/brokers/chat-replay/chat-history-replay-broker.ts` (**DELETE**)
    - `packages/server/src/brokers/chat-replay/session-watcher-broker.ts` (**DELETE**)
    - `packages/server/src/responders/server-init/server-init-responder.ts` (remove replay gate and drop buffer)
-
**Action:** Chat entries load directly from chronicle-llm. Delete old JSONL watcher, subagent polling, replay gates, and hand-built chat emit sites.
- **Verification:** Full e2e test suite: `npm run ward -- --only e2e`.

---

### Step 3.3: Phase 3 Manual Verification (`CL-FUN-*`, `CL-UIS-*`)

- [ ] Run `CL-FUN-01` through `CL-FUN-10` from [manual-test-plan.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/manual-test-plan.md).
- [ ] Test browser reload and reconnection during live agent execution. Confirm zero duplicate or dropped entries.

---

## Phase 4: Timeline & Command Center

### Objective

Deliver structured execution timeline phases and high-level cross-quest metrics for the Command Center.

### Pre-Phase Verification & Chunk Re-Evaluation

- [ ] Verify Phase 3 chat operations are stable in dogfood prod.
- [ ] Review Command Center requirements against `rollup_hour` and `rollup_quest` views.

---

### Batch 4.1: Timeline Phase Derivation

- **Files to Create:**
    - `packages/chronicle-llm/src/transformers/timeline-phase-derive/timeline-phase-derive-transformer.ts`
    - `packages/chronicle-llm/src/transformers/timeline-phase-derive/timeline-phase-derive-transformer.test.ts`
-
**Action:** Derives phases (`explore`, `plan`, `edit`, `verify`, `fix`) from `events`, `tool_calls`, and `turns` at query time.
- **Verification:** `npm run ward -- -- packages/chronicle-llm/src/transformers/timeline-phase-derive/`.

---

### Batch 4.2: Command Center Metrics Rollups

- **Files to Create / Edit:**
    - `packages/server/src/responders/command-center/metrics-get/command-center-metrics-get-responder.ts`
    - `packages/server/src/responders/command-center/metrics-get/command-center-metrics-get-responder.proxy.ts`
    - `packages/server/src/responders/command-center/metrics-get/command-center-metrics-get-responder.test.ts`
    - `packages/web/src/widgets/command-center/command-center-metrics-widget.tsx`
-
**Action:** Serves cross-guild quest metrics from `rollup_quest` and global consumption trends from `rollup_hour`. Displays live context tokens from running sessions.
- **Verification:** `npm run ward -- -- packages/server/src/responders/command-center/metrics-get/`.

---

### Step 4.3: Phase 4 Manual Verification (`CL-TL-*`, `CL-CC-*`)

- [ ] Run `CL-TL-*` and `CL-CC-*` test cases in [manual-test-plan.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/manual-test-plan.md).
- [ ] Cross-check displayed costs and token sums against frozen quest totals.

---

## Phase 5: First-Party Sources & Rate-Limits Retirement

### Objective

Capture non-harness first-party data (CLI commands, server errors, local model calls) and retire `rate-limits.json` / `rate-limits-history.jsonl`.

### Pre-Phase Verification & Chunk Re-Evaluation

- [ ] Verify Phase 4 rollups are performing within latency budgets.
- [ ] Review status-line rate limit capture mechanism.

---

### Batch 5.1: First-Party Spool Ingest

- **Files to Create / Edit:**
    - `packages/chronicle-llm/src/brokers/spool/first-party-read/spool-first-party-read-broker.ts`
    - `packages/chronicle-llm/src/brokers/spool/first-party-read/spool-first-party-read-broker.proxy.ts`
    - `packages/chronicle-llm/src/brokers/spool/first-party-read/spool-first-party-read-broker.test.ts`
    - `packages/server/src/brokers/errors/record/errors-record-broker.ts`
- **Action:** Appends server errors to `server_errors` table and gateway local-model invocations to `model_calls`.
- **Verification:** `npm run ward -- -- packages/chronicle-llm/src/brokers/spool/first-party-read/`.

---

### Batch 5.2: Rate Limits Retirement

- **Files to Create / Edit / Delete:**
    - `packages/cli/src/brokers/status-line/spool-append/status-line-spool-append-broker.ts`
    - `packages/cli/src/brokers/status-line/spool-append/status-line-spool-append-broker.proxy.ts`
    - `packages/cli/src/brokers/status-line/spool-append/status-line-spool-append-broker.test.ts`
    - `packages/server/src/brokers/rate-limits/rate-limits.json` (**DELETE**)
    - `packages/server/src/brokers/rate-limits/rate-limits-history.jsonl` (**DELETE**)
-
**Action:** CLI appends status line readings to `<home>/data/spool/rate-limits.jsonl`. chronicle-llm stores them in `rate_limit_samples`. Dispatch hold reads the newest sample from `rate_limit_samples`.
- **Verification:** `npm run ward -- -- packages/cli/ packages/server/`.

---

### Step 5.3: Phase 5 Manual Verification (`CL-FP-*`, `CL-RLM-*`)

- [ ] Run `CL-FP-*` and `CL-RLM-*` test cases in [manual-test-plan.md](file:///home/brutus-home/projects/codex-of-consentient-craft/scrolls/chronicle-llm/manual-test-plan.md).
- [ ] Confirm rate-limit trends and `err/1h` render accurately without legacy JSON files.

---

## Phase 6: Next Harness Pluggability Check

### Objective

Prove third-party harness extensibility by creating a stub third harness package (e.g. `@dungeonmaster/chronicle-llm-codex`) with
**zero code modifications** to `@dungeonmaster/chronicle-llm`.

### Pre-Phase Verification

- [ ] Confirm all Phase 0–5 tests are green across the monorepo.

---

### Batch 6.1: Plug-in Verification

- **Files to Create:**
    - `packages/chronicle-llm-codex/src/transformers/codex-harness/codex-harness-transformer.ts`
    - `packages/chronicle-llm-codex/src/transformers/codex-harness/codex-harness-transformer.test.ts`
-
**Action:** Implement `HarnessDefinitionContract` for a new harness. Register with discovery and verify records ingest cleanly without changing a single line of chronicle core.
- **Verification:** `npm run ward -- -- packages/chronicle-llm-codex/`.

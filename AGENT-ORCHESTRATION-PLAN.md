# Agent Orchestration Architecture Refactoring Plan

**Status: COMPLETED**

## Summary

Refactor the agent orchestration system to properly implement a multi-role quest execution pipeline with:

1. Separate ChaosWhisperer from quest execution (user-initiated vs automated)
2. Role-specific spawn brokers for all agent types
3. Role-aware SlotManager for parallel execution
4. CLI entry point for quest execution
5. Full execution pipeline with Ward/Spiritmender loop

## Current Problems

1. **agentOrchestrateBroker** incorrectly chains ChaosWhisperer → PathSeeker → SlotManager
2. **SlotManager** spawns generic agents without role awareness
3. **CLI** has no "run quest" option - only "add" (create) and "list" (view)
4. **Missing role spawn brokers** for Codeweaver, Spiritmender, Lawbringer, Siegemaster

## Target Execution Flow

```
User Menu: "Add Quest" → ChaosWhisperer (standalone)
User Menu: "Run Quest" → Select quest → Execute:

PathSeeker (single) → Codeweavers (parallel/steps) → Ward (CLI)
    → Siegemaster (single) → Lawbringers (parallel/file pairs)
    → [if issues] Spiritmenders (parallel/files) → Ward → loop back
    → Complete
```

## Implementation Phases

### Phase 1: Contracts (6 files) ✅

| File                                                                    | Purpose                                                             |
|-------------------------------------------------------------------------|---------------------------------------------------------------------|
| `cli/src/contracts/agent-role/agent-role-contract.ts`                   | Enum: pathseeker, codeweaver, spiritmender, lawbringer, siegemaster |
| `cli/src/contracts/agent-role/agent-role.stub.ts`                       | Test stub                                                           |
| `cli/src/contracts/file-work-unit/file-work-unit-contract.ts`           | Work unit for Spiritmender (filePath + errors)                      |
| `cli/src/contracts/file-work-unit/file-work-unit.stub.ts`               | Test stub                                                           |
| `cli/src/contracts/file-pair-work-unit/file-pair-work-unit-contract.ts` | Work unit for Lawbringer (impl + test paths)                        |
| `cli/src/contracts/file-pair-work-unit/file-pair-work-unit.stub.ts`     | Test stub                                                           |

### Phase 2: Prompt Statics (4 files) ✅

| File                                                                 | Purpose                       |
|----------------------------------------------------------------------|-------------------------------|
| `cli/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`     | Implementation agent prompt   |
| `cli/src/statics/spiritmender-prompt/spiritmender-prompt-statics.ts` | Error fix agent prompt        |
| `cli/src/statics/lawbringer-prompt/lawbringer-prompt-statics.ts`     | Code review agent prompt      |
| `cli/src/statics/siegemaster-prompt/siegemaster-prompt-statics.ts`   | Integration test agent prompt |

Use v1 prompts as reference:

- `v1/commands/quest/codeweaver.md`
- `v1/commands/quest/spiritmender.md`
- `v1/commands/quest/siegemaster.md`

### Phase 3: Role Spawn Brokers (12 files per role = 48 total) ✅

For each role (codeweaver, spiritmender, lawbringer, siegemaster):

| File Pattern                                                            | Purpose                                           |
|-------------------------------------------------------------------------|---------------------------------------------------|
| `brokers/{role}/spawn/{role}-spawn-broker.ts`                           | Interactive spawn (wraps claudeSpawnBroker)       |
| `brokers/{role}/spawn/{role}-spawn-broker.proxy.ts`                     | Test proxy                                        |
| `brokers/{role}/spawn/{role}-spawn-broker.test.ts`                      | Tests                                             |
| `brokers/{role}/spawn-streaming/{role}-spawn-streaming-broker.ts`       | Streaming spawn (wraps agentSpawnStreamingBroker) |
| `brokers/{role}/spawn-streaming/{role}-spawn-streaming-broker.proxy.ts` | Test proxy                                        |
| `brokers/{role}/spawn-streaming/{role}-spawn-streaming-broker.test.ts`  | Tests                                             |

### Phase 4: Role Router Broker (3 files) ✅

| File                                                              | Purpose                                                  |
|-------------------------------------------------------------------|----------------------------------------------------------|
| `brokers/agent/spawn-by-role/agent-spawn-by-role-broker.ts`       | Routes to correct spawn broker based on role + work unit |
| `brokers/agent/spawn-by-role/agent-spawn-by-role-broker.proxy.ts` | Test proxy                                               |
| `brokers/agent/spawn-by-role/agent-spawn-by-role-broker.test.ts`  | Tests                                                    |

```typescript
type WorkUnit =
    | { role: 'pathseeker'; questId: QuestId }
    | { role: 'codeweaver'; step: DependencyStep }
    | { role: 'spiritmender'; file: FileWorkUnit }
    | { role: 'lawbringer'; filePair: FilePairWorkUnit }
    | { role: 'siegemaster'; questId: QuestId };
```

### Phase 5: SlotManager Refactoring (4 modified files) ✅

| File                                                                  | Change                                               |
|-----------------------------------------------------------------------|------------------------------------------------------|
| `brokers/slot-manager/orchestrate/slot-manager-orchestrate-broker.ts` | Add `role` parameter                                 |
| `brokers/slot-manager/orchestrate/orchestration-loop-layer-broker.ts` | Use agentSpawnByRoleBroker instead of generic prompt |
| `brokers/slot-manager/orchestrate/spawn-agent-layer-broker.ts`        | Accept role and work unit type                       |
| `brokers/slot-manager/orchestrate/handle-signal-layer-broker.ts`      | Route `needs-role-followup` to actual role brokers   |

Key change in orchestration-loop (line 67-75):

```typescript
// BEFORE:
const prompt = promptTextContract.parse(`Execute step: ${stepToRun.name}...`);

// AFTER:
const agentPromise = agentSpawnByRoleBroker({
    workUnit: {role, step: stepToRun},
    timeoutMs,
});
```

### Phase 6: Quest Execution Pipeline (15 files) ✅

| File                                                                   | Purpose                                          |
|------------------------------------------------------------------------|--------------------------------------------------|
| `brokers/quest/execute/quest-execute-broker.ts`                        | Main pipeline orchestrator                       |
| `brokers/quest/execute/quest-execute-broker.proxy.ts`                  | Test proxy                                       |
| `brokers/quest/execute/quest-execute-broker.test.ts`                   | Tests                                            |
| `brokers/quest/execute/pathseeker-phase-layer-broker.ts`               | PathSeeker phase                                 |
| `brokers/quest/execute/codeweaver-phase-layer-broker.ts`               | Codeweaver phase (calls SlotManager with role)   |
| `brokers/quest/execute/siegemaster-phase-layer-broker.ts`              | Siegemaster phase                                |
| `brokers/quest/execute/lawbringer-phase-layer-broker.ts`               | Lawbringer phase (calls SlotManager with role)   |
| `brokers/quest/execute/spiritmender-phase-layer-broker.ts`             | Spiritmender phase (calls SlotManager with role) |
| `brokers/quest/execute/spiritmender-loop-layer-broker.ts`              | Ward → Spiritmender → Ward loop                  |
| `brokers/ward/run/ward-run-broker.ts`                                  | Run `npm run ward` CLI command                   |
| `brokers/ward/run/ward-run-broker.proxy.ts`                            | Test proxy                                       |
| `brokers/ward/run/ward-run-broker.test.ts`                             | Tests                                            |
| `transformers/parse-ward-output/parse-ward-output-transformer.ts`      | Parse ward errors into FileWorkUnits             |
| `transformers/parse-ward-output/parse-ward-output-transformer.test.ts` | Tests                                            |

### Phase 7: Refactor agentOrchestrateBroker (1 modified file) ✅

| File                                                    | Change                                                |
|---------------------------------------------------------|-------------------------------------------------------|
| `brokers/agent/orchestrate/agent-orchestrate-broker.ts` | Remove ChaosWhisperer, delegate to questExecuteBroker |

```typescript
// BEFORE: ChaosWhisperer → PathSeeker → SlotManager
// AFTER: Just delegates to questExecuteBroker
export const agentOrchestrateBroker = async ({
                                                 questFilePath, slotCount, timeoutMs,
                                             }) => questExecuteBroker({questFilePath, slotCount, timeoutMs});
```

### Phase 8: CLI Entry Point (8 files) ✅

| File                                                                | Change                                            |
|---------------------------------------------------------------------|---------------------------------------------------|
| `statics/cli/cli-statics.ts`                                        | Add `run` command and menu option                 |
| `widgets/cli-app/cli-app-widget.tsx`                                | Add `run` screen type and `onRunQuest` callback   |
| `widgets/cli-app/run-screen-layer-widget.tsx`                       | NEW: Quest selection screen with arrow navigation |
| `widgets/cli-app/run-screen-layer-widget.proxy.tsx`                 | Test proxy                                        |
| `widgets/cli-app/run-screen-layer-widget.test.tsx`                  | Tests                                             |
| `startup/start-cli.ts`                                              | Add quest execution lifecycle handling            |
| `contracts/quest-selection-index/quest-selection-index-contract.ts` | Selection index type                              |
| `contracts/quest-selection-index/quest-selection-index.stub.ts`     | Test stub                                         |

Run screen behavior:

- Uses `useQuestsListBinding` to fetch quests
- Filters to incomplete quests only
- Arrow key navigation, Enter to select, Escape to go back
- Calls `onRunQuest({ questId, questFilePath })` on selection

## Critical Files Reference

**Patterns to follow:**

- `cli/src/statics/chaoswhisperer-prompt/chaoswhisperer-prompt-statics.ts` - Prompt statics pattern
- `cli/src/brokers/chaoswhisperer/spawn/chaoswhisperer-spawn-broker.ts` - Spawn broker pattern
- `cli/src/widgets/cli-app/menu-screen-layer-widget.tsx` - Navigation widget pattern

**Files to modify:**

- `cli/src/brokers/agent/orchestrate/agent-orchestrate-broker.ts` - Remove ChaosWhisperer chain
- `cli/src/brokers/slot-manager/orchestrate/orchestration-loop-layer-broker.ts` - Use role-based spawning
- `cli/src/widgets/cli-app/cli-app-widget.tsx` - Add run screen routing
- `cli/src/startup/start-cli.ts` - Add execution flow

## Verification

1. **Unit tests**: Run `npm test` for all new files
2. **Type checking**: Run `npm run ward` on modified files
3. **Manual test flow**:
    - Start CLI: `npm run start -w @dungeonmaster/cli`
    - Select "Add" → Create a quest with ChaosWhisperer
    - Select "Run" → See quest list → Select quest
    - Verify PathSeeker runs, then Codeweavers in parallel
    - Verify Ward runs after Codeweavers complete
    - Verify Siegemaster runs after Ward passes

## File Count Summary

| Phase                         | New Files | Modified Files | Status   |
|-------------------------------|-----------|----------------|----------|
| 1. Contracts                  | 6         | 0              | ✅        |
| 2. Prompt Statics             | 4         | 0              | ✅        |
| 3. Role Spawn Brokers         | 24        | 0              | ✅        |
| 4. Role Router                | 3         | 0              | ✅        |
| 5. SlotManager Refactor       | 0         | 4              | ✅        |
| 6. Quest Execute Pipeline     | 15        | 0              | ✅        |
| 7. Agent Orchestrate Refactor | 0         | 1              | ✅        |
| 8. CLI Entry Point            | 8         | 3              | ✅        |
| **Total**                     | **60**    | **8**          | **DONE** |

## Test Results

- **191 tests passing**
- **No lint issues**
- **No type errors**

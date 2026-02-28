# Startup Split: packages/tooling

## Summary

Single startup file `start-primitive-duplicate-detection.ts` has:
- **Import violation**: imports from `brokers/` (forbidden in startup)
- **13+ branching violations**: ternaries, `if`, `for...of`, `.find()` callbacks
- **`isMain` guard**: `require.main === module` block (lines 91-97)

## New Files to Create

### 1. Flow: `src/flows/primitive-duplicate-detection/primitive-duplicate-detection-flow.ts`
- Pure delegation to the responder
- No branching, no npm imports
- Derives types from responder using `Parameters<>` / `Awaited<ReturnType<>>`

### 2. Flow integration test: `src/flows/primitive-duplicate-detection/primitive-duplicate-detection-flow.integration.test.ts`
- Moves the existing 6 integration tests from `startup/start-primitive-duplicate-detection.integration.test.ts`
- Same test structure: spawns via `npx tsx` pointing at the startup file
- Tests verify end-to-end wiring (startup → flow → responder → broker)

### 3. Responder: `src/responders/primitive-duplicate-detection/run/primitive-duplicate-detection-run-responder.ts`
- Receives `{ args: readonly string[] }` (raw CLI args)
- Contains ALL the logic currently in startup:
  - Arg parsing (`.find()`, `.split()`, ternaries)
  - Contract parsing (globPatternContract, absoluteFilePathContract, occurrenceThresholdContract)
  - Calling `duplicateDetectionDetectBroker`
  - Formatting output to stdout
- Imports: brokers, contracts, statics (all allowed for responders)

### 4. Responder proxy: `src/responders/primitive-duplicate-detection/run/primitive-duplicate-detection-run-responder.proxy.ts`
- Mocks the broker dependency
- Provides semantic helper methods for test setup

### 5. Responder test: `src/responders/primitive-duplicate-detection/run/primitive-duplicate-detection-run-responder.test.ts`
- Unit tests for arg parsing logic, output formatting, default values
- Tests the branching paths that moved from startup:
  - Pattern arg present vs absent
  - CWD arg present vs absent
  - Threshold arg present vs absent
  - Min-length arg present vs absent
  - Zero duplicates vs many duplicates
  - Regex vs string duplicate types

## Files to Modify

### 6. `src/startup/start-primitive-duplicate-detection.ts`
- Strip to pure delegation (like `start-install.ts` pattern)
- Import only from flow
- Remove `isMain` guard entirely (this is a hook script — always invoked directly, no guard needed)
- Remove broker import, contract imports, statics imports
- Single arrow function body delegating to `PrimitiveDuplicateDetectionFlow`

## Files to Delete

### 7. `src/startup/start-primitive-duplicate-detection.integration.test.ts`
- Moves to `flows/primitive-duplicate-detection/` (file 2 above)
- Delete original after move

## Design Notes

- **No bin entry file needed**: The startup is invoked via `npx tsx` in the integration tests and presumably by the tooling package directly. The `require.main === module` guard is removed entirely since hook scripts are always invoked directly.
- **Responder action is `run`**: The responder parses args, calls the broker, and writes output — this is a "run" action.
- **Integration tests stay as integration tests**: They spawn a child process and test the full stack. They belong at the flow level, not the responder level. The responder gets its own unit tests via proxy.
- **Startup signature preserved**: `StartPrimitiveDuplicateDetection` stays as the export name, returns `Promise<void>`.

# Plan: `reset` Step Verb

## 1. Specification References & Requirements

Re-derived line numbers against `scrolls/seigelense/siegelense-tooling.md`:

| Requirement | Spec Line | Specification Description |
|---|---|---|
| R1. Step name and purpose | 1047–1069, 1078, 2107, 2653–2665 | `reset` provides three named reset levels (`page`, `state`, `instance`), each declaring what it clears, what it keeps, and reporting the diff it undid. |
| R2. Input shape | 2656–2660 | `{ step: 'reset', level: 'page' \| 'state' \| 'instance', to?: SnapshotName \| null, reseed?: string \| null, node?: string \| null, expect?: 'ok' \| 'error' }`. `level: 'state'` takes an explicit `to` naming the target snapshot. `level: 'instance'` accepts optional `reseed` naming a recipe. |
| R3. Browserless support | 1033, 1067 | `level: 'state'` and `level: 'instance'` operate on disk and server processes and run seamlessly browserless on `dungeonmaster-headless`. `level: 'page'` requires a browser session and refuses on headless with `BrowserStepUnsupportedError`. |
| R4. Non-acting & Non-capturing | 45, 51 | `reset` rewinds state rather than acting as a user UI interaction. Belongs in `verbs.all`, excluded from `verbs.acting`, `verbs.capturing`, and `verbs.targeting`. |
| R5. Diff calculation and reporting | 1078, 2658–2659 | Reports the diff it undid: `{ restored: string, undid: { files: number, added: number, modified: number, removed: number }, NOT_cleared: string[] }`. |
| R6. Snapshot resolution | 2663, 2685 | `level: 'state'` resolves snapshot via `snapshotResolveBroker({ homePath, name: to })`. Non-existent snapshot throws `SnapshotMissingError`. |

---

## 2. Architecture & Layer Boundaries

Following Dungeonmaster architecture rules:
- **Statics:**
  - `packages/siegelense/src/statics/step/step-statics.ts`: add `'reset'` to `verbs.all` (23rd verb, completing the closed step vocabulary!).
  - `packages/siegelense/src/statics/reset/reset-statics.ts` + `.test.ts`: default NOT_cleared per level (`page`: `['disk', 'server memory']`, `state`: `['server memory', 'open websockets']`, `instance`: `[]`).
- **Contracts & Stubs:**
  - `packages/siegelense/src/contracts/reset-level/reset-level-contract.ts` + stub + test:
    `z.enum(['page', 'state', 'instance'])`.
  - `packages/siegelense/src/contracts/reset-undid/reset-undid-contract.ts` + stub + test:
    `{ files: z.number().int().nonnegative(), added: z.number().int().nonnegative(), modified: z.number().int().nonnegative(), removed: z.number().int().nonnegative() }`.
  - `packages/siegelense/src/contracts/reset-reading/reset-reading-contract.ts` + stub + test:
    `{ restored: z.string(), undid: resetUndidContract, NOT_cleared: z.array(z.string()) }`.
  - Update `stepContract` (`packages/siegelense/src/contracts/step/step-contract.ts` and stub) to add `reset` variant:
    `{ step: z.literal('reset'), level: resetLevelContract.default('state'), to: snapshotNameContract.nullable().default(null), reseed: z.string().nullable().default(null), node: nodeLabelContract.nullable().default(null), expect: stepExpectationContract.default(stepStatics.defaults.expect) }` refined so `level !== 'state' || to !== null`.
  - Update `browserSessionContract` (`packages/siegelense/src/contracts/browser-session/browser-session-contract.ts` and stub) to add:
    `clearStorage: () => Promise<void>`.
- **Adapters:**
  - Update `playwrightSessionAdapter`:
    Implement `clearStorage`: evaluates `window.localStorage.clear(); window.sessionStorage.clear();`.
  - Update `playwrightSessionAdapterProxy` and test.
- **Transformers:**
  - `packages/siegelense/src/transformers/reset-reading-render/reset-reading-render-transformer.ts` + `.test.ts`:
    Takes `ResetReading` and returns `JSON.stringify(reading)` as `ContentText`.
- **Brokers:**
  - `packages/siegelense/src/brokers/step/reset/snapshot-restore-layer-broker.ts` + `.proxy.ts` + `.test.ts`:
    Takes `{ homePath: AbsoluteFilePath, payloadPath: AbsoluteFilePath }`.
    Compares files between `homePath` and `payloadPath` (excluding `.siegelense-snapshots`), removes added files, copies payload files into `homePath` with `fsCpAdapter`, computes `{ files, added, modified, removed }`.
  - `packages/siegelense/src/brokers/step/reset/step-reset-broker.ts` + `.proxy.ts` + `.test.ts`:
    Takes `{ lane: LaneSession, level: ResetLevel, to: SnapshotName | null, reseed: string | null }`.
    Handles `level`:
    - `page`: requires browser session (throws `BrowserStepUnsupportedError` on headless). Calls `session.clearStorage()`.
    - `state`: requires `to`. Calls `snapshotResolveBroker({ homePath: lane.homePath, name: to })`. Calls `snapshotRestoreLayerBroker`. If browser is open, calls `session.clearStorage()`.
    - `instance`: clears storage and restores/reseeds.
    Calls `resetReadingRenderTransformer` and returns `ContentText`.
  - Wire `step.step === 'reset'` in `runVerbLayerBroker`.
  - Update `docsStatics` and tests for verb count (climbs from 22 to 23). Mark `reset` as built!
  - Export new statics, contracts, transformers, brokers in package barrels.

---

## 3. Verification & Driving Plan

1. **Unit Tests & Scoped Ward:**
   - Scoped ward across all touched files.
2. **Manual Driving (The Driver & Fixer):**
   - Boot `dungeonmaster-web` instance.
   - Run batch:
     1. `snapshot` `as: "clean"`
     2. `goto` `/` and store localStorage items
     3. `reset` `level: "page"` — verify browser storage cleared
     4. mutate files in instance home
     5. `reset` `level: "state", to: "clean"` — verify files restored and diff reported in reading
   - Test `dungeonmaster-headless` instance:
     - `snapshot` `as: "init"`
     - mutate file
     - `reset` `level: "state", to: "init"` — verify it succeeds browserless
     - `reset` `level: "page"` — verify it refuses on headless with `BrowserStepUnsupportedError`
   - Test non-existent snapshot name: verify `SnapshotMissingError`.
   - Teardown & clean sweep.

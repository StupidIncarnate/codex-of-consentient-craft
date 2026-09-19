# Plan: `snapshot` Step Verb

## 1. Specification References & Requirements

Re-derived line numbers against `scrolls/seigelense/siegelense-tooling.md`:

| Requirement | Spec Line | Specification Description |
|---|---|---|
| R1. Step name and purpose | 1004, 1051, 1075, 2107, 2667–2673 | `snapshot` marks a named restore point on disk that `reset` can return to. Covers the state subtree only (evidence sits outside and accumulates forward). |
| R2. Input shape | 2671 | `{ step: 'snapshot', as: SnapshotName, node?: string \| null, expect?: 'ok' \| 'error' }`. `as` is a branded `SnapshotName` (non-empty, alphanumeric with `._:-`, not ending in reserved automatic suffixes `:start` / `:end`). |
| R3. Browserless support | 1033, 1051 | Touches disk state in `lane.homePath` and touches no page at all. Works on both `dungeonmaster-web` and `dungeonmaster-headless`. Belongs in `verbs.all`, NOT in `verbs.browser`. |
| R4. Non-acting & Non-capturing | 45, 51 | Marks a state checkpoint, not a page DOM action or screenshot capture. Belongs in `verbs.all`, excluded from `verbs.acting`, `verbs.capturing`, and `verbs.targeting`. |
| R5. Output reading | 2671 | Returns ContentText reading indicating the snapshot name recorded: `snapshot "${as}" recorded`. Unblocks manual rows (`manual: true`) in `dungeonmaster siegelense snapshots`. |

---

## 2. Architecture & Layer Boundaries

Following Dungeonmaster architecture rules:
- **Statics:**
  - `packages/siegelense/src/statics/step/step-statics.ts`: add `'snapshot'` to `verbs.all` (22nd verb). Excluded from `acting`, `capturing`, `targeting`, and `browser`.
  - `packages/siegelense/src/statics/snapshot/snapshot-statics.ts`: reading template.
- **Contracts & Stubs:**
  - Update `stepContract` (`packages/siegelense/src/contracts/step/step-contract.ts` and stub):
    Add `snapshot` variant with `as: snapshotNameContract`.
- **Transformers:**
  - `packages/siegelense/src/transformers/snapshot-reading-render/snapshot-reading-render-transformer.ts` + `.test.ts`:
    Renders `snapshot "${as}" recorded` as `ContentText`.
- **Brokers:**
  - `packages/siegelense/src/brokers/step/snapshot/step-snapshot-broker.ts` + `.proxy.ts` + `.test.ts`:
    Takes `{ lane: LaneSession, as: SnapshotName }`. Calls `snapshotCaptureBroker({ homePath: lane.homePath, name: as, manual: true })`.
    Renders and returns `ContentText`.
  - Wire `step.step === 'snapshot'` in `runVerbLayerBroker` (before `session === null` check).
  - Update `docsStatics` and tests for verb count (climbs from 21 to 22).
  - Export new broker and transformer in package barrels.

---

## 3. Verification & Driving Plan

1. **Unit Tests & Scoped Ward:**
   - Scoped ward across all touched files.
2. **Manual Driving (The Driver & Fixer):**
   - Boot `dungeonmaster-web` instance.
   - Run batch with `snapshot`:
     `[{"step":"snapshot","as":"clean"}]`
     Verify status `done`, reading reports `snapshot "clean" recorded`.
   - Run `dungeonmaster siegelense snapshots --instance <instanceId>`:
     Verify snapshot `clean` appears with `manual: true`.
   - Run on `dungeonmaster-headless` instance:
     Verify `snapshot` succeeds on browserless instance (touching disk home only).
   - Test adversarial refusal: `as: "foo:start"` (refused because `:start` is reserved for automatic pair).
   - Teardown & clean sweep.

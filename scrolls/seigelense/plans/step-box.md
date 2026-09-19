# Plan — the `box` step verb

**Part 7 item 10 (part) and Part 8 (line 2573).** Written before any code, against `siegelense-tooling.md`
at commit `8d4994c41`. Every line number below was re-derived from the file in this checkout, not copied from
the ledger.

## Why this piece, and why it beat the others

The picking rule in `HANDOFF.md` runs in order, and this is where it lands.

**Rule 1 — does a built thing lie or half-work?** No. Built calls and verbs currently pass and behave as
documented.

**Rule 2 — what blocks a session from verifying a browser feature end to end?** Reading element geometry.
`look` shipped Rungs 1 and 2 (`look` and `look { within }`). A walker that needs one element's exact geometry
(bounding rect, viewport coordinates, inViewport, visibility) currently has no rung to step to other than falling
off the ladder to `eval`.

**Rule 3 — what unblocks the most other rows?** `box` is Rung 3 of the reading ladder (`siegelense-tooling.md`
line 634: `look` → `look { within }` → `box` → `dom` → `eval`). With `look`, `seed`, and `until` delivered,
`box` completes the element-specific geometry read step for refs minted by `look`.

**Rule 4 — what would a consumer hit first?** A walker verifying layout, positioning, clipping, or modal placement
without resorting to arbitrary JavaScript in `eval`.

**Tie-break toward the smaller piece:** `box` is cleanly bounded, sized for a single sitting, and fully
drivable and verifiable.

## 1. The requirements, one row per thing the spec says

| # | Requirement | Spec line |
|---|---|---|
| R1 | `box` is a step verb taking `{ step: 'box', ref: number }`, in `verbs.all` and `verbs.browser` | 634, 2587 |
| R2 | `box { ref }` returns one element's geometry, exactly, as a few lines (a JSON `BoxReading`) | 634 |
| R3 | `BoxReading` carries `ref`, `x`, `y`, `width`, `height`, `viewport` (`{ width, height }`), `visible`, and `inViewport` | 634 |
| R4 | `box` is a pure reading step: it does not act on the page (`verbs.acting` excludes it) and does not capture screenshots (`verbs.capturing` excludes it) | 740, 742 |
| R5 | `box` requires a browser; running `box` on a browserless spec (e.g. `dungeonmaster-headless`) throws `BrowserStepUnsupportedError` naming `box` and the spec name | 2130, 2154 |
| R6 | If `ref` is stale (e.g. detached from DOM or navigation boundary crossed), `box` throws `RefStaleError` naming the ref and boundary | 2190, 2210 |
| R7 | If `ref` was never minted on this instance (`ref > highestMinted`), `box` throws `RefUnknownError` naming the ref | 2190, 2210 |
| R8 | `stepContract` validates the `box` step object strictly: `{ step: 'box', ref: refContract, node: nodeLabelContract.nullable().default(null), expect: stepExpectationContract.default(stepStatics.defaults.expect) }` and rejects unrecognized keys or missing `ref` | 2587 |
| R9 | The reading is formatted via a dedicated transformer `boxReadingRenderTransformer` producing `ContentText` | 634 |
| R10 | `docs` statics updates to announce `box` among built verbs and marks Rung 3 `Built.` instead of `NOT BUILT YET`. Scope `operating` must not contain the word `box` | 187 |

## 2. Architecture and Data Flow

1. **Contract**: `boxReadingContract` in `packages/siegelense/src/contracts/box-reading/box-reading-contract.ts`:
   - `ref: refContract`
   - `x: z.number().int()`
   - `y: z.number().int()`
   - `width: pixelCountContract`
   - `height: pixelCountContract`
   - `viewport: z.object({ width: pixelCountContract, height: pixelCountContract })`
   - `visible: z.boolean()`
   - `inViewport: z.boolean()`
   Strict schema, branded where appropriate.

2. **Step Contract**: `packages/siegelense/src/contracts/step/step-contract.ts`:
   - Add `box` member with `ref: refContract`, `node`, `expect`. Strict object.

3. **Statics**: `packages/siegelense/src/statics/step/step-statics.ts`:
   - Add `'box'` to `verbs.all` and `verbs.browser`.
   - Excluded from `verbs.acting` and `verbs.capturing`.

4. **Adapter**:
   - In `packages/siegelense/src/adapters/playwright/session/ref-registry-layer-adapter.ts`:
     Add `boxSource: ({ ref }: { ref: number }) => ContentText`.
     Page-side JavaScript reads `window.__siege.refs[ref - 1]`. If present and connected, evaluates `getBoundingClientRect()` and computed styles for `visible`, and window dimensions for `inViewport` and `viewport`.
   - In `packages/siegelense/src/contracts/browser-session/browser-session-contract.ts`:
     Add `boxRef: ({ ref }: { ref: number }) => Promise<BoxReading>;` to `BrowserSession`.
   - In `packages/siegelense/src/adapters/playwright/session/playwright-session-adapter.ts`:
     Implement `boxRef`. If page evaluation returns null, resolve refState to throw `RefStaleError` or `RefUnknownError`.

5. **Broker & Transformer**:
   - `packages/siegelense/src/transformers/box-reading-render/box-reading-render-transformer.ts`:
     Turns `BoxReading` into `ContentText` via `JSON.stringify(reading)`.
   - `packages/siegelense/src/brokers/step/box/step-box-broker.ts`:
     Calls `session.boxRef({ ref })`, renders via `boxReadingRenderTransformer`.
   - `packages/siegelense/src/brokers/step/dispatch/run-verb-layer-broker.ts`:
     Before executing `box`, resolve `stepTargetResolveBroker({ session, target: null, within: null, ref: step.ref })`.
     Then call `stepBoxBroker({ session, ref: step.ref })`.

6. **Docs Statics**:
   - In `packages/siegelense/src/statics/docs/docs-statics.ts`:
     Update Rung 3 line in `walking` scope: `Rung 3, box { ref } — one element's geometry, exactly. A few lines. Built.`
     Update list of step verbs in `walking` and `driving` to include `box`.
     Ensure `operating` scope continues to exclude `box`.

## 3. Test Plan

- Unit test `boxReadingContract.test.ts`: validates valid and invalid shapes.
- Unit test `refRegistryLayerAdapter.test.ts`: tests `boxSource` output.
- Unit test `boxReadingRenderTransformer.test.ts`: serializes `BoxReading` to JSON `ContentText`.
- Unit test `stepBoxBroker.test.ts`: tests happy path with mock BrowserSession.
- Unit test `runVerbLayerBroker.test.ts`: verifies `box` step routing and `stepTargetResolveBroker` integration.
- Unit test `stepContract.test.ts`: verifies `{ step: 'box', ref: 26 }` is parsed, and invalid keys are rejected.
- Unit test `playwrightSessionAdapter.test.ts`: proxy and unit tests for `boxRef`.
- Integration test in `packages/siegelense/src/flows/driver/driver-flow.integration.test.ts` or step integration tests: verifies `box` against a live session.

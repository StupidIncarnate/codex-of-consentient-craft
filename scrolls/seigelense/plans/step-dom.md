# Plan — the `dom` step verb

**Part 7 item 10 and Part 8 (lines 617–670, 2091, 2589, 2598–2601).** Written before any code,
against `siegelense-tooling.md` at commit `27bb2dd9c`. Every line number below was re-derived from
the file in this checkout, not copied from the ledger.

## Why this piece, and why it beat the others

The picking rule in `HANDOFF.md` runs in order, and this is where it lands.

**Rule 1 — does a built thing lie or half-work?** No. All 13 calls and 10 built verbs pass, behave as
documented, and are field-driven.

**Rule 2 — what blocks a session from verifying a browser feature end to end?** Escaping the shaped
reading of `look` and `box`. `look` shipped Rungs 1 and 2, and `box` shipped Rung 3. When a walker
needs an unprojected attribute (`maxlength`, `pattern`, `title`), a match count across the whole
document, or the raw DOM shape of something surprising, Rung 4 (`dom { target }`) is the escape hatch
designed for it. Without it, sessions must resort to arbitrary JavaScript in `eval`.

**Rule 3 — what unblocks the most other rows?** `dom` completes Part 7 item 10 ("Selectable
readings — `network` by method and path, projecting fields; and the same projection plus a
self-reporting cap on `dom`, with own text as its default"). It also completes the entire 4-rung
reading ladder (`look` → `look { within }` → `box` → `dom`).

**Rule 4 — what would a consumer hit first?** A walker querying elements by CSS selector or counting
rendered items across a container.

**Tie-break toward the smaller piece:** `dom` is cleanly bounded, sized for a single sitting, and
fully testable and drivable.

## 1. The requirements, one row per thing the spec says

| # | Requirement | Spec line |
|---|---|---|
| R1 | `dom` is a step verb taking `{ step: 'dom', target: string, fields?: DomField[] \| null, text?: 'own' \| 'full' \| null }`, in `verbs.all` and `verbs.browser` | 635, 658–660, 2091, 2589 |
| R2 | `dom` is a pure reading step: it does not act on the page (`verbs.acting` excludes it) and does not capture screenshots (`verbs.capturing` excludes it) | 635, 2575 |
| R3 | `dom` is NOT a targeting verb (`verbs.targeting` excludes it): multiple matches do NOT throw `StepAmbiguousError`, and zero matches do NOT throw `StepNoMatchError` | 646, 655, 660, 2131–2157 |
| R4 | `dom` requires a browser; running `dom` on a browserless spec (e.g. `dungeonmaster-headless`) throws `BrowserStepUnsupportedError` naming `dom` and the spec name | 2130, 2154 |
| R5 | Guard 1: Own text by default (`nodeType === 3` children, normalized whitespace, trimmed, sliced to limit); `text: 'full'` opts into `textContent` | 624–626, 653, 2091, 2598 |
| R6 | Guard 2: `fields:` projects fields on node readings, matching the query pattern of `network` | 654, 658, 659, 2091, 2589 |
| R7 | If `fields: ['count']` is requested, the reading returns `{ count: N }` without projecting nodes | 646, 654, 658 |
| R8 | Guard 3: A match cap that reports what it showed alongside the true `count` — default cap of 10 matches (`domStatics.limits.maxMatches = 10`) | 655, 660, 2091, 2599 |
| R9 | When matches exceed the cap (`count > showing`), `capped: true` and `note` indicates `'count: <count>, showing <showing>, capped. Narrow this.'` | 655, 660 |
| R10 | When matches are within the cap (`count <= showing`), `capped: false` and `note: null` | 655 |
| R11 | Default node fields (when `fields` is null): `tagName`, `testId`, `className`, `childCount`, `display`, `visibility`, `opacity`, `rect`, `text`, `attrs`, `value` | 644, 647, 659, 2589 |
| R12 | `stepContract` validates `{ step: 'dom', target: selectorContract, fields: z.array(domFieldContract).readonly().nullable().default(null), text: domTextModeContract.nullable().default(null), node, expect }` strictly, rejecting unrecognized keys | 2589 |
| R13 | The reading is serialized via `domReadingRenderTransformer` into JSON `ContentText` | 658–660 |
| R14 | `docs` statics updates to announce `dom` among built verbs and marks Rung 4 `Built.` instead of `NOT BUILT YET`. Scope `operating` must not contain the word `dom` | 188 |

## 2. Architecture and Data Flow

1. **Statics**:
   - `packages/siegelense/src/statics/dom/dom-statics.ts`:
     - `limits: { maxMatches: 10, textChars: 4000 }`
     - `fields: { all: [...], defaultNodeFields: [...] }`
     - `textModes: { all: ['own', 'full'], default: 'own' }`
     - `cappedNote: ({ count, showing }: { count: number; showing: number }) => ContentText`
   - `packages/siegelense/src/statics/step/step-statics.ts`:
     - Add `'dom'` to `verbs.all` and `verbs.browser`.
     - Excluded from `verbs.acting`, `verbs.capturing`, and `verbs.targeting`.

2. **Contracts**:
   - `packages/siegelense/src/contracts/dom-field/dom-field-contract.ts`:
     - `z.enum([...domStatics.fields.all])`
   - `packages/siegelense/src/contracts/dom-text-mode/dom-text-mode-contract.ts`:
     - `z.enum(domStatics.textModes.all)`
   - `packages/siegelense/src/contracts/dom-rect/dom-rect-contract.ts`:
     - `{ x, y, width, height }` strictly validated with pixelCoordinate and pixelCount contracts.
   - `packages/siegelense/src/contracts/dom-node/dom-node-contract.ts`:
     - Object with optional fields representing the projected/unprojected node properties.
   - `packages/siegelense/src/contracts/dom-reading/dom-reading-contract.ts`:
     - `{ count: readingCountContract, showing?: readingCountContract, capped?: boolean, note?: contentTextContract.nullable(), nodes?: readonly DomNode[] }`
   - `packages/siegelense/src/contracts/step/step-contract.ts`:
     - Add `dom` member to the discriminated union.

3. **Guards**:
   - `packages/siegelense/src/guards/is-targeting-step/is-targeting-step-guard.ts`:
     - Guard explicitly ensures `step.step !== 'dom'`, keeping `dom` outside the ambiguity/targeting resolution.

4. **Adapters**:
   - `packages/siegelense/src/adapters/playwright/session/dom-read-layer-adapter.ts`:
     - Builds page-side evaluation script for querying elements via `document.querySelectorAll(target)`,
       extracting own text vs textContent, computed styles, rects, attributes, and slicing to `maxMatches`.
   - In `BrowserSession` contract:
     - Add `readDom: (params: { target: string; fields: readonly DomField[] | null; text: DomTextMode | null }) => Promise<DomReading>`
   - In `playwrightSessionAdapter`:
     - Implement `readDom`.

5. **Broker & Transformer**:
   - `packages/siegelense/src/transformers/dom-reading-render/dom-reading-render-transformer.ts`:
     - Formats `DomReading` as `ContentText` via `JSON.stringify(reading)`.
   - `packages/siegelense/src/brokers/step/dom/step-dom-broker.ts`:
     - Calls `session.readDom({ target, fields, text })` and passes to `domReadingRenderTransformer`.
   - In `packages/siegelense/src/brokers/step/dispatch/run-verb-layer-broker.ts`:
     - Routes `step.step === 'dom'` to `stepDomBroker`.

6. **Docs Statics**:
   - Update `packages/siegelense/src/statics/docs/docs-statics.ts`:
     - Rung 4 marked `Built.`
     - Total verbs count updated from 10 to 11.
     - `walking` and `driving` scopes include `dom` in examples.
     - `operating` scope verified clean of `dom`.

## 3. Test Plan

- Unit test `domFieldContract.test.ts`: validates all allowed field names.
- Unit test `domTextModeContract.test.ts`: validates `'own'` and `'full'`.
- Unit test `domRectContract.test.ts`: validates coordinate/count fields.
- Unit test `domNodeContract.test.ts` & `domReadingContract.test.ts`: validates valid and invalid shapes.
- Unit test `domReadLayerAdapter.test.ts`: verifies generated page-side source string.
- Unit test `domReadingRenderTransformer.test.ts`: serializes `DomReading` to JSON `ContentText`.
- Unit test `stepDomBroker.test.ts`: tests execution and rendering with mock session.
- Unit test `runVerbLayerBroker.test.ts`: verifies `dom` step routing.
- Unit test `stepContract.test.ts`: validates parsing `{ step: 'dom', target: '...' }` and options.
- Unit test `isTargetingStepGuard.test.ts`: verifies `dom` is not considered a targeting step.
- Unit test `playwrightSessionAdapter.test.ts`: verifies `readDom` method.
- Docs test `docsStatics.test.ts`: ensures docs stay accurate and `operating` stays free of step verbs.

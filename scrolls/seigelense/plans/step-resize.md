# Step Verb: `resize` Plan

> **Tracking:** Part 7 Item 15 (line 2108), Part 8 line 2734–2738 of `scrolls/seigelense/siegelense-tooling.md`.

---

## 1. Requirements & Spec Citations

| # | Spec Citation | Requirement |
|---|---|---|
| R1 | Line 2108 | Part 7 item 15: "`resize`, and a direct `request` step for the curl surface — Coverage no walk can reach today" |
| R2 | Line 2580 | Part 8 Steps that exist today / new: `resize` is in the closed step vocabulary |
| R3 | Line 2614 | Listed under Steps that are new |
| R4 | Line 2734 | "`resize` — one viewport is the only one anything has ever been walked at." |
| R5 | Line 2737 | Syntax: `{ step: 'resize', width: 1280, height: 1024 }` |
| R6 | Lines 1613, 2128-2130 | Browser requirement: `resize` acts on the browser page, so it belongs in `verbs.browser` and errors with `BrowserStepUnsupportedError` on headless |
| R7 | Line 696 | Acting step: `resize` changes the page viewport/layout, belongs in `verbs.acting` and `verbs.capturing` — captures an unasked screenshot with `pixelChange` and `blank` |
| R8 | Line 1598 | Step reading: returns a reading `resized to <width>x<height>` (ContentText) |
| R9 | Architecture | Validation: `width` and `height` must be positive integers |

---

## 2. Architecture & File Layout

### Statics
- `packages/siegelense/src/statics/step/step-statics.ts`:
  - `verbs.all`: add `'resize'`
  - `verbs.acting`: add `'resize'`
  - `verbs.capturing`: add `'resize'`
  - `verbs.browser`: add `'resize'`
- `packages/siegelense/src/statics/resize/resize-statics.ts`:
  - Min/max viewport constraints if applicable, format template `resized to {width}x{height}`

### Contracts & Stubs
- `packages/siegelense/src/contracts/step/step-contract.ts`:
  - Add `{ step: z.literal('resize'), width: z.number().int().positive(), height: z.number().int().positive() }`
- `packages/siegelense/src/contracts/browser-session/browser-session-contract.ts`:
  - Add `setViewport: (params: { width: number; height: number }) => Promise<void>`

### Adapters
- `packages/siegelense/src/adapters/playwright/session/viewport-set-layer-adapter.ts` + `.proxy.ts` + `.test.ts`:
  - Calls `page.setViewportSize({ width, height })`
- Update `playwrightSessionAdapter` and `playwrightSessionAdapterProxy` to expose `setViewport`

### Transformers
- `packages/siegelense/src/transformers/resize-reading-render/resize-reading-render-transformer.ts` + `.test.ts`:
  - Formats `{ width, height }` to ContentText `resized to {width}x{height}`

### Brokers
- `packages/siegelense/src/brokers/step/resize/step-resize-broker.ts` + `.proxy.ts` + `.test.ts`:
  - Calls `session.setViewport({ width: step.width, height: step.height })`
  - Returns rendered ContentText
- `packages/siegelense/src/brokers/step/dispatch/run-verb-layer-broker.ts`:
  - Route `step.step === 'resize'` to `stepResizeBroker`
- `packages/siegelense/src/statics/docs/docs-statics.ts`:
  - Update verb count from 13 to 14

---

## 3. Manual Verification (The Driver)

1. Boot instance `dungeonmaster-web`.
2. Run `goto /` -> captures initial desktop viewport (e.g. 1280x720).
3. Run `resize { width: 375, height: 667 }` (mobile viewport) -> captures shot, returns `resized to 375x667`.
4. Inspect shot and results off disk: verify viewport changed to 375x667 and `pixelChange` is non-null.
5. Run against `dungeonmaster-headless`: verify `BrowserStepUnsupportedError` mentioning `resize`.
6. Tear down instance and sweep process table/sockets.

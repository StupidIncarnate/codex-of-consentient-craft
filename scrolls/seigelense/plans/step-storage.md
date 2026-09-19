# Plan: `storage` Step Verb

## 1. Specification References & Requirements

Re-derived line numbers against `scrolls/seigelense/siegelense-tooling.md`:

| Requirement | Spec Line | Specification Description |
|---|---|---|
| R1. Step name and purpose | 1053, 1066, 2413, 2580, 2595 | `storage` reads browser storage (`localStorage` and `sessionStorage`) for the active page, filtered by prefix. |
| R2. Input shape | 2595 | `{ step: 'storage', prefix?: string, node?: string \| null, expect?: 'ok' \| 'error' }`. `prefix` defaults to `''` (matches all keys). |
| R3. Browser-only | 1053, 1613, 2128 | Requires a browser session. Refuses by name on browserless specs (`dungeonmaster-headless`) with `BrowserStepUnsupportedError`. |
| R4. Non-acting / Non-capturing / Non-targeting | 41, 47, 53 | Does not change page state, capture screenshots, or resolve locators. Excluded from `verbs.acting`, `verbs.capturing`, and `verbs.targeting`. |
| R5. Reading output | 2595 | Evaluates in the active page and extracts `{ origin, local: { ... }, session: { ... } }` filtered by `key.startsWith(prefix)`. Returns JSON representation as `ContentText`. |

---

## 2. Architecture & Layer Boundaries

Following Dungeonmaster architecture rules:
- **Statics:**
  - `packages/siegelense/src/statics/step/step-statics.ts`: add `'storage'` to `verbs.all` (18th verb) and `verbs.browser`. Keep excluded from `verbs.acting`, `verbs.capturing`, and `verbs.targeting`.
  - `packages/siegelense/src/statics/storage/storage-statics.ts` + `.test.ts`: defaults (`prefix: ''`).
- **Contracts & Stubs:**
  - `packages/siegelense/src/contracts/storage-reading/storage-reading-contract.ts` + stub + test:
    Schema: `{ origin: z.string(), local: z.record(z.string().nullable()), session: z.record(z.string().nullable()) }`.
  - `packages/siegelense/src/contracts/browser-session/browser-session-contract.ts` + stub:
    Add `readStorage: ({ prefix }: { prefix: string }) => Promise<StorageReading>`.
  - Update `stepContract` (`packages/siegelense/src/contracts/step/step-contract.ts` and stub):
    `{ step: z.literal('storage'), prefix: z.string().default(''), node: nodeLabelContract.nullable().default(null), expect: stepExpectationContract.default(stepStatics.defaults.expect) }`.
- **Adapters:**
  - `packages/siegelense/src/adapters/playwright/session/storage-read-layer-adapter.ts` + `.proxy.ts` + `.test.ts`:
    Takes `{ page: Page, prefix: string }`.
    Evaluates on `page`:
    ```ts
    const result = await page.evaluate((prefix) => ({
      origin: window.location.origin,
      local: Object.fromEntries(
        Object.keys(window.localStorage)
          .filter((k) => k.startsWith(prefix))
          .map((k) => [k, window.localStorage.getItem(k)]),
      ),
      session: Object.fromEntries(
        Object.keys(window.sessionStorage)
          .filter((k) => k.startsWith(prefix))
          .map((k) => [k, window.sessionStorage.getItem(k)]),
      ),
    }), prefix);
    return storageReadingContract.parse(result);
    ```
  - Update `playwrightSessionAdapter` and proxy to wire `readStorage`.
- **Transformers:**
  - `packages/siegelense/src/transformers/storage-reading-render/storage-reading-render-transformer.ts` + `.test.ts`:
    Takes `{ reading: StorageReading }` and renders `JSON.stringify(reading)` as `ContentText`.
- **Brokers:**
  - `packages/siegelense/src/brokers/step/storage/step-storage-broker.ts` + `.proxy.ts` + `.test.ts`:
    Takes `{ session: BrowserSession, prefix: string }`.
    Calls `await session.readStorage({ prefix })`.
    Calls `storageReadingRenderTransformer({ reading })`.
    Returns `ContentText`.
  - Wire `step.step === 'storage'` in `runVerbLayerBroker`.
- **Docs & Barrels:**
  - Update `docsStatics` and tests for verb count (climbs from 17 to 18).
  - Export new contract, statics, and broker in root barrels.

---

## 3. Verification & Driving Plan

1. **Unit Tests & Ward:**
   - Scoped ward across all touched files.
2. **Manual Driving (The Driver & Fixer):**
   - Boot `dungeonmaster-web` instance.
   - Run batch setting storage and reading it:
     1. `goto` `/`
     2. `eval` setting `localStorage.setItem('dm-test-key', 'siege-val-123')` and `sessionStorage.setItem('dm-sess-key', 'siege-sess-456')`
     3. `storage` with `prefix: 'dm-'`
     Verify Step 3 reading returns JSON containing `dm-test-key: 'siege-val-123'` and `dm-sess-key: 'siege-sess-456'`.
   - Run `storage` with `prefix: 'nonexistent-'` and verify empty records.
   - Run `storage` without prefix (default `''`) and verify all entries returned.
   - Query step results off disk (`results` command).
   - Boot `dungeonmaster-headless` instance, run `storage`, verify refusal with `BrowserStepUnsupportedError`.
   - Kill instances and verify clean sweep.

# Plan: `before` Step Verb

## 1. Specification References & Requirements

Re-derived line numbers against `scrolls/seigelense/siegelense-tooling.md`:

| Requirement | Spec Line | Specification Description |
|---|---|---|
| R1. Step name and purpose | 838, 2091, 2631 | `before` runs a script ahead of the page's own via Playwright's `addInitScript`. It is the substrate that interval counters, clock freezes, animation stubs, and later instrumentations stand on. |
| R2. Input shape | 2634 | `{ step: 'before', source: string, node?: string \| null, expect?: 'ok' \| 'error' }`. Takes `source` as `contentTextContract`. |
| R3. Classification | 838, 1613, 2128 | Browser-only step (`verbs.browser`). Runs against a live browser session. Refuses by name on browserless specs (`dungeonmaster-headless`) with `BrowserStepUnsupportedError`. |
| R4. Non-acting / Non-capturing | 41, 47 | `before` installs an init script; it does not change rendered DOM or take a screenshot unasked. Excluded from `verbs.acting` and `verbs.capturing`. |
| R5. Non-targeting | 53 | Does not target an element or ref. Excluded from `verbs.targeting`. |
| R6. Execution semantics | 838 | Evaluates `page.addInitScript` so the script executes before page scripts run, surviving navigations within the session. |
| R7. Reading output | 2631 | Renders informative reading (`installed init script (${source.length} chars)`). |

---

## 2. Architecture & Layer Boundaries

Following Dungeonmaster architecture rules:
- **Statics:**
  - `packages/siegelense/src/statics/step/step-statics.ts`: add `'before'` to `verbs.all` and `verbs.browser`. Keep excluded from `verbs.acting`, `verbs.capturing`, and `verbs.targeting`.
  - `packages/siegelense/src/statics/before/before-statics.ts`: reading templates and default constants.
- **Contracts & Stubs:**
  - `packages/siegelense/src/contracts/step/step-contract.ts`: add `before` variant to `stepContract`. Update stub.
  - `packages/siegelense/src/contracts/browser-session/browser-session-contract.ts`: add `addInitScript: ({ source }: { source: string }) => Promise<void>` to `BrowserSession`. Update stub.
- **Adapters:**
  - `packages/siegelense/src/adapters/playwright/session/init-script-add-layer-adapter.ts` + `.proxy.ts` + `.test.ts`:
    Takes `{ page: Page, source: string }` and invokes `await page.addInitScript({ content: source })`.
  - Update `playwrightSessionAdapter` and proxy to wire `addInitScript`.
- **Transformers:**
  - `packages/siegelense/src/transformers/before-reading-render/before-reading-render-transformer.ts` + `.test.ts`:
    Takes `{ source: string }` and formats `installed init script (${source.length} chars)` as `ContentText`.
- **Brokers:**
  - `packages/siegelense/src/brokers/step/before/step-before-broker.ts` + `.proxy.ts` + `.test.ts`:
    Takes `{ session: BrowserSession, source: string }`.
    Calls `await session.addInitScript({ source })`.
    Calls `beforeReadingRenderTransformer({ source })` and returns `ContentText`.
  - Wire `step.step === 'before'` in `runVerbLayerBroker`.
- **Statics & Barrels:**
  - Update `packages/siegelense/statics.ts`, `contracts.ts`, `adapters.ts`, `brokers.ts`.
  - Update `docsStatics` verb count (climbs from 15 to 16) and tests.

---

## 3. Verification & Driving Plan

1. **Unit tests & Ward:**
   - Scoped ward on all modified/new files.
2. **Manual Driving (The Driver & Fixer):**
   - Boot `dungeonmaster-web` instance.
   - Run `before` step followed by `goto`:
     Step 1: `{ step: 'before', source: 'window.__injected = "siegelense-works";' }`
     Step 2: `{ step: 'goto', path: '/' }`
     Step 3: `{ step: 'eval', source: 'window.__injected' }`
     Verify Step 3 reading returns `"siegelense-works"`!
   - Query step results off disk (`results` command) to verify stored reading matches.
   - Attempt `before` on `dungeonmaster-headless`: verify refusal with `BrowserStepUnsupportedError`.
   - Clean up instance, processes, and sockets.

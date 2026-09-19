# Plan: `paste` Step Verb

## 1. Specification References & Requirements

Re-derived line numbers against `scrolls/seigelense/siegelense-tooling.md`:

| Requirement | Spec Line | Specification Description |
|---|---|---|
| R1. Step name and purpose | 1017, 2138, 2580, 2591, 3003 | `paste` focuses an element and delivers a real clipboard paste (`ControlOrMeta+V` with `isTrusted: true`) using file or text contents. |
| R2. Input shape | 2591, 3003 | `{ step: 'paste', target?: string \| null, within?: string \| null, ref?: number \| null, filePath?: string \| null, value?: string \| null, timeoutMs?: number \| null, node?: string \| null, expect?: 'ok' \| 'error' }`. Must specify either `ref` or `target`, and either `filePath` or `value`. |
| R3. Browser-only | 1613, 2128 | Requires a browser session with clipboard permissions. Refuses on `dungeonmaster-headless` with `BrowserStepUnsupportedError`. Belongs in `verbs.browser`. |
| R4. Acting & Capturing | 41, 47 | Pasting changes page state. Belongs in `verbs.acting` and `verbs.capturing` (captures screenshot unasked and records pixelChange). |
| R5. Targeting | 53, 2109 | Targets an element via selector or element-bound ref. Governed by `stepTargetResolveBroker`: ambiguity throws `StepAmbiguousError`, no-match throws `StepNoMatchError`, stale ref throws `RefStaleError`. Belongs in `verbs.targeting`. |
| R6. Execution semantics | 2591 | Focuses the resolved target or ref element, writes payload to browser clipboard (`writeText` for text or `write([ClipboardItem])` for files), and triggers `page.keyboard.press('ControlOrMeta+V')`. |
| R7. Reading output | 2591 | Returns ContentText reading naming what was pasted and into which target/ref (e.g. `pasted "${value}" into ref 14` or `pasted file "${filePath}" into [data-testid="INPUT"]`). |

---

## 2. Architecture & Layer Boundaries

Following Dungeonmaster architecture rules:
- **Statics:**
  - `packages/siegelense/src/statics/step/step-statics.ts`: add `'paste'` to `verbs.all` (19th verb), `verbs.acting`, `verbs.capturing`, `verbs.targeting`, and `verbs.browser`.
  - `packages/siegelense/src/statics/paste/paste-statics.ts` + `.test.ts`: mime types and reading templates.
- **Contracts & Stubs:**
  - Update `stepContract` (`packages/siegelense/src/contracts/step/step-contract.ts` and stub):
    Add `paste` variant with `target`, `within`, `ref`, `filePath`, `value`, `timeoutMs`, `node`, `expect`, refined so at least one target handle (`target` or `ref`) and at least one payload (`filePath` or `value`) is present.
  - Update `browserSessionContract` (`packages/siegelense/src/contracts/browser-session/browser-session-contract.ts` and stub):
    Add `pasteMatch: (params: { target: string; within?: string; filePath: string | null; value: string | null; timeoutMs: number }) => Promise<void>`
    and `pasteRef: (params: { ref: number; filePath: string | null; value: string | null; timeoutMs: number }) => Promise<void>`.
- **Adapters:**
  - `packages/siegelense/src/adapters/playwright/session/paste-layer-adapter.ts` + `.proxy.ts` + `.test.ts`:
    Focuses locator or ref (via stamp/focus/unstamp), writes payload to clipboard (`writeText` or `ClipboardItem`), and presses `ControlOrMeta+V`.
  - Update `playwrightSessionAdapter` and proxy to wire `pasteMatch` and `pasteRef`.
- **Brokers:**
  - `packages/siegelense/src/brokers/step/paste/step-paste-broker.ts` + `.proxy.ts` + `.test.ts`:
    Takes `{ session: BrowserSession, target, within, ref, filePath, value, timeoutMs }`.
    Resolves timeout. Calls `session.pasteRef` or `session.pasteMatch`.
    Formats and returns `ContentText`.
  - Wire `step.step === 'paste'` in `runVerbLayerBroker`.
- **Docs & Barrels:**
  - Update `docsStatics` and tests for verb count (climbs from 18 to 19).
  - Export new statics and broker in root barrels.

---

## 3. Verification & Driving Plan

1. **Unit Tests & Scoped Ward:**
   - Scoped ward across all touched files.
2. **Manual Driving (The Driver & Fixer):**
   - Boot `dungeonmaster-web` instance.
   - Run happy path pasting text into an input:
     1. `goto` `/`
     2. `paste` with `target: '[data-testid="..."]'` or ref and `value: 'test-paste-val'`
     Verify text is pasted, reading describes paste, screenshot is captured unasked (acting step).
   - Run adversarial missing file check (`expect: 'error'` with non-existent `filePath`).
   - Query step results off disk (`results` command).
   - Boot `dungeonmaster-headless` instance, run `paste`, verify refusal with `BrowserStepUnsupportedError`.
   - Teardown & clean sweep.

# Plan: `hold` Step Verb

## 1. Specification References & Requirements

Re-derived line numbers against `scrolls/seigelense/siegelense-tooling.md`:

| Requirement | Spec Line | Specification Description |
|---|---|---|
| R1. Step name and purpose | 826, 2097, 2711–2722 | `hold` captures N frames at an interval and reports which differ. Detects non-settlement (stuck loaders, spinning indicators) or no-feedback states. Runs live (does not disable animations), unlike every comparison capture. |
| R2. Input shape | 2715 | `{ step: 'hold', frames?: number, everyMs?: number, node?: string \| null, expect?: 'ok' \| 'error' }`. `frames` defaults to 4 (minimum 2), `everyMs` defaults to 1500ms (positive integer). |
| R3. Browser-only | 1613, 2128 | Requires a browser session to take screenshots. Refuses on `dungeonmaster-headless` with `BrowserStepUnsupportedError`. Belongs in `verbs.browser`. |
| R4. Capturing & Non-acting | 45, 51 | Observes settlement without driving actions. Belongs in `verbs.capturing`, but NOT in `verbs.acting` or `verbs.targeting`. |
| R5. Execution semantics | 2711–2722 | Captures initial frame 0 immediately, then waits `everyMs` before capturing each subsequent frame up to `frames`. Compares consecutive frames using pixel difference to count how many frames differed. |
| R6. Reading output | 2716–2718 | Returns structured JSON `HoldReading`: `{ frames: number, differing: number, verdict: string, shots: string[] }`. If `differing === 0`, verdict is `'NOTHING CHANGED across <duration>s'`. If `differing > 0`, verdict is `'still changing at <duration>s'`. |

---

## 2. Architecture & Layer Boundaries

Following Dungeonmaster architecture rules:
- **Statics:**
  - `packages/siegelense/src/statics/step/step-statics.ts`: add `'hold'` to `verbs.all` (20th verb), `verbs.capturing`, and `verbs.browser`. Keep excluded from `verbs.acting` and `verbs.targeting`.
  - `packages/siegelense/src/statics/hold/hold-statics.ts` + `.test.ts`: defaults (`frames: 4`, `everyMs: 1500`), verdict templates (`'NOTHING CHANGED across {duration}s'`, `'still changing at {duration}s'`).
- **Contracts & Stubs:**
  - `packages/siegelense/src/contracts/hold-reading/hold-reading-contract.ts` + stub + test:
    `{ frames: z.number().int().min(2), differing: z.number().int().nonnegative(), verdict: z.string(), shots: z.array(z.string()) }`.
  - Update `stepContract` (`packages/siegelense/src/contracts/step/step-contract.ts` and stub):
    Add `hold` variant with `frames: z.number().int().min(2).default(4)`, `everyMs: z.number().int().positive().default(1500)`, `node`, `expect`.
  - Update `browserSessionContract` (`packages/siegelense/src/contracts/browser-session/browser-session-contract.ts` and stub):
    Add `captureLive: ({ filePath }: { filePath: string }) => Promise<void>`.
- **Adapters:**
  - `packages/siegelense/src/adapters/async/delay/async-delay-adapter.ts` + `.proxy.ts` + `.test.ts`:
    Takes `{ ms: number }` and resolves after `setTimeout`.
  - Update `playwrightSessionAdapter` and proxy to wire `captureLive` (`await page.screenshot({ path: filePath, animations: 'allow' })`).
- **Transformers:**
  - `packages/siegelense/src/transformers/hold-reading-render/hold-reading-render-transformer.ts` + `.test.ts`:
    Takes `HoldReading` and returns `JSON.stringify(reading)` as `ContentText`.
- **Brokers:**
  - `packages/siegelense/src/brokers/step/hold/step-hold-broker.ts` + `.proxy.ts` + `.test.ts`:
    Takes `{ session: BrowserSession, lane: LaneSession, index: StepIndex, shotPath: AbsoluteFilePath \| null, frames: number, everyMs: number }`.
    Resolves frame paths: if `shotPath` is provided, places frames in the same directory (`step${index}_frame${i + 1}.png`), otherwise places in `lane.evidencePath`.
    Loops `frames` times: captures live frame using `session.captureLive`, compares with previous frame using `shotChangeReadBroker` (differing if pixelChange is not '0%'), delays by `everyMs` between captures.
    Computes `differing` count and verdict. Copies final or initial frame to `shotPath` if `shotPath` is provided.
    Calls `holdReadingRenderTransformer` and returns `ContentText`.
  - Wire `step.step === 'hold'` in `runVerbLayerBroker`.
  - In `stepDispatchBroker`, exclude `step.step === 'hold'` from secondary capture so it does not overwrite live captures with frozen captures.
- **Docs & Barrels:**
  - Update `docsStatics` and tests for verb count (climbs from 19 to 20).
  - Export new statics, contracts, transformers, brokers in package barrels.

---

## 3. Verification & Driving Plan

1. **Unit Tests & Scoped Ward:**
   - Scoped ward across all touched files.
2. **Manual Driving (The Driver & Fixer):**
   - Boot `dungeonmaster-web` instance.
   - Run happy path with `hold`:
     1. `goto` `/`
     2. `hold` with `frames: 3, everyMs: 500`
     Verify status `done`, reading returns valid JSON with `frames: 3`, `differing`, `verdict`, and `shots`.
   - Query step results off disk (`results` command).
   - Boot `dungeonmaster-headless` instance, run `hold`, verify refusal with `BrowserStepUnsupportedError`.
   - Teardown & clean sweep.

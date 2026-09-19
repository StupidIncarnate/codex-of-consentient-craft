# Plan: `video` Step Verb

## 1. Specification References & Requirements

Re-derived line numbers against `scrolls/seigelense/siegelense-tooling.md`:

| Requirement | Spec Line | Specification Description |
|---|---|---|
| R1. Step name and purpose | 248, 882, 1704, 2097, 2725–2729 | `video` records a screencast across a batch, for a human to watch and for the evidence trail. No step reads it back and no verdict is taken from it. |
| R2. Input shape | 2729 | `{ step: 'video', action: 'start' \| 'stop', node?: string \| null, expect?: 'ok' \| 'error' }`. |
| R3. Browser-only | 1613, 2128 | Requires a browser session with video recording capabilities. Refuses on `dungeonmaster-headless` with `BrowserStepUnsupportedError`. Belongs in `verbs.browser`. |
| R4. Non-acting & Non-capturing | 45, 51 | Recording video is neither an acting step nor a static screenshot capture. Belongs in `verbs.all` and `verbs.browser`, excluded from `verbs.acting`, `verbs.capturing`, and `verbs.targeting`. |
| R5. Output reading | 1704, 2725 | Returns ContentText reading: `'video recording started'` for `start`, or `'video recording stopped — saved to <path>'` for `stop`. |

---

## 2. Architecture & Layer Boundaries

Following Dungeonmaster architecture rules:
- **Statics:**
  - `packages/siegelense/src/statics/step/step-statics.ts`: add `'video'` to `verbs.all` (21st verb) and `verbs.browser`.
  - `packages/siegelense/src/statics/video/video-statics.ts` + `.test.ts`: actions `['start', 'stop']`, reading templates.
- **Contracts & Stubs:**
  - `packages/siegelense/src/contracts/video-action/video-action-contract.ts` + stub + test:
    `z.enum(['start', 'stop'])`.
  - Update `stepContract` (`packages/siegelense/src/contracts/step/step-contract.ts` and stub):
    Add `video` variant with `action: videoActionContract`.
  - Update `browserSessionContract` (`packages/siegelense/src/contracts/browser-session/browser-session-contract.ts` and stub):
    Add `videoAction: ({ action }: { action: VideoAction }) => Promise<{ status: string; path: string | null }>`.
- **Adapters:**
  - Update `playwrightSessionAdapter`:
    Configure `recordVideo: { dir: path.join(evidencePath, 'video') }` on `browser.newContext`.
    Implement `videoAction`: returns `{ status: 'started', path: null }` for `start`, and `{ status: 'stopped', path: videoPath }` for `stop`.
- **Transformers:**
  - `packages/siegelense/src/transformers/video-reading-render/video-reading-render-transformer.ts` + `.test.ts`:
    Renders ContentText description of video recording state.
- **Brokers:**
  - `packages/siegelense/src/brokers/step/video/step-video-broker.ts` + `.proxy.ts` + `.test.ts`:
    Takes `{ session: BrowserSession, action: VideoAction }`. Calls `session.videoAction` and renders result.
  - Wire in `runVerbLayerBroker`.
  - Update `docsStatics` and tests for verb count (climbs from 20 to 21).
  - Export new statics, contracts, transformers, brokers in package barrels.

---

## 3. Verification & Driving Plan

1. **Unit Tests & Scoped Ward:**
   - Scoped ward across all touched files.
2. **Manual Driving (The Driver & Fixer):**
   - Boot `dungeonmaster-web` instance.
   - Run batch with `video` start, `goto`, and `video` stop:
     `[{"step":"video","action":"start"},{"step":"goto","path":"/"},{"step":"video","action":"stop"}]`
     Verify status `done`, readings report video recording started and stopped with file path.
   - Boot `dungeonmaster-headless` instance, run `video`, verify refusal with `BrowserStepUnsupportedError`.
   - Teardown & clean sweep.

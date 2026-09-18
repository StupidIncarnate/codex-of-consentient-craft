# Plan — the `key` step verb

**Part 7 item 10 / Part 8 (lines 431, 1014, 1030, 1682, 2089, 2577, 2587, 2780–2794).** Written before any code, against `siegelense-tooling.md` at commit `1a2a584e1`. Every line number below was re-derived from the file in this checkout, not copied from the ledger.

## Why this piece, and why it beat the others

The picking rule in `HANDOFF.md` runs in order, and this is where it lands.

**Rule 1 — does a built thing lie or half-work?** No. All 13 calls and 11 built verbs (`goto`, `waitFor`, `click`, `type`, `screenshot`, `eval`, `look`, `box`, `dom`, `seed`, `until`) pass, behave as documented, and are field-driven.

**Rule 2 — what blocks a session from verifying a browser feature end to end?** Keyboard interactions.
A session can currently navigate (`goto`), wait (`waitFor`, `until`), read the screen (`look`, `box`, `dom`), click (`click`), type into an input (`type`), take screenshots (`screenshot`), eval JS (`eval`), and seed state (`seed`).
However, keyboard-driven actions remain completely unreachable without falling back to arbitrary JavaScript in `eval`:
- Pressing `Enter` to submit a form or confirm a modal without clicking a button
- Pressing `Tab` / `Shift+Tab` to verify focus traversal order and keyboard accessibility
- Pressing `Escape` to dismiss a dropdown, popover, or modal dialog
- Pressing `ArrowDown` / `ArrowUp` to navigate listboxes, comboboxes, and menus
- Triggering keyboard shortcuts such as `ControlOrMeta+Enter` or `ControlOrMeta+V`

**Rule 3 — what unblocks the most other rows?** `key` joins `click` and `type` in the core interactive input quartet (`click`, `type`, `key`, `paste`). It provides the keyboard driving primitive for interactive components and accessibility checks (`focused` flag verification). Furthermore, as an acting step, it exercises the capture and change pipeline (`shot`, `pixelChange`) on keyboard actions.

**Rule 4 — what would a consumer hit first?** Any interactive form submission with Enter, dismissing popups with Escape, tab traversal between fields, or shortcut key combinations.

**Tie-break toward the smaller piece:** `key` is cleanly bounded, sized for a single sitting, and fully testable and drivable against live instances.

## 1. The requirements, one row per thing the spec says

| # | Requirement | Spec line |
|---|---|---|
| R1 | `key` is a step verb taking `{ step: 'key', press: string }` in `stepContract`, included in `verbs.all`, `verbs.acting`, `verbs.capturing`, and `verbs.browser` | 1014, 2577, 2587 |
| R2 | `key` is an acting step: it changes page state, participates in `verbs.acting` and `verbs.capturing` alongside `goto`, `click`, and `type` | 1014, 1682, 2089, 2780–2782 |
| R3 | Every acting step captures unasked: `key` captures a frozen screenshot (`animations: 'disabled'`, `caret: 'hide'`) and computes `pixelChange` against the previous capture, returned on `StepReading` alongside its own reading | 1682, 2089, 2780–2790 |
| R4 | `key` is NOT a targeting verb: `verbs.targeting` excludes it, and `isTargetingStepGuard` returns `false`. It does not take `target`, `within`, or `ref` | 2133–2157, 2587 |
| R5 | `key` requires a browser; running `key` on a browserless spec (e.g. `dungeonmaster-headless`) throws `BrowserStepUnsupportedError` naming `key` and the spec name | 1030; `stepStatics.verbs.browser` |
| R6 | `press` executes via Playwright's `page.keyboard.press(press)` (e.g. `'Enter'`, `'Tab'`, `'Escape'`, `'ArrowDown'`, `'ControlOrMeta+V'`) | 2587; chunk 5 lines 979, 1171 |
| R7 | `key`'s reading carries what is FOCUSED after the press (`document.activeElement`), because a key press with no visible effect is otherwise indistinguishable from a key press the page never received | 431; chunk 5 line 1171 |
| R8 | If `document.activeElement` is `null` or `document.body`, the reading reports nothing focused (`nothing focused`) | 431; chunk 5 line 1171 |
| R9 | If an element is active, the reading describes the focused element by its available attributes: `tag`, `testId` (if present), `text`/`value` (if present), and element-bound `ref` (if present in `window.__siege.refs`) | 431, 1655; chunk 5 line 1171 |
| R10 | `stepContract` validates `{ step: 'key', press: contentTextContract, node: nodeLabelContract.nullable().default(null), expect: stepExpectationContract.default('ok') }` strictly, rejecting unrecognized keys or missing `press` | 2587, 2806 |
| R11 | The reading is rendered via `keyReadingRenderTransformer` producing `ContentText` formatted as `pressed "<press>" — focused: <element>` (or `pressed "<press>" — nothing focused`) | 2587; chunk 5 lines 1171, 1176 |
| R12 | `docs` statics updates to announce `key` among built verbs (total count climbs from 11 to 12), marks `key` `Built.` in `walking` scope, adds `key` to the browser verbs list in `operational` scope, and verifies `operating` scope stays free of `key` | 158, 464, 491 |

## 2. Architecture and Data Flow

1. **Statics**:
   - `packages/siegelense/src/statics/step/step-statics.ts`:
     - Add `'key'` to `verbs.all`.
     - Add `'key'` to `verbs.acting` (keyboard presses change page state/focus).
     - Add `'key'` to `verbs.capturing` (acting steps capture screenshot + compute `pixelChange`).
     - Add `'key'` to `verbs.browser` (keyboard interactions require a live browser page).
     - Excluded from `verbs.targeting` (press is a page-level keyboard action, not an element selector).

2. **Contracts & Stubs**:
   - `packages/siegelense/src/contracts/focused-element/focused-element-contract.ts` + `.test.ts` + `.stub.ts`:
     ```ts
     export const focusedElementContract = z.object({
       tag: contentTextContract,
       testId: contentTextContract.nullable(),
       role: contentTextContract.nullable(),
       domId: contentTextContract.nullable(),
       text: contentTextContract.nullable(),
       ref: refContract.nullable(),
     }).strict();
     ```
   - `packages/siegelense/src/contracts/key-reading/key-reading-contract.ts` + `.test.ts` + `.stub.ts`:
     ```ts
     export const keyReadingContract = z.object({
       press: contentTextContract,
       focused: focusedElementContract.nullable(),
     }).strict();
     ```
   - `packages/siegelense/src/contracts/step/step-contract.ts`:
     Add `'key'` member to the discriminated union:
     ```ts
     z.object({
       step: z.literal('key'),
       press: contentTextContract,
       node: nodeLabelContract.nullable().default(null),
       expect: stepExpectationContract.default(stepStatics.defaults.expect),
     }).strict()
     ```
   - `packages/siegelense/src/contracts/browser-session/browser-session-contract.ts`:
     Add to `BrowserSession` interface:
     ```ts
     pressKey: ({ press }: { press: string }) => Promise<KeyReading>;
     ```

3. **Guards**:
   - `packages/siegelense/src/guards/is-targeting-step/is-targeting-step-guard.ts`:
     Ensures `key` returns `false` (no `target` in `step`).

4. **Adapters**:
   - `packages/siegelense/src/adapters/playwright/session/key-press-layer-adapter.ts` + `.test.ts` + `.proxy.ts`:
     - `focusReadSource`: generates the self-invoking page-side JavaScript function that inspects `document.activeElement`.
       - If activeElement is null or body, returns `null`.
       - Reads `window.__siege?.refs` to find if `activeElement` matches any minted ref.
       - Extracts `tagName`, `data-testid`, `role`, `id`, and value/text (trimmed/capped to 100 chars).
     - `toReading({ press, rawFocused })`: parses and validates into `KeyReading` via `keyReadingContract`.
   - `packages/siegelense/src/adapters/playwright/session/playwright-session-adapter.ts`:
     - Implement `pressKey`:
       ```ts
       pressKey: async ({ press }: { press: string }): Promise<KeyReading> => {
         await page.keyboard.press(press);
         const raw: unknown = await page.evaluate(keyPress.focusReadSource());
         return keyPress.toReading({ press, rawFocused: raw });
       }
       ```
   - `packages/siegelense/src/adapters/playwright/session/playwright-session-adapter.proxy.ts`:
     - Add `state.keyboardPressCalls: string[]` and `state.focusedRaw: unknown`.
     - Expose `getKeyboardPressCalls()` and `setFocusedResult({ raw })`.
     - Call `keyPressLayerAdapterProxy()`.

5. **Transformer & Broker**:
   - `packages/siegelense/src/transformers/key-reading-render/key-reading-render-transformer.ts` + `.test.ts`:
     - Formats `KeyReading` into readable `ContentText`:
       - If `focused === null`: `pressed "${reading.press}" — nothing focused`
       - If `focused !== null`: `pressed "${reading.press}" — focused: ${formatted}`
       - Formatted: e.g. `input[data-testid="NAME_INPUT"] "alice" (ref 14)`
   - `packages/siegelense/src/brokers/step/key/step-key-broker.ts` + `.proxy.ts` + `.test.ts`:
     - Takes `{ session, press }`.
     - Calls `const reading = await session.pressKey({ press })`.
     - Returns `keyReadingRenderTransformer({ reading })`.
   - `packages/siegelense/src/brokers/step/dispatch/run-verb-layer-broker.ts`:
     - Routes `step.step === 'key'` to:
       ```ts
       if (step.step === 'key') {
         return stepKeyBroker({ session, press: step.press });
       }
       ```

6. **Docs Statics**:
   - `packages/siegelense/src/statics/docs/docs-statics.ts` + `.test.ts`:
     - Total verbs count climbs from 11 to 12.
     - `walking` scope marks `{ step: 'key', press: '...' }` `Built.`
     - `driving` scope includes `key`.
     - `operational` scope includes `key` in browser verbs list.
     - `operating` scope verified to contain no step verbs.

## 3. Test Plan

- **Contract Tests**:
  - `focusedElementContract.test.ts`: validates valid and invalid active element shapes.
  - `keyReadingContract.test.ts`: validates `{ press, focused }`.
  - `stepContract.test.ts`: validates parsing `{ step: 'key', press: 'Enter' }`, `{ step: 'key', press: 'Tab' }`, rejects missing `press`, rejects unknown keys.
- **Adapter Tests**:
  - `keyPressLayerAdapter.test.ts`: tests generated `focusReadSource` and `toReading` with null and element inputs.
  - `playwrightSessionAdapter.test.ts`: verifies `pressKey` invokes `page.keyboard.press` and reads active element.
- **Transformer Tests**:
  - `keyReadingRenderTransformer.test.ts`: verifies formatted string for both null focused element and element with testId, text, and ref.
- **Broker Tests**:
  - `stepKeyBroker.test.ts`: tests execution with mock `BrowserSession` and verified transformer formatting.
  - `runVerbLayerBroker.test.ts`: verifies `key` step routes to `stepKeyBroker`.
  - `stepDispatchBroker.test.ts`: verifies `key` triggers capture and returns `shot` and `pixelChange`.
- **Docs Tests**:
  - `docsStatics.test.ts`: verifies counts (12 verbs) and ensures `operating` scope stays clean of step verbs.

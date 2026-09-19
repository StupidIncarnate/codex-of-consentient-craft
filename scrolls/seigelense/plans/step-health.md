# Plan — the `health` step verb

**Part 7 item 8 (spec lines 768, 1003–1012, 1696, 2091, 2611, 2634–2645, 2983, 2985, 2995).** Written before any code, against `siegelense-tooling.md` at commit `71a2a4cd3`. Every line number below was re-derived from the file in this checkout, not copied from the ledger.

## Why this piece, and why it beat the others

The picking rule in `HANDOFF.md` runs in order:

**Rule 1 — does a built thing lie or half-work?** No. All 13 calls and 12 built verbs (`goto`, `waitFor`, `click`, `type`, `screenshot`, `eval`, `look`, `box`, `dom`, `seed`, `until`, `key`) pass, behave as documented, and are field-driven.

**Rule 2 — what blocks a session from verifying a browser feature end to end?**
The verifier minion verifies the happy path; the stress tester minion verifies survival across attacks:
`| stress tester | I attacked this and it did NOT fall over | each attack |`
An absence of a failure with no baseline proves nothing. `health` is the stress tester's counterpart to the key (`look`): reading root element, blankness, console errors, 5xx responses, and server logs into one fixed shape so two readings can be held against each other before and after an attack.

**Rule 3 — what unblocks the most other rows?**
`health` is Part 7 item 8, explicitly named in `HANDOFF.md` shortlist. It provides the single verdict and baseline primitive that repeated-trial cycles depend on (`run { steps: [ { step: 'health' }, attack, { step: 'health' } ] }`).

**Rule 4 — what would a consumer hit first?**
A consumer running tests or attacks against a live instance currently has no single-step health probe to assert that the app is healthy without writing multiple manual checks and reading raw log files.

**Tie-break toward the smaller piece:**
`health` is cleanly bounded, sized for a single sitting, composes existing readings (root presence, shot blankness, console buffer, network buffer, server log length/lines), and is fully testable and drivable against live instances.

## 1. The requirements, one row per thing the spec says

| # | Requirement | Spec line |
|---|---|---|
| R1 | `health` is a step verb taking `{ step: 'health' }` in `stepContract`, included in `verbs.all`, `verbs.capturing`, and `verbs.browser` | 1004, 2091, 2611, 2637 |
| R2 | `health` is NOT an acting step: it does not change page state, so it is excluded from `verbs.acting`. Like `look`, it is an asked-for reading | 768–770, 1696 |
| R3 | `health` captures a shot unasked: it is in `verbs.capturing`, produces a screenshot, and stamps `shot`, `blank`, `blankColour`, and `pixelChange` onto `StepReading` | 1004, 2611, 2643 |
| R4 | `health` is NOT a targeting verb: `verbs.targeting` excludes it, and `isTargetingStepGuard` returns `false`. It does not take `target`, `within`, or `ref` | 2637, 2983 |
| R5 | `health` requires a browser: running `health` on a browserless spec (e.g. `dungeonmaster-headless`) throws `BrowserStepUnsupportedError` naming `health` and the spec name | 1004; `stepStatics.verbs.browser` |
| R6 | `health` inspects root element presence in DOM (`#root` present in document) — reports `root present` or `root absent` | 1003, 2638–2640 |
| R7 | `health` inspects page blankness from the capture: reports `not blank` or `page blank` with hex colour (e.g. `page blank (#0d0907)`) | 768, 1003, 1696, 2638–2640 |
| R8 | `health` inspects console buffer for errors in the run's window: reports `console clean` or `console: N error(s) "<first-message>"` | 1003, 2638–2640 |
| R9 | `health` inspects network buffer for 5xx status in the run's window: reports `no 5xx` or `network: N 5xx "<first-5xx>"` | 1003, 2638–2640 |
| R10 | `health` inspects server log for errors: reports `server log clean` or `server log: N error(s)` | 1003, 1008–1012, 2638–2640 |
| R11 | `health` computes a verdict: `DOWN` if root is absent or page is blank; `DEGRADED` if root is present and page is not blank, but console errors, 5xx, or server errors exist; `HEALTHY` if root is present, page is not blank, console is clean, no 5xx, and server log is clean | 2638–2640 |
| R12 | The reading renders via `healthReadingRenderTransformer` producing a single verdict line: `<VERDICT>   <root> · <blank> · <console> · <network> · <server>` | 1003, 2638–2640 |
| R13 | `stepContract` validates `{ step: 'health', node: nodeLabelContract.nullable().default(null), expect: stepExpectationContract.default('ok') }` strictly | 2637, 2806 |
| R14 | `docs` statics updates to announce `health` among built verbs (total count climbs from 12 to 13), marks `health` `Built.` in `attacking` scope, adds `health` to the browser verbs list in `operational` scope, and updates the score table | 291–294, 464, 491 |

## 2. Architecture and Data Flow

1. **Statics**:
   - `packages/siegelense/src/statics/step/step-statics.ts`:
     - Add `'health'` to `verbs.all`.
     - Add `'health'` to `verbs.capturing` (takes a shot to measure blankness and visual state).
     - Add `'health'` to `verbs.browser` (inspects root element and blank page screenshot).
     - Excluded from `verbs.acting` (reading step, does not mutate page).
     - Excluded from `verbs.targeting` (page-level health probe).
   - `packages/siegelense/src/statics/health/health-statics.ts`:
     - Root selector: `'#root'`.
     - Verdict strings: `'HEALTHY'`, `'DEGRADED'`, `'DOWN'`.
     - Spacing/formatting constants.

2. **Contracts & Stubs**:
   - `packages/siegelense/src/contracts/health-verdict/health-verdict-contract.ts` + `.test.ts` + `.stub.ts`:
     `z.enum(['HEALTHY', 'DEGRADED', 'DOWN'])`
   - `packages/siegelense/src/contracts/health-reading/health-reading-contract.ts` + `.test.ts` + `.stub.ts`:
     ```ts
     export const healthReadingContract = z.object({
       verdict: healthVerdictContract,
       rootPresent: z.boolean(),
       blank: z.boolean(),
       blankColour: hexColourContract.nullable(),
       consoleErrors: readingCountContract,
       firstConsoleError: contentTextContract.nullable(),
       network5xxCount: readingCountContract,
       first5xx: contentTextContract.nullable(),
       serverErrors: readingCountContract,
       firstServerError: contentTextContract.nullable(),
       rendered: contentTextContract,
     }).strict();
     ```
   - `packages/siegelense/src/contracts/step/step-contract.ts`:
     Add `'health'` member to the discriminated union:
     ```ts
     z.object({
       step: z.literal('health'),
       node: nodeLabelContract.nullable().default(null),
       expect: stepExpectationContract.default(stepStatics.defaults.expect),
     }).strict()
     ```
   - `packages/siegelense/src/contracts/browser-session/browser-session-contract.ts`:
     Add to `BrowserSession` interface:
     ```ts
     checkRootPresent: () => Promise<boolean>;
     ```

3. **Guards**:
   - `packages/siegelense/src/guards/is-targeting-step/is-targeting-step-guard.ts`:
     Ensures `health` returns `false` (no `target` in `step`).

4. **Adapters**:
   - `packages/siegelense/src/adapters/playwright/session/root-check-layer-adapter.ts` + `.test.ts` + `.proxy.ts`:
     - Evaluates `Boolean(document.querySelector('#root'))` in page context.
   - `packages/siegelense/src/adapters/playwright/session/playwright-session-adapter.ts`:
     - Implements `checkRootPresent: async () => rootCheckLayerAdapter({ page })`.
   - `packages/siegelense/src/adapters/playwright/session/playwright-session-adapter.proxy.ts`:
     - Adds `checkRootPresent` mock (defaults to `true`).

5. **Transformer & Broker**:
   - `packages/siegelense/src/transformers/health-reading-render/health-reading-render-transformer.ts` + `.test.ts`:
     - Computes `verdict` based on components:
       - If `!rootPresent || blank` => `DOWN`
       - Else if `consoleErrors > 0 || network5xxCount > 0 || serverErrors > 0` => `DEGRADED`
       - Else => `HEALTHY`
     - Formats single verdict line:
       `<VERDICT>   <root> · <blank> · <console> · <network> · <server>`
   - `packages/siegelense/src/brokers/step/health/step-health-broker.ts` + `.proxy.ts` + `.test.ts`:
     - Takes `{ lane, session, shotPath, browserWindowStart }`.
     - Performs capture to `shotPath` if not already captured.
     - Reads `shotBlankReadBroker({ shotPath })`.
     - Checks `session.checkRootPresent()`.
     - Reads console lines since `browserWindowStart?.consoleLines ?? 0`, filters by `resultsStatics.patterns.consoleError`.
     - Reads network lines since `browserWindowStart?.networkLines ?? 0`, filters by status in [500, 600).
     - Reads server log lines via `lane.readServerLogSince({ fromByte: 0 })`, filters by `resultsStatics.patterns.serverError`.
     - Calls `healthReadingRenderTransformer` to generate `HealthReading` and its `rendered` text.
     - Returns `reading.rendered`.
   - `packages/siegelense/src/brokers/step/dispatch/run-verb-layer-broker.ts`:
     - Routes `step.step === 'health'` to `stepHealthBroker`.
   - `packages/siegelense/src/brokers/step/dispatch/step-dispatch-broker.ts`:
     - Skips duplicate capture when `step.step === 'health'`.

6. **Documentation Updates**:
   - `packages/siegelense/src/statics/docs/docs-statics.ts`:
     - Announce `health` built, update scope descriptions.
   - `scrolls/seigelense/siegelense-tooling.md`:
     - Update status markers for line 2577 / 2611 / Part 7 item 8.
   - `scrolls/seigelense/build-ledger.md`:
     - Update Part 2 line 961, Part 7 item 8 to DELIVERED.
   - `scrolls/seigelense/HANDOFF.md`:
     - Update score table: step verbs climbs from 12 to 13.

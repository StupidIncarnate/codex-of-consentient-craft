/**
 * PURPOSE: Drives the `waitFor` step — polls until `target` reaches `state` or `timeoutMs` passes.
 * The target is deliberately NOT pre-resolved through `stepTargetResolveBroker`: zero matches is the
 * normal starting point of a wait for an element that has not rendered yet, so Playwright's own
 * locator wait does the polling. An AMBIGUOUS target meets Playwright's strict locator instead, and
 * this raises `StepAmbiguousError` with the candidates, the same error the resolve door gives
 * `click`/`type`. Every other rejection of `session.waitForMatch` is wrapped in
 * `WaitForCeilingHitError` and re-thrown — a hung wait is a FINDING that must stop a default batch
 * (siegelense-tooling.md line 101: "A timeout must name the step... a hang is a finding, not a tool
 * failure"), never a passing-looking reading, so this broker matches the other driving steps: it lets
 * a failure propagate rather than catching it into a return value. `stepDispatchBroker`'s existing
 * `expect: 'error'` inversion is what decides whether that finding halts the batch or is the attack
 * an adversarial step declared it wanted. A ceiling hit also carries what the page held at that
 * moment, through `stepMissEvidenceBroker`: the page's key always, and the testIds ranked by
 * likeness to the target when the target matched nothing — the misremembered-testId case, which
 * otherwise reads as a bare timeout. Each of those reads degrades on its own failure and is logged,
 * never thrown: evidence must not replace the ceiling hit it explains. `within` and `timeoutMs` stay nullable, matching
 * `stepContract`'s own `waitFor` member, for the same reason `step-click-broker.ts` gives.
 *
 * **A resolved locator state is not page-wide quiescence, so this settles too.** All four
 * `LocatorState` values (`visible`, `hidden`, `attached`, `detached`) are single-element DOM/CSS
 * checks — `visible` fires the instant the element's box is non-empty, which can be well before a
 * fade-in finishes or before content the element triggered a fetch for has arrived. `waitForSettle`
 * runs only once `waitForMatch` has resolved — a ceiling hit already throws before reaching it — and
 * never throws on `settled: false`; this broker reads that flag exactly as `step-click-broker.ts`
 * does, using `driverStatics.settle`'s quiet window, ceiling and poll cadence.
 *
 * USAGE:
 * await stepWaitForBroker({ session, target: '[data-testid="MODAL"]', within: null, state: 'visible', timeoutMs: null });
 * // Returns a reading naming the state that resolved, or throws WaitForCeilingHitError naming the
 * // state, the target and the ceiling it hit, or StepAmbiguousError when the target matches twice
 *
 * await stepWaitForBroker({ session, target: '[data-testid="SLOW_MODAL"]', within: null, state: 'visible', timeoutMs: null });
 * // If the page never settles after the state resolves: '[data-testid="SLOW_MODAL"] reached state
 * // "visible"; did not settle after 5000ms (still moving: network)'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { StepAmbiguousError } from '../../../errors/step-ambiguous/step-ambiguous-error';
import { WaitForCeilingHitError } from '../../../errors/wait-for-ceiling-hit/wait-for-ceiling-hit-error';
import { isPlaywrightStrictModeViolationErrorGuard } from '../../../guards/is-playwright-strict-mode-violation-error/is-playwright-strict-mode-violation-error-guard';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { settleReadingRenderTransformer } from '../../../transformers/settle-reading-render/settle-reading-render-transformer';
import { stepMissEvidenceBroker } from '../miss-evidence/step-miss-evidence-broker';

export const stepWaitForBroker = async ({
  session,
  target,
  within,
  state,
  timeoutMs,
}: {
  session: BrowserSession;
  target: string;
  within: string | null;
  state: string;
  timeoutMs: number | null;
}): Promise<ContentText> => {
  const resolvedTimeoutMs = timeoutMs ?? driverStatics.run.defaultStepTimeoutMs;
  const matchParams =
    within === null
      ? { target, state, timeoutMs: resolvedTimeoutMs }
      : { target, within, state, timeoutMs: resolvedTimeoutMs };

  try {
    await session.waitForMatch(matchParams);
  } catch (error: unknown) {
    // Ambiguity is not a ceiling: folding a strict-mode violation into one would answer `timeout`
    // and advise waiting longer for something already on the page twice.
    if (isPlaywrightStrictModeViolationErrorGuard({ error })) {
      const describeParams = within === null ? { target } : { target, within };
      const candidates = await session.describeMatches(describeParams);
      throw new StepAmbiguousError({ target, within, candidates });
    }
    const countParams = within === null ? { target } : { target, within };
    const [matchCount, evidence] = await Promise.all([
      session.countMatches(countParams).catch((countError: unknown) => {
        process.stderr.write(
          `[step-wait-for] match count after the ceiling failed for ${target}: ${String(countError)}\n`,
        );
        return null;
      }),
      stepMissEvidenceBroker({ session, target }).catch((evidenceError: unknown) => {
        process.stderr.write(
          `[step-wait-for] near-miss read after the ceiling failed for ${target}: ${String(evidenceError)}\n`,
        );
        return null;
      }),
    ]);
    throw new WaitForCeilingHitError({
      target,
      within,
      state,
      timeoutMs: resolvedTimeoutMs,
      cause: error,
      nearest: matchCount === 0 && evidence !== null ? evidence.nearest : null,
      more: matchCount === 0 && evidence !== null ? evidence.more : 0,
      key: evidence === null ? null : evidence.key,
    });
  }

  const settleReading = await session.waitForSettle({
    quietWindowMs: driverStatics.settle.quietWindowMs,
    ceilingMs: driverStatics.settle.ceilingMs,
    pollMs: driverStatics.settle.pollMs,
  });

  return settleReadingRenderTransformer({
    baseMessage: contentTextContract.parse(`${target} reached state "${state}"`),
    settleReading,
  });
};

/**
 * PURPOSE: Drives the `click` step against an element already known to be reachable —
 * `stepDispatchBroker` runs `stepTargetResolveBroker` first and lets an ambiguous target, a
 * zero-match target, a stale ref or an unknown ref throw before this ever runs, so this broker never
 * re-checks anything itself. `within`, `ref` and `timeoutMs` are nullable rather than optional
 * (matching `stepContract`'s own `click` member) so the dispatcher can pass the step's fields
 * straight through with no `exactOptionalPropertyTypes` omission dance; the one place that dance is
 * needed is the single call to `session.clickMatch` below.
 *
 * **A `ref` takes the other arm, and the reading says which handle drove it.** A ref names one
 * element with no ambiguity to resolve, so it needs no `within`; the reading naming `ref 23` rather
 * than a selector is what keeps the transcript honest about what was actually aimed at — a
 * transcript claiming a selector for a click driven by ref would read as durable when it was not.
 *
 * **The click's own timeout bounds the action; `waitForSettle` bounds what happens after it.**
 * They answer different questions — whether the element accepted the click at all, and whether the
 * page finished reacting to it — so a click that lands but leaves the page mid-update still gets
 * reported. `waitForSettle` never throws on `settled: false`; this broker reads that flag and, only
 * when it is false, appends the reason and the still-moving signals to the reading it returns,
 * using `driverStatics.settle`'s quiet window, ceiling and poll cadence rather than inventing its
 * own.
 *
 * USAGE:
 * await stepClickBroker({ session, target: '[data-testid="GUILD_ADD"]', within: null, ref: null, timeoutMs: null });
 * // Clicks the match and returns a reading naming the target that was clicked
 *
 * await stepClickBroker({ session, target: null, within: null, ref: 23, timeoutMs: null });
 * // Clicks the element ref 23 binds to, and says so
 *
 * await stepClickBroker({ session, target: '[data-testid="SLOW_BTN"]', within: null, ref: null, timeoutMs: null });
 * // If the page never settles: 'clicked [data-testid="SLOW_BTN"]; did not settle after 5000ms
 * // (still moving: network)'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { settleReadingRenderTransformer } from '../../../transformers/settle-reading-render/settle-reading-render-transformer';

export const stepClickBroker = async ({
  session,
  target,
  within,
  ref,
  timeoutMs,
}: {
  session: BrowserSession;
  target: string | null;
  within: string | null;
  ref: number | null;
  timeoutMs: number | null;
}): Promise<ContentText> => {
  const resolvedTimeoutMs = timeoutMs ?? driverStatics.run.defaultStepTimeoutMs;

  if (ref !== null) {
    await session.clickRef({ ref, timeoutMs: resolvedTimeoutMs });
    const settleReading = await session.waitForSettle({
      quietWindowMs: driverStatics.settle.quietWindowMs,
      ceilingMs: driverStatics.settle.ceilingMs,
      pollMs: driverStatics.settle.pollMs,
    });
    return settleReadingRenderTransformer({
      baseMessage: contentTextContract.parse(`clicked ref ${String(ref)}`),
      settleReading,
    });
  }

  if (target === null) {
    throw new Error(
      'step-click-broker: a click reached the driver with neither a `target` nor a `ref`. `stepContract` refuses that combination, so this means a step was built without going through it.',
    );
  }

  const matchParams =
    within === null
      ? { target, timeoutMs: resolvedTimeoutMs }
      : { target, within, timeoutMs: resolvedTimeoutMs };

  await session.clickMatch(matchParams);
  const settleReading = await session.waitForSettle({
    quietWindowMs: driverStatics.settle.quietWindowMs,
    ceilingMs: driverStatics.settle.ceilingMs,
    pollMs: driverStatics.settle.pollMs,
  });

  return settleReadingRenderTransformer({
    baseMessage: contentTextContract.parse(
      within === null ? `clicked ${target}` : `clicked ${target} within ${within}`,
    ),
    settleReading,
  });
};

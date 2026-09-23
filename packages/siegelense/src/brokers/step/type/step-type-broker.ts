/**
 * PURPOSE: Drives the `type` step against an element already known to be reachable —
 * `stepDispatchBroker` runs `stepTargetResolveBroker` first, so this broker never re-checks the
 * count or the ref's state itself. `within`, `ref` and `timeoutMs` are nullable rather than optional
 * (matching `stepContract`'s own `type` member) so the dispatcher can pass the step's fields
 * straight through with no `exactOptionalPropertyTypes` omission dance; the one place that dance is
 * needed is the single call to `session.fillMatch` below.
 *
 * **A `ref` takes the other arm, and the reading says which handle drove it.** A ref names one
 * element with no ambiguity to resolve, so it needs no `within`; the reading naming `ref 14` rather
 * than a selector is what keeps the transcript honest about what was actually aimed at.
 *
 * **The fill's own timeout bounds the action; `waitForSettle` bounds what happens after it.** They
 * answer different questions — whether the element accepted the value at all, and whether the page
 * finished reacting to it — so a fill that lands but leaves the page mid-update still gets reported.
 * `waitForSettle` never throws on `settled: false`; this broker reads that flag and, only when it is
 * false, appends the reason and the still-moving signals to the reading it returns, using
 * `driverStatics.settle`'s quiet window, ceiling and poll cadence rather than inventing its own.
 *
 * USAGE:
 * await stepTypeBroker({ session, target: '[data-testid="NAME_INPUT"]', within: null, ref: null, value: 'x', timeoutMs: null });
 * // Fills the match and returns a reading naming the value and the target it was typed into
 *
 * await stepTypeBroker({ session, target: null, within: null, ref: 14, value: 'guild-alpha', timeoutMs: null });
 * // Fills the element ref 14 binds to, and says so
 *
 * await stepTypeBroker({ session, target: '[data-testid="SLOW_INPUT"]', within: null, ref: null, value: 'x', timeoutMs: null });
 * // If the page never settles: 'typed "x" into [data-testid="SLOW_INPUT"]; did not settle after
 * // 5000ms (still moving: network)'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { settleReadingRenderTransformer } from '../../../transformers/settle-reading-render/settle-reading-render-transformer';

export const stepTypeBroker = async ({
  session,
  target,
  within,
  ref,
  value,
  timeoutMs,
}: {
  session: BrowserSession;
  target: string | null;
  within: string | null;
  ref: number | null;
  value: string;
  timeoutMs: number | null;
}): Promise<ContentText> => {
  const resolvedTimeoutMs = timeoutMs ?? driverStatics.run.defaultStepTimeoutMs;

  if (ref !== null) {
    await session.fillRef({ ref, value, timeoutMs: resolvedTimeoutMs });
    const settleReading = await session.waitForSettle({
      quietWindowMs: driverStatics.settle.quietWindowMs,
      ceilingMs: driverStatics.settle.ceilingMs,
      pollMs: driverStatics.settle.pollMs,
    });
    return settleReadingRenderTransformer({
      baseMessage: contentTextContract.parse(`typed "${value}" into ref ${String(ref)}`),
      settleReading,
    });
  }

  if (target === null) {
    throw new Error(
      'step-type-broker: a type reached the driver with neither a `target` nor a `ref`. `stepContract` refuses that combination, so this means a step was built without going through it.',
    );
  }

  const matchParams =
    within === null
      ? { target, value, timeoutMs: resolvedTimeoutMs }
      : { target, within, value, timeoutMs: resolvedTimeoutMs };

  await session.fillMatch(matchParams);
  const settleReading = await session.waitForSettle({
    quietWindowMs: driverStatics.settle.quietWindowMs,
    ceilingMs: driverStatics.settle.ceilingMs,
    pollMs: driverStatics.settle.pollMs,
  });

  return settleReadingRenderTransformer({
    baseMessage: contentTextContract.parse(
      within === null
        ? `typed "${value}" into ${target}`
        : `typed "${value}" into ${target} within ${within}`,
    ),
    settleReading,
  });
};

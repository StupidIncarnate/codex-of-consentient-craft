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
 * USAGE:
 * await stepClickBroker({ session, target: '[data-testid="GUILD_ADD"]', within: null, ref: null, timeoutMs: null });
 * // Clicks the match and returns a reading naming the target that was clicked
 *
 * await stepClickBroker({ session, target: null, within: null, ref: 23, timeoutMs: null });
 * // Clicks the element ref 23 binds to, and says so
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { driverStatics } from '../../../statics/driver/driver-statics';

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
    return contentTextContract.parse(`clicked ref ${String(ref)}`);
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

  return contentTextContract.parse(
    within === null ? `clicked ${target}` : `clicked ${target} within ${within}`,
  );
};

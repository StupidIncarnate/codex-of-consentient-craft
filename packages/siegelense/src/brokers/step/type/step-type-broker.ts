/**
 * PURPOSE: Drives the `type` step against a target already known to resolve to exactly one element —
 * `stepDispatchBroker` runs `stepTargetResolveBroker` first, so this broker never re-checks the count
 * itself. `within` and `timeoutMs` are nullable rather than optional (matching `stepContract`'s own
 * `type` member) so the dispatcher can pass the step's fields straight through with no
 * `exactOptionalPropertyTypes` omission dance; the one place that dance is needed is the single call
 * to `session.fillMatch` below.
 *
 * USAGE:
 * await stepTypeBroker({ session, target: '[data-testid="NAME_INPUT"]', within: null, value: 'x', timeoutMs: null });
 * // Fills the match and returns a reading naming the value and the target it was typed into
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { driverStatics } from '../../../statics/driver/driver-statics';

export const stepTypeBroker = async ({
  session,
  target,
  within,
  value,
  timeoutMs,
}: {
  session: BrowserSession;
  target: string;
  within: string | null;
  value: string;
  timeoutMs: number | null;
}): Promise<ContentText> => {
  const resolvedTimeoutMs = timeoutMs ?? driverStatics.run.defaultStepTimeoutMs;
  const matchParams =
    within === null
      ? { target, value, timeoutMs: resolvedTimeoutMs }
      : { target, within, value, timeoutMs: resolvedTimeoutMs };

  await session.fillMatch(matchParams);

  return contentTextContract.parse(
    within === null
      ? `typed "${value}" into ${target}`
      : `typed "${value}" into ${target} within ${within}`,
  );
};

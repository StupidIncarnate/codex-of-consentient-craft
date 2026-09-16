/**
 * PURPOSE: Drives the `click` step against a target already known to resolve to exactly one element —
 * `stepDispatchBroker` runs `stepTargetResolveBroker` first and lets an ambiguous or zero-match target
 * throw before this ever runs, so this broker never re-checks the count itself. `within` and
 * `timeoutMs` are nullable rather than optional (matching `stepContract`'s own `click` member) so the
 * dispatcher can pass the step's fields straight through with no `exactOptionalPropertyTypes`
 * omission dance; the one place that dance is needed is the single call to `session.clickMatch` below.
 *
 * USAGE:
 * await stepClickBroker({ session, target: '[data-testid="GUILD_ADD"]', within: null, timeoutMs: null });
 * // Clicks the match and returns a reading naming the target that was clicked
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { driverStatics } from '../../../statics/driver/driver-statics';

export const stepClickBroker = async ({
  session,
  target,
  within,
  timeoutMs,
}: {
  session: BrowserSession;
  target: string;
  within: string | null;
  timeoutMs: number | null;
}): Promise<ContentText> => {
  const resolvedTimeoutMs = timeoutMs ?? driverStatics.run.defaultStepTimeoutMs;
  const matchParams =
    within === null
      ? { target, timeoutMs: resolvedTimeoutMs }
      : { target, within, timeoutMs: resolvedTimeoutMs };

  await session.clickMatch(matchParams);

  return contentTextContract.parse(
    within === null ? `clicked ${target}` : `clicked ${target} within ${within}`,
  );
};

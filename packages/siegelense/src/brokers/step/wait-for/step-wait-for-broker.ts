/**
 * PURPOSE: Drives the `waitFor` step against a target already known to resolve to exactly one
 * element — `stepDispatchBroker` runs `stepTargetResolveBroker` first, so this broker never re-checks
 * the count itself. When `session.waitForMatch` rejects, this wraps the rejection in
 * `WaitForCeilingHitError` and re-throws — a hung wait is a FINDING that must stop a default batch
 * (siegelense-tooling.md line 101: "A timeout must name the step... a hang is a finding, not a tool
 * failure"), never a passing-looking reading, so this broker now matches the other five: it lets a
 * failure propagate rather than catching it into a return value. `stepDispatchBroker`'s existing
 * `expect: 'error'` inversion is what decides whether that finding halts the batch or is the attack
 * an adversarial step declared it wanted. `within` and `timeoutMs` stay nullable, matching
 * `stepContract`'s own `waitFor` member, for the same reason `step-click-broker.ts` gives.
 *
 * USAGE:
 * await stepWaitForBroker({ session, target: '[data-testid="MODAL"]', within: null, state: 'visible', timeoutMs: null });
 * // Returns a reading naming the state that resolved, or throws WaitForCeilingHitError naming the
 * // state, the target and the ceiling it hit
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { WaitForCeilingHitError } from '../../../errors/wait-for-ceiling-hit/wait-for-ceiling-hit-error';
import { driverStatics } from '../../../statics/driver/driver-statics';

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
    throw new WaitForCeilingHitError({
      target,
      within,
      state,
      timeoutMs: resolvedTimeoutMs,
      cause: error,
    });
  }

  return contentTextContract.parse(`${target} reached state "${state}"`);
};

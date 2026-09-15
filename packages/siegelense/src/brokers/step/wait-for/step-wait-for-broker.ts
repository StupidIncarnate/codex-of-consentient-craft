/**
 * PURPOSE: Drives the `waitFor` step against a target already known to resolve to exactly one
 * element — `stepDispatchBroker` runs `stepTargetResolveBroker` first, so this broker never re-checks
 * the count itself. Its own failure mode is different from the other two targeting verbs: chunk 2
 * delivers the CEILING half of "an acting step ends on SETTLE, with a ceiling, not a timeout"
 * (siegelense-tooling.md line 1641) — a `waitForMatch` that hits its timeout is not an unexpected
 * error here, it is the reading, so this is the one broker in the six that catches rather than lets
 * the failure propagate. `within` and `timeoutMs` stay nullable, matching `stepContract`'s own
 * `waitFor` member, for the same reason `step-click-broker.ts` gives.
 *
 * USAGE:
 * await stepWaitForBroker({ session, target: '[data-testid="MODAL"]', within: null, state: 'visible', timeoutMs: null });
 * // Returns a reading naming the state that resolved, or the ceiling it hit waiting for one
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
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
    return contentTextContract.parse(`${target} reached state "${state}"`);
  } catch (error: unknown) {
    return contentTextContract.parse(
      `${target} did not reach state "${state}" within the ${String(resolvedTimeoutMs)}ms ceiling: ${String(error)}`,
    );
  }
};

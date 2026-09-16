/**
 * PURPOSE: Polls one URL until it answers or `deadlineMs` passes — recursion with an early return,
 * never `while (true)`. `siege-lane.ts`'s `waitForHttp` (lines 167–183) is the exact shape this
 * mirrors: probe, return true on success, return false once `Date.now()` reaches the shared
 * deadline, else sleep `driverStatics.boot.readyPollMs` and recurse. `lane-boot-broker` computes ONE
 * deadline per boot and passes the SAME value to every process's wait, so a slow process does not
 * buy the others extra time.
 *
 * USAGE:
 * await laneReadyWaitBroker({
 *   url: 'http://dungeonmaster.localhost:34172/api/guilds',
 *   deadlineMs: Date.now() + 180_000,
 * });
 * // Resolves true once reachable, or false once deadlineMs passes with no answer
 */

import { fetchProbeAdapter } from '../../../adapters/fetch/probe/fetch-probe-adapter';
import { driverStatics } from '../../../statics/driver/driver-statics';

export const laneReadyWaitBroker = async ({
  url,
  deadlineMs,
}: {
  url: string;
  deadlineMs: number;
}): Promise<boolean> => {
  const reachable = await fetchProbeAdapter({
    url,
    timeoutMs: driverStatics.boot.readyProbeTimeoutMs,
  });

  if (reachable) {
    return true;
  }

  if (Date.now() >= deadlineMs) {
    return false;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, driverStatics.boot.readyPollMs);
  });

  return laneReadyWaitBroker({ url, deadlineMs });
};

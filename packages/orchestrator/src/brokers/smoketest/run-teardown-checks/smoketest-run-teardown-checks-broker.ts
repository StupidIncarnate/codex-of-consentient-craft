/**
 * PURPOSE: Evaluates a list of SmoketestTeardownChecks against real OS state and returns pass/fail
 *
 * USAGE:
 * const outcome = await smoketestRunTeardownChecksBroker({ checks });
 * // Returns: { passed: true } when every teardown check matches; otherwise { passed: false, failures: [...] }
 *
 * WHEN-TO-USE: After a siegemaster smoketest case completes, to confirm the dev server released its port and
 * its child process fully exited. Probes for real through `isPortFree` and `processIsAliveBroker`.
 * WHEN-NOT-TO-USE: For state that cannot be probed without side effects.
 */

import { isPortFree } from '#gateway/node/net';

import type { SmoketestTeardownCheck } from '../../../contracts/smoketest-teardown-check/smoketest-teardown-check-contract';
import { processIsAliveBroker } from '../../process/is-alive/process-is-alive-broker';

export const smoketestRunTeardownChecksBroker = async ({
  checks,
}: {
  checks: readonly SmoketestTeardownCheck[];
}): Promise<{ passed: boolean; failures: readonly SmoketestTeardownCheck[] }> => {
  const results = await Promise.all(
    checks.map(async (check) => {
      if (check.kind === 'port-free') {
        const free = await isPortFree({ port: check.port });
        return { check, passed: free };
      }
      // process-gone: the probe answers true while the pid is alive — inverted for "gone"
      const alive = processIsAliveBroker({ pid: check.pid });
      return { check, passed: !alive };
    }),
  );

  const failures = results.filter((entry) => !entry.passed).map((entry) => entry.check);

  return {
    passed: failures.length === 0,
    failures,
  };
};

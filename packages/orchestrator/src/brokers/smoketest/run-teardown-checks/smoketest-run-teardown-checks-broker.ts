/**
 * PURPOSE: Evaluates a list of SmoketestTeardownChecks against real OS state and returns pass/fail
 *
 * USAGE:
 * const outcome = await smoketestRunTeardownChecksBroker({ checks });
 * // Returns: { passed: true } when every teardown check matches; otherwise { passed: false, failures: [...] }
 *
 * WHEN-TO-USE: After a siegemaster smoketest case completes, to confirm the dev server released its port and
 * its child process fully exited. Calls real adapters (netCheckPortFreeAdapter, processSignalAdapter).
 * WHEN-NOT-TO-USE: For state that cannot be probed without side effects.
 */

import type { SmoketestTeardownCheck } from '../../../contracts/smoketest-teardown-check/smoketest-teardown-check-contract';
import { netCheckPortFreeAdapter } from '../../../adapters/net/check-port-free/net-check-port-free-adapter';
import { processSignalAdapter } from '../../../adapters/process/signal/process-signal-adapter';

const LIVENESS_PROBE_SIGNAL = 0;

export const smoketestRunTeardownChecksBroker = async ({
  checks,
}: {
  checks: readonly SmoketestTeardownCheck[];
}): Promise<{ passed: boolean; failures: readonly SmoketestTeardownCheck[] }> => {
  const results = await Promise.all(
    checks.map(async (check) => {
      if (check.kind === 'port-free') {
        const free = await netCheckPortFreeAdapter({ port: check.port });
        return { check, passed: free };
      }
      // process-gone: signal=0 returns true if pid is alive — inverted for "gone"
      const alive = processSignalAdapter({ pid: check.pid, signal: LIVENESS_PROBE_SIGNAL });
      return { check, passed: !alive };
    }),
  );

  const failures = results.filter((entry) => !entry.passed).map((entry) => entry.check);

  return {
    passed: failures.length === 0,
    failures,
  };
};

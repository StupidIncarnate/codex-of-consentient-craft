/**
 * PURPOSE: Throws when the family graph or any step graph carries a reachability violation — the
 * server-boot half of story 06's safety net. Called directly from a flow, above both existing
 * bootstraps, so a bad graph stops the boot with a message naming the offender rather than
 * stalling a quest with no error later. The thrown message is the SAME strings
 * `graphReachabilityViolationsTransformer` renders for the lint rule — joined, not duplicated.
 *
 * USAGE:
 * GraphReachabilityCheckResponder();
 * // Throws when graphReachabilityCheckBroker() returns any violation; otherwise returns
 * // { success: true }
 */
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { graphReachabilityCheckBroker } from '@dungeonmaster/orchestrator/brokers';

export const GraphReachabilityCheckResponder = (): AdapterResult => {
  const violations = graphReachabilityCheckBroker();
  if (violations.length > 0) {
    throw new Error(violations.join('\n'));
  }
  return adapterResultContract.parse({ success: true });
};

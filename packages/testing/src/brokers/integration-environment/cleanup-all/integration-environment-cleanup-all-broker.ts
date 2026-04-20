/**
 * PURPOSE: Cleans up all created integration test environments and clears tracking
 *
 * USAGE:
 * integrationEnvironmentCleanupAllBroker();
 * // Calls cleanup() on all tracked projects and clears the tracking list
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import { integrationEnvironmentTrackingBroker } from '../tracking/integration-environment-tracking-broker';

export const integrationEnvironmentCleanupAllBroker = (): AdapterResult => {
  const environments = integrationEnvironmentTrackingBroker.getAll();

  for (const env of environments) {
    env.cleanup();
  }

  integrationEnvironmentTrackingBroker.clear();
  return adapterResultContract.parse({ success: true });
};

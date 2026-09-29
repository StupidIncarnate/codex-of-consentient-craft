/**
 * PURPOSE: Cleans up all created integration test environments and clears tracking
 *
 * USAGE:
 * integrationEnvironmentCleanupAllBroker();
 * // Calls cleanup() on all tracked projects and clears the tracking list
 */

import { integrationEnvironmentTrackingBroker } from '../tracking/integration-environment-tracking-broker';

export const integrationEnvironmentCleanupAllBroker = (): void => {
  const environments = integrationEnvironmentTrackingBroker.getAll();

  for (const env of environments) {
    env.cleanup();
  }

  integrationEnvironmentTrackingBroker.clear();
};

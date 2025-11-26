/**
 * PURPOSE: Proxy for integration-environment-cleanup-all-broker testing
 *
 * USAGE:
 * const proxy = integrationEnvironmentCleanupAllBrokerProxy();
 * // No mocks needed - delegates to tracking broker
 */

import { integrationEnvironmentTrackingBrokerProxy } from '../tracking/integration-environment-tracking-broker.proxy';

export const integrationEnvironmentCleanupAllBrokerProxy = (): Record<PropertyKey, never> => {
  integrationEnvironmentTrackingBrokerProxy();

  return {};
};

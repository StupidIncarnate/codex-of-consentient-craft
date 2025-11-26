/**
 * PURPOSE: Proxy for integration-environment-list-broker testing
 *
 * USAGE:
 * const proxy = integrationEnvironmentListBrokerProxy();
 * // No mocks needed - delegates to tracking broker
 */

import { integrationEnvironmentTrackingBrokerProxy } from '../tracking/integration-environment-tracking-broker.proxy';

export const integrationEnvironmentListBrokerProxy = (): Record<PropertyKey, never> => {
  integrationEnvironmentTrackingBrokerProxy();

  return {};
};

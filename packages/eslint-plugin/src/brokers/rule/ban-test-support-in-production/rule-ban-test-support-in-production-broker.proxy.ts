/**
 * Proxy for ban-test-support-in-production rule broker.
 * ESLint rules run with real parsing to validate DSL logic; the proxy only builds the layer's.
 */
import { reportTestSupportLayerBrokerProxy } from './report-test-support-layer-broker.proxy';

export const ruleBanTestSupportInProductionBrokerProxy = (): Record<PropertyKey, never> => {
  reportTestSupportLayerBrokerProxy();

  return {};
};

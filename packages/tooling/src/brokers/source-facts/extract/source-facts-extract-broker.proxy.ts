import { sourceFactsExtractStatementsLayerBrokerProxy } from './source-facts-extract-statements-layer-broker.proxy';
import { sourceFactsExtractStagingLayerBrokerProxy } from './source-facts-extract-staging-layer-broker.proxy';

// `#gateway/npm/typescript` is a pure pass-through with no proxy of its own, so the parse runs for
// real in this broker's own test; only the two layers' (empty) proxies are composed.
export const sourceFactsExtractBrokerProxy = (): Record<PropertyKey, never> => {
  sourceFactsExtractStatementsLayerBrokerProxy();
  sourceFactsExtractStagingLayerBrokerProxy();
  return {};
};

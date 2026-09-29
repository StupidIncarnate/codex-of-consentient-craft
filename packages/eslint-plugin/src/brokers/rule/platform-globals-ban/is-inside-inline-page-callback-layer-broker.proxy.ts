import { isPageCallbackCallLayerBrokerProxy } from './is-page-callback-call-layer-broker.proxy';

// Pure AST-shape check — no I/O boundary to mock.
export const isInsideInlinePageCallbackLayerBrokerProxy = (): Record<PropertyKey, never> => {
  isPageCallbackCallLayerBrokerProxy();
  return {};
};

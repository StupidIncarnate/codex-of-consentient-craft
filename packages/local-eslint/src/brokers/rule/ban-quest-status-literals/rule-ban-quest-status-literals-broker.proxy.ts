/**
 * PURPOSE: Proxy for the ban-quest-status-literals rule broker — wires up child layer-broker proxies so the enforce-proxy-child-creation rule passes.
 *
 * USAGE:
 * ruleBanQuestStatusLiteralsBrokerProxy();
 *
 * WHEN-TO-USE: Present only to satisfy enforce-proxy-patterns / enforce-proxy-child-creation. Tests for the rule itself use RuleTester directly.
 */
import { isStatusMemberExpressionLayerBrokerProxy } from './is-status-member-expression-layer-broker.proxy';
import { hasInlineStatusSetElementsLayerBrokerProxy } from './has-inline-status-set-elements-layer-broker.proxy';

export const ruleBanQuestStatusLiteralsBrokerProxy = (): Record<PropertyKey, never> => {
  isStatusMemberExpressionLayerBrokerProxy();
  hasInlineStatusSetElementsLayerBrokerProxy();
  return {};
};

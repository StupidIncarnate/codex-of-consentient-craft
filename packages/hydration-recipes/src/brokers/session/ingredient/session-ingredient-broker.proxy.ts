import { recipesHydrationCreateBrokerProxy } from '../../recipes-hydration/create/recipes-hydration-create-broker.proxy';
import { sessionNestedChainBrokerProxy } from '../nested-chain/session-nested-chain-broker.proxy';
import { sessionQueryRouteBrokerProxy } from '../query-route/session-query-route-broker.proxy';
import { sessionRemoveRouteBrokerProxy } from '../remove-route/session-remove-route-broker.proxy';
import { sessionWriteRouteBrokerProxy } from '../write-route/session-write-route-broker.proxy';

// This file's declaration runs at IMPORT TIME (`ingredient({...})` is a real call, not a
// deferred one), but none of the route/extra brokers below are themselves CALLED while
// declaring — only referenced as values. Every child proxy here is wired only to satisfy
// `enforce-proxy-child-creation`, never to stage a value.
export const sessionIngredientBrokerProxy = (): Record<PropertyKey, never> => {
  recipesHydrationCreateBrokerProxy();
  sessionNestedChainBrokerProxy();
  sessionQueryRouteBrokerProxy();
  sessionRemoveRouteBrokerProxy();
  sessionWriteRouteBrokerProxy();
  return {};
};

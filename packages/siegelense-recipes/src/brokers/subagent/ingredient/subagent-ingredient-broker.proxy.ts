import { recipesHydrationCreateBrokerProxy } from '../../recipes-hydration/create/recipes-hydration-create-broker.proxy';
import { subagentQueryRouteBrokerProxy } from '../query-route/subagent-query-route-broker.proxy';
import { subagentRemoveRouteBrokerProxy } from '../remove-route/subagent-remove-route-broker.proxy';
import { subagentWriteRouteBrokerProxy } from '../write-route/subagent-write-route-broker.proxy';

// This file's declaration runs at IMPORT TIME (`ingredient({...})` is a real call, not a
// deferred one), but none of the route brokers below are themselves CALLED while declaring —
// only referenced as values. Every child proxy here is wired only to satisfy
// `enforce-proxy-child-creation`, never to stage a value.
export const subagentIngredientBrokerProxy = (): Record<PropertyKey, never> => {
  recipesHydrationCreateBrokerProxy();
  subagentQueryRouteBrokerProxy();
  subagentRemoveRouteBrokerProxy();
  subagentWriteRouteBrokerProxy();
  return {};
};

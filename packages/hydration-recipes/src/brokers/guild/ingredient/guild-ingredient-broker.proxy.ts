import { recipesHydrationCreateBrokerProxy } from '../../recipes-hydration/create/recipes-hydration-create-broker.proxy';
import { guildApiRouteBrokerProxy } from '../api-route/guild-api-route-broker.proxy';
import { guildQueryRouteBrokerProxy } from '../query-route/guild-query-route-broker.proxy';
import { guildRemoveRouteBrokerProxy } from '../remove-route/guild-remove-route-broker.proxy';
import { guildWriteRouteBrokerProxy } from '../write-route/guild-write-route-broker.proxy';

// This file's declaration runs at IMPORT TIME (`ingredient({...})` is a real call, not a
// deferred one), but none of the route brokers below are themselves CALLED while declaring —
// only referenced as values inside `routes`. Every child proxy here is wired only to satisfy
// `enforce-proxy-child-creation`, never to stage a value.
export const guildIngredientBrokerProxy = (): Record<PropertyKey, never> => {
  recipesHydrationCreateBrokerProxy();
  guildApiRouteBrokerProxy();
  guildQueryRouteBrokerProxy();
  guildRemoveRouteBrokerProxy();
  guildWriteRouteBrokerProxy();
  return {};
};

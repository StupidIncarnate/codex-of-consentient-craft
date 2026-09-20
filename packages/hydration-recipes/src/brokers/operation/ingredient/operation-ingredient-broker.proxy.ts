import { recipesHydrationCreateBrokerProxy } from '../../recipes-hydration/create/recipes-hydration-create-broker.proxy';
import { operationQueryRouteBrokerProxy } from '../query-route/operation-query-route-broker.proxy';
import { operationRemoveRouteBrokerProxy } from '../remove-route/operation-remove-route-broker.proxy';
import { operationUpdateRouteBrokerProxy } from '../update-route/operation-update-route-broker.proxy';
import { operationWriteRouteBrokerProxy } from '../write-route/operation-write-route-broker.proxy';

// This file's declaration runs at IMPORT TIME, but none of the route brokers below are
// themselves CALLED while declaring — only referenced as values. Every child proxy here is
// wired only to satisfy `enforce-proxy-child-creation`, never to stage a value.
export const operationIngredientBrokerProxy = (): Record<PropertyKey, never> => {
  recipesHydrationCreateBrokerProxy();
  operationQueryRouteBrokerProxy();
  operationRemoveRouteBrokerProxy();
  operationUpdateRouteBrokerProxy();
  operationWriteRouteBrokerProxy();
  return {};
};

import { recipesHydrationCreateBrokerProxy } from '../../recipes-hydration/create/recipes-hydration-create-broker.proxy';
import { dmRegistryBrokerProxy } from '../../dm/registry/dm-registry-broker.proxy';

export const recipesSessionSingleTurnBrokerProxy = (): Record<PropertyKey, never> => {
  recipesHydrationCreateBrokerProxy();
  dmRegistryBrokerProxy();
  return {};
};

import { dmRegistryBrokerProxy } from '../../dm/registry/dm-registry-broker.proxy';
import { recipesHydrationCreateBrokerProxy } from '../../recipes-hydration/create/recipes-hydration-create-broker.proxy';

export const recipesQuestAdvancesOneStepBrokerProxy = (): Record<PropertyKey, never> => {
  recipesHydrationCreateBrokerProxy();
  dmRegistryBrokerProxy();
  return {};
};

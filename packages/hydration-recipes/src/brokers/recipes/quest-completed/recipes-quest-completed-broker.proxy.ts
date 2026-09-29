import { recipesHydrationCreateBrokerProxy } from '../../recipes-hydration/create/recipes-hydration-create-broker.proxy';
import { dmRegistryBrokerProxy } from '../../dm/registry/dm-registry-broker.proxy';

export const recipesQuestCompletedBrokerProxy = ({
  registry,
}: {
  registry?: ReturnType<typeof dmRegistryBrokerProxy>;
} = {}): Record<PropertyKey, never> => {
  recipesHydrationCreateBrokerProxy();
  if (registry === undefined) {
    dmRegistryBrokerProxy();
  }
  return {};
};

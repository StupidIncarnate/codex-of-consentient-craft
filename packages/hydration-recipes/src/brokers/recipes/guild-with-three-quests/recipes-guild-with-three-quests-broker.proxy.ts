import { recipesHydrationCreateBrokerProxy } from '../../recipes-hydration/create/recipes-hydration-create-broker.proxy';
import { dmRegistryBrokerProxy } from '../../dm/registry/dm-registry-broker.proxy';

export const recipesGuildWithThreeQuestsBrokerProxy = ({
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

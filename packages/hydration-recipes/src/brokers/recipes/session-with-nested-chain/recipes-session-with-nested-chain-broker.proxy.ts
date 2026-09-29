import { dmRegistryBrokerProxy } from '../../dm/registry/dm-registry-broker.proxy';
import { recipesHydrationCreateBrokerProxy } from '../../recipes-hydration/create/recipes-hydration-create-broker.proxy';

export const recipesSessionWithNestedChainBrokerProxy = ({
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

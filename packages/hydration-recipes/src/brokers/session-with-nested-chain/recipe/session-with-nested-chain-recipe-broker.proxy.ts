import { dmRegistryBrokerProxy } from '../../dm/registry/dm-registry-broker.proxy';
import { recipesHydrationCreateBrokerProxy } from '../../recipes-hydration/create/recipes-hydration-create-broker.proxy';

// `recipe({...}, build)` only BUILDS a plan as data when the returned callable is invoked — no
// I/O runs at declaration time. Every child proxy here is wired only to satisfy
// `enforce-proxy-child-creation`.
export const sessionWithNestedChainRecipeBrokerProxy = (): Record<PropertyKey, never> => {
  recipesHydrationCreateBrokerProxy();
  dmRegistryBrokerProxy();
  return {};
};

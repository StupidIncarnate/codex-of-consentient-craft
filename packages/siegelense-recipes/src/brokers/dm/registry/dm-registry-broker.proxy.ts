import { recipesHydrationCreateBrokerProxy } from '../../recipes-hydration/create/recipes-hydration-create-broker.proxy';
import { guildIngredientBrokerProxy } from '../../guild/ingredient/guild-ingredient-broker.proxy';
import { operationIngredientBrokerProxy } from '../../operation/ingredient/operation-ingredient-broker.proxy';
import { questIngredientBrokerProxy } from '../../quest/ingredient/quest-ingredient-broker.proxy';
import { sessionIngredientBrokerProxy } from '../../session/ingredient/session-ingredient-broker.proxy';
import { subagentIngredientBrokerProxy } from '../../subagent/ingredient/subagent-ingredient-broker.proxy';

// `registry({...})` runs real logic over the five configs already built (the duplicate-name and
// dangling-link checks), so nothing here stages a return value — every child proxy is wired only
// to satisfy `enforce-proxy-child-creation`.
export const dmRegistryBrokerProxy = (): Record<PropertyKey, never> => {
  recipesHydrationCreateBrokerProxy();
  guildIngredientBrokerProxy();
  operationIngredientBrokerProxy();
  questIngredientBrokerProxy();
  sessionIngredientBrokerProxy();
  subagentIngredientBrokerProxy();
  return {};
};

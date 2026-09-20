import { ingredientDeclareBrokerProxy } from '../../ingredient/declare/ingredient-declare-broker.proxy';
import { registryCreateBrokerProxy } from '../../registry/create/registry-create-broker.proxy';
import { recipeDeclareBrokerProxy } from '../../recipe/declare/recipe-declare-broker.proxy';
import { planRunBrokerProxy } from '../../plan/run/plan-run-broker.proxy';

export const hydrationCreateBrokerProxy = (): Record<PropertyKey, never> => {
  ingredientDeclareBrokerProxy();
  registryCreateBrokerProxy();
  recipeDeclareBrokerProxy();
  planRunBrokerProxy();
  return {};
};

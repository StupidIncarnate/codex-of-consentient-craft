import { ingredientDeclareBrokerProxy } from '../../ingredient/declare/ingredient-declare-broker.proxy';
import { registryCreateBrokerProxy } from '../../registry/create/registry-create-broker.proxy';
import { recipeDeclareBrokerProxy } from '../../recipe/declare/recipe-declare-broker.proxy';

export const hydrationCreateBrokerProxy = (): Record<PropertyKey, never> => {
  ingredientDeclareBrokerProxy();
  registryCreateBrokerProxy();
  recipeDeclareBrokerProxy();
  return {};
};

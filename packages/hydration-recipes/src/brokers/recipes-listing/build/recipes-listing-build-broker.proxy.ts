/**
 * PURPOSE: Proxy for recipesListingBuildBroker — delegates probe corruption to the recipe
 * catalog proxy.
 *
 * USAGE:
 * const proxy = recipesListingBuildBrokerProxy();
 * proxy.corruptQuestAdvancesOneStepProbe();
 */

import { recipesCatalogBrokerProxy } from '../../recipes/catalog/recipes-catalog-broker.proxy';

export const recipesListingBuildBrokerProxy = (): {
  corruptQuestAdvancesOneStepProbe: () => void;
} => {
  const catalogProxy = recipesCatalogBrokerProxy();

  return {
    corruptQuestAdvancesOneStepProbe: (): void => {
      catalogProxy.corruptQuestAdvancesOneStepProbe();
    },
  };
};

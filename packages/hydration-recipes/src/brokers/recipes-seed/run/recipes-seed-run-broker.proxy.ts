/**
 * PURPOSE: Proxy for recipesSeedRunBroker — composes recipesCatalogBrokerProxy.
 *
 * USAGE:
 * recipesSeedRunBrokerProxy();
 */

import { recipesCatalogBrokerProxy } from '../../recipes/catalog/recipes-catalog-broker.proxy';

export const recipesSeedRunBrokerProxy = (): Record<PropertyKey, never> => {
  recipesCatalogBrokerProxy();
  return {};
};

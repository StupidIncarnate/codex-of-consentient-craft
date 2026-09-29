/**
 * PURPOSE: Proxy for recipesSeedRunBroker — composes recipesCatalogBrokerProxy and the env gateway proxies.
 *
 * USAGE:
 * recipesSeedRunBrokerProxy();
 */

import { deleteEnvProxy } from '#gateway/node/process/delete-env/delete-env.proxy';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { setEnvProxy } from '#gateway/node/process/set-env/set-env.proxy';
import { recipesCatalogBrokerProxy } from '../../recipes/catalog/recipes-catalog-broker.proxy';

export const recipesSeedRunBrokerProxy = (): Record<PropertyKey, never> => {
  getEnvProxy();
  setEnvProxy();
  deleteEnvProxy();
  recipesCatalogBrokerProxy();
  return {};
};

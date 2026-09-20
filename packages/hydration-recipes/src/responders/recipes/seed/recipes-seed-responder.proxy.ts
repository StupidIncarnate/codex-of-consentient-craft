/**
 * PURPOSE: Proxy for RecipesSeedResponder — composes recipesSeedRunBrokerProxy.
 *
 * USAGE:
 * const proxy = RecipesSeedResponderProxy();
 * await proxy.callResponder({ recipeName: 'guild-mid-execution', home: '/tmp/test' });
 */

import { recipesSeedRunBrokerProxy } from '../../../brokers/recipes-seed/run/recipes-seed-run-broker.proxy';
import { RecipesSeedResponder } from './recipes-seed-responder';

export const RecipesSeedResponderProxy = (): {
  callResponder: typeof RecipesSeedResponder;
} => {
  recipesSeedRunBrokerProxy();

  return {
    callResponder: RecipesSeedResponder,
  };
};

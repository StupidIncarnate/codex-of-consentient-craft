/**
 * PURPOSE: Proxy for RecipesListingResponder — composes recipesListingBuildBrokerProxy.
 *
 * USAGE:
 * const proxy = RecipesListingResponderProxy();
 * proxy.corruptQuestAdvancesOneStepProbe();
 * const result = proxy.callResponder();
 */

import { recipesListingBuildBrokerProxy } from '../../../brokers/recipes-listing/build/recipes-listing-build-broker.proxy';
import { RecipesListingResponder } from './recipes-listing-responder';

export const RecipesListingResponderProxy = (): {
  callResponder: typeof RecipesListingResponder;
  corruptQuestAdvancesOneStepProbe: () => void;
} => {
  const brokerProxy = recipesListingBuildBrokerProxy();

  return {
    callResponder: RecipesListingResponder,
    corruptQuestAdvancesOneStepProbe: (): void => {
      brokerProxy.corruptQuestAdvancesOneStepProbe();
    },
  };
};

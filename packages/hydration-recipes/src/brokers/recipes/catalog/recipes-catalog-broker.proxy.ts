import { dmRegistryBrokerProxy } from '../../dm/registry/dm-registry-broker.proxy';
import { recipesGuildMidExecutionBrokerProxy } from '../guild-mid-execution/recipes-guild-mid-execution-broker.proxy';
import { recipesQuestAdvancesOneStepBrokerProxy } from '../quest-advances-one-step/recipes-quest-advances-one-step-broker.proxy';
import { recipesSessionWithNestedChainBrokerProxy } from '../session-with-nested-chain/recipes-session-with-nested-chain-broker.proxy';
import { recipeListingProbeStatics } from '../../../statics/recipe-listing-probe/recipe-listing-probe-statics';

export const recipesCatalogBrokerProxy = (): {
  corruptQuestAdvancesOneStepProbe: () => void;
} => {
  dmRegistryBrokerProxy();
  recipesGuildMidExecutionBrokerProxy();
  recipesQuestAdvancesOneStepBrokerProxy();
  recipesSessionWithNestedChainBrokerProxy();

  return {
    corruptQuestAdvancesOneStepProbe: (): void => {
      Object.defineProperty(recipeListingProbeStatics.questAdvancesOneStep, 'guildId', {
        value: 'not-a-real-uuid',
        configurable: true,
        enumerable: true,
        writable: true,
      });
    },
  };
};

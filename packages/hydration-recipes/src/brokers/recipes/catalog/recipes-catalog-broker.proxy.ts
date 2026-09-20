import { dmRegistryBrokerProxy } from '../../dm/registry/dm-registry-broker.proxy';
import { recipesGuildEmptyBrokerProxy } from '../guild-empty/recipes-guild-empty-broker.proxy';
import { recipesGuildWithThreeQuestsBrokerProxy } from '../guild-with-three-quests/recipes-guild-with-three-quests-broker.proxy';
import { recipesGuildMidExecutionBrokerProxy } from '../guild-mid-execution/recipes-guild-mid-execution-broker.proxy';
import { recipesQuestAdvancesOneStepBrokerProxy } from '../quest-advances-one-step/recipes-quest-advances-one-step-broker.proxy';
import { recipesQuestCompletedBrokerProxy } from '../quest-completed/recipes-quest-completed-broker.proxy';
import { recipesSessionSingleTurnBrokerProxy } from '../session-single-turn/recipes-session-single-turn-broker.proxy';
import { recipesSessionWithNestedChainBrokerProxy } from '../session-with-nested-chain/recipes-session-with-nested-chain-broker.proxy';
import { recipesGuildActiveSuiteBrokerProxy } from '../guild-active-suite/recipes-guild-active-suite-broker.proxy';
import { recipeListingProbeStatics } from '../../../statics/recipe-listing-probe/recipe-listing-probe-statics';

export const recipesCatalogBrokerProxy = (): {
  corruptQuestAdvancesOneStepProbe: () => void;
} => {
  dmRegistryBrokerProxy();
  recipesGuildEmptyBrokerProxy();
  recipesGuildWithThreeQuestsBrokerProxy();
  recipesGuildMidExecutionBrokerProxy();
  recipesQuestAdvancesOneStepBrokerProxy();
  recipesQuestCompletedBrokerProxy();
  recipesSessionSingleTurnBrokerProxy();
  recipesSessionWithNestedChainBrokerProxy();
  recipesGuildActiveSuiteBrokerProxy();

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

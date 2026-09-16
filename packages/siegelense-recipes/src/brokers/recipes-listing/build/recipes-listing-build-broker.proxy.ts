/**
 * PURPOSE: `recipesListingBuildBroker` calls only pure code — three recipe callables and
 * `dmRegistryBroker.listing`, neither of which touches an adapter or a non-deterministic global —
 * so every child proxy here is wired only to satisfy `enforce-proxy-child-creation`. The one
 * scenario this DOES need to stage is a probe that no longer satisfies its own recipe's `inputs`
 * contract, proving the broker's own error wrapping rather than assuming it. `Reflect.set` is
 * confined to `*-guard.ts`/`*-contract.ts` files repo-wide, so this corrupts the shared statics
 * object through `Object.defineProperty` instead — left corrupted, since the one test that stages
 * it is the last one in its file and no later test in that file reads this probe again.
 *
 * USAGE:
 * const proxy = recipesListingBuildBrokerProxy();
 * proxy.corruptQuestAdvancesOneStepProbe();
 * // recipesListingBuildBroker() now throws naming quest-advances-one-step and guildId
 */
import { dmRegistryBrokerProxy } from '../../dm/registry/dm-registry-broker.proxy';
import { guildMidExecutionRecipeBrokerProxy } from '../../guild-mid-execution/recipe/guild-mid-execution-recipe-broker.proxy';
import { questAdvancesOneStepRecipeBrokerProxy } from '../../quest-advances-one-step/recipe/quest-advances-one-step-recipe-broker.proxy';
import { sessionWithNestedChainRecipeBrokerProxy } from '../../session-with-nested-chain/recipe/session-with-nested-chain-recipe-broker.proxy';
import { recipeListingProbeStatics } from '../../../statics/recipe-listing-probe/recipe-listing-probe-statics';

export const recipesListingBuildBrokerProxy = (): {
  corruptQuestAdvancesOneStepProbe: () => void;
} => {
  dmRegistryBrokerProxy();
  guildMidExecutionRecipeBrokerProxy();
  questAdvancesOneStepRecipeBrokerProxy();
  sessionWithNestedChainRecipeBrokerProxy();

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

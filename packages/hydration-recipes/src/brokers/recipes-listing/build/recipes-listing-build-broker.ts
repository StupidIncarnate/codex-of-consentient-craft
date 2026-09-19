/**
 * PURPOSE: Builds the `recipes {}` listing off this repo's own three recipes, without dispatching a
 * single route. `runs`/`makes` need a real `Plan`, and `quest-advances-one-step` and
 * `session-with-nested-chain` cannot build one without input values — both parse their own `inputs`
 * inside their build callback. So this broker hands each one `recipeListingProbeStatics`'s fixed
 * probe instead of a real earlier step's output; the callback only assembles a `Plan` as data, so
 * nothing a probe carries ever reaches disk, a socket or a screen.
 *
 * `dmRegistryBroker`, never a fresh `recipesHydrationCreateBroker()` call: `.listing()` reads back
 * the ingredient list the SAME binding's `registry()` populated, and a second binding's `listing`
 * sees an empty one — `dm-registry-broker.ts`'s own header names this exactly.
 *
 * USAGE:
 * recipesListingBuildBroker();
 * // Returns one entry per recipe this repo declares: recipeName, description, inputKeys, runs, makes
 */
import { recipeNameContract } from '@dungeonmaster/hydration/contracts';
import type {
  RecipeName,
  RecipeDefData,
  PlanRunsResult,
  PlanMakesEntry,
} from '@dungeonmaster/hydration/contracts';

import { questAdvancesOneStepInputsContract } from '../../../contracts/quest-advances-one-step-inputs/quest-advances-one-step-inputs-contract';
import { sessionWithNestedChainInputsContract } from '../../../contracts/session-with-nested-chain-inputs/session-with-nested-chain-inputs-contract';
import type { QuestAdvancesOneStepInputs } from '../../../contracts/quest-advances-one-step-inputs/quest-advances-one-step-inputs-contract';
import type { SessionWithNestedChainInputs } from '../../../contracts/session-with-nested-chain-inputs/session-with-nested-chain-inputs-contract';
import { recipeListingProbeStatics } from '../../../statics/recipe-listing-probe/recipe-listing-probe-statics';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { guildMidExecutionRecipeBroker } from '../../guild-mid-execution/recipe/guild-mid-execution-recipe-broker';
import { questAdvancesOneStepRecipeBroker } from '../../quest-advances-one-step/recipe/quest-advances-one-step-recipe-broker';
import { sessionWithNestedChainRecipeBroker } from '../../session-with-nested-chain/recipe/session-with-nested-chain-recipe-broker';

export const recipesListingBuildBroker = (): readonly {
  recipeName: RecipeName;
  description: RecipeDefData['description'];
  inputKeys: readonly (keyof QuestAdvancesOneStepInputs | keyof SessionWithNestedChainInputs)[];
  runs: PlanRunsResult;
  makes: readonly PlanMakesEntry[];
}[] => {
  const questAdvancesOneStepParse = questAdvancesOneStepInputsContract.safeParse(
    recipeListingProbeStatics.questAdvancesOneStep,
  );
  if (!questAdvancesOneStepParse.success) {
    throw new Error(
      `recipe '${questAdvancesOneStepRecipeBroker.recipeName}': its listing probe no longer satisfies its own inputs contract — ${questAdvancesOneStepParse.error.message}`,
      { cause: questAdvancesOneStepParse.error },
    );
  }
  const questAdvancesOneStepInput = questAdvancesOneStepParse.data;

  const sessionWithNestedChainParse = sessionWithNestedChainInputsContract.safeParse(
    recipeListingProbeStatics.sessionWithNestedChain,
  );
  if (!sessionWithNestedChainParse.success) {
    throw new Error(
      `recipe '${sessionWithNestedChainRecipeBroker.recipeName}': its listing probe no longer satisfies its own inputs contract — ${sessionWithNestedChainParse.error.message}`,
      { cause: sessionWithNestedChainParse.error },
    );
  }
  const sessionWithNestedChainInput = sessionWithNestedChainParse.data;

  const guildMidExecutionPlan = guildMidExecutionRecipeBroker();
  const questAdvancesOneStepPlan = questAdvancesOneStepRecipeBroker(questAdvancesOneStepInput);
  const sessionWithNestedChainPlan = sessionWithNestedChainRecipeBroker(
    sessionWithNestedChainInput,
  );

  return [
    {
      recipeName: recipeNameContract.parse(guildMidExecutionRecipeBroker.recipeName),
      description: guildMidExecutionRecipeBroker.description,
      inputKeys: [],
      ...dmRegistryBroker.listing(guildMidExecutionPlan),
    },
    {
      recipeName: recipeNameContract.parse(questAdvancesOneStepRecipeBroker.recipeName),
      description: questAdvancesOneStepRecipeBroker.description,
      inputKeys: Object.keys(
        questAdvancesOneStepInput,
      ) as readonly (keyof QuestAdvancesOneStepInputs)[],
      ...dmRegistryBroker.listing(questAdvancesOneStepPlan),
    },
    {
      recipeName: recipeNameContract.parse(sessionWithNestedChainRecipeBroker.recipeName),
      description: sessionWithNestedChainRecipeBroker.description,
      inputKeys: Object.keys(
        sessionWithNestedChainInput,
      ) as readonly (keyof SessionWithNestedChainInputs)[],
      ...dmRegistryBroker.listing(sessionWithNestedChainPlan),
    },
  ];
};

/**
 * PURPOSE: The centralized catalog for all hydration recipes in this package. Reach for this
 * over querying individual recipe brokers when listing available recipes or dynamically executing
 * a recipe by name.
 *
 * USAGE:
 * const entries = recipesCatalogBroker();
 * // Returns readonly RecipeCatalogEntry[]
 */

import { recipeNameContract } from '@dungeonmaster/hydration/contracts';

import type { RecipeCatalogEntry } from '../../../contracts/recipe-catalog-entry/recipe-catalog-entry-contract';
import { recipeInputKeyContract } from '../../../contracts/recipe-input-key/recipe-input-key-contract';
import { questAdvancesOneStepInputsContract } from '../../../contracts/quest-advances-one-step-inputs/quest-advances-one-step-inputs-contract';
import { sessionWithNestedChainInputsContract } from '../../../contracts/session-with-nested-chain-inputs/session-with-nested-chain-inputs-contract';
import { recipeListingProbeStatics } from '../../../statics/recipe-listing-probe/recipe-listing-probe-statics';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesGuildEmptyBroker } from '../guild-empty/recipes-guild-empty-broker';
import { recipesGuildWithThreeQuestsBroker } from '../guild-with-three-quests/recipes-guild-with-three-quests-broker';
import { recipesGuildMidExecutionBroker } from '../guild-mid-execution/recipes-guild-mid-execution-broker';
import { recipesQuestAdvancesOneStepBroker } from '../quest-advances-one-step/recipes-quest-advances-one-step-broker';
import { recipesQuestCompletedBroker } from '../quest-completed/recipes-quest-completed-broker';
import { recipesSessionSingleTurnBroker } from '../session-single-turn/recipes-session-single-turn-broker';
import { recipesSessionWithNestedChainBroker } from '../session-with-nested-chain/recipes-session-with-nested-chain-broker';
import { recipesGuildActiveSuiteBroker } from '../guild-active-suite/recipes-guild-active-suite-broker';

export const recipesCatalogBroker = (): readonly RecipeCatalogEntry[] => [
  {
    recipeName: recipeNameContract.parse(recipesGuildEmptyBroker.recipeName),
    description: recipesGuildEmptyBroker.description,
    probeListing: () => {
      const plan = recipesGuildEmptyBroker();
      const listing = dmRegistryBroker.listing(plan);
      return {
        runs: listing.runs,
        makes: listing.makes,
        inputKeys: [],
      };
    },
    execute: async ({ params, target }) => {
      const suppliedKeys = Object.keys(params ?? {});
      if (suppliedKeys.length > 0) {
        throw new Error(
          `recipesSeedRunBroker: recipe 'guild-empty' takes no params, got: ${suppliedKeys.join(', ')}`,
        );
      }
      return dmRegistryBroker.run(recipesGuildEmptyBroker(), target);
    },
  },
  {
    recipeName: recipeNameContract.parse(recipesGuildWithThreeQuestsBroker.recipeName),
    description: recipesGuildWithThreeQuestsBroker.description,
    probeListing: () => {
      const plan = recipesGuildWithThreeQuestsBroker();
      const listing = dmRegistryBroker.listing(plan);
      return {
        runs: listing.runs,
        makes: listing.makes,
        inputKeys: [],
      };
    },
    execute: async ({ params, target }) => {
      const suppliedKeys = Object.keys(params ?? {});
      if (suppliedKeys.length > 0) {
        throw new Error(
          `recipesSeedRunBroker: recipe 'guild-with-three-quests' takes no params, got: ${suppliedKeys.join(', ')}`,
        );
      }
      return dmRegistryBroker.run(recipesGuildWithThreeQuestsBroker(), target);
    },
  },
  {
    recipeName: recipeNameContract.parse(recipesGuildMidExecutionBroker.recipeName),
    description: recipesGuildMidExecutionBroker.description,
    probeListing: () => {
      const plan = recipesGuildMidExecutionBroker();
      const listing = dmRegistryBroker.listing(plan);
      return {
        runs: listing.runs,
        makes: listing.makes,
        inputKeys: [],
      };
    },
    execute: async ({ params, target }) => {
      const suppliedKeys = Object.keys(params ?? {});
      if (suppliedKeys.length > 0) {
        throw new Error(
          `recipesSeedRunBroker: recipe 'guild-mid-execution' takes no params, got: ${suppliedKeys.join(', ')}`,
        );
      }
      return dmRegistryBroker.run(recipesGuildMidExecutionBroker(), target);
    },
  },
  {
    recipeName: recipeNameContract.parse(recipesQuestAdvancesOneStepBroker.recipeName),
    description: recipesQuestAdvancesOneStepBroker.description,
    inputs: recipesQuestAdvancesOneStepBroker.inputs,
    probeListing: () => {
      const parseResult = questAdvancesOneStepInputsContract.safeParse(
        recipeListingProbeStatics.questAdvancesOneStep,
      );
      if (!parseResult.success) {
        throw new Error(
          `recipe 'quest-advances-one-step': its listing probe no longer satisfies its own inputs contract — ${parseResult.error.message}`,
          { cause: parseResult.error },
        );
      }
      const plan = recipesQuestAdvancesOneStepBroker(parseResult.data);
      const listing = dmRegistryBroker.listing(plan);
      const inputKeys = Object.keys(parseResult.data).map((key) =>
        recipeInputKeyContract.parse(key),
      );
      return {
        runs: listing.runs,
        makes: listing.makes,
        inputKeys,
      };
    },
    execute: async ({ params, target }) => {
      const parsedParams = questAdvancesOneStepInputsContract.safeParse(params ?? {});
      if (!parsedParams.success) {
        throw new Error(
          `recipesSeedRunBroker: recipe 'quest-advances-one-step' refused params — ${parsedParams.error.message} — this recipe takes: ${Object.keys(questAdvancesOneStepInputsContract.shape).join(', ')}`,
        );
      }
      return dmRegistryBroker.run(recipesQuestAdvancesOneStepBroker(parsedParams.data), target);
    },
  },
  {
    recipeName: recipeNameContract.parse(recipesQuestCompletedBroker.recipeName),
    description: recipesQuestCompletedBroker.description,
    probeListing: () => {
      const plan = recipesQuestCompletedBroker();
      const listing = dmRegistryBroker.listing(plan);
      return {
        runs: listing.runs,
        makes: listing.makes,
        inputKeys: [],
      };
    },
    execute: async ({ params, target }) => {
      const suppliedKeys = Object.keys(params ?? {});
      if (suppliedKeys.length > 0) {
        throw new Error(
          `recipesSeedRunBroker: recipe 'quest-completed' takes no params, got: ${suppliedKeys.join(', ')}`,
        );
      }
      return dmRegistryBroker.run(recipesQuestCompletedBroker(), target);
    },
  },
  {
    recipeName: recipeNameContract.parse(recipesSessionSingleTurnBroker.recipeName),
    description: recipesSessionSingleTurnBroker.description,
    inputs: recipesSessionSingleTurnBroker.inputs,
    probeListing: () => {
      const parseResult = sessionWithNestedChainInputsContract.safeParse(
        recipeListingProbeStatics.sessionSingleTurn,
      );
      if (!parseResult.success) {
        throw new Error(
          `recipe 'session-single-turn': its listing probe no longer satisfies its own inputs contract — ${parseResult.error.message}`,
          { cause: parseResult.error },
        );
      }
      const plan = recipesSessionSingleTurnBroker(parseResult.data);
      const listing = dmRegistryBroker.listing(plan);
      const inputKeys = Object.keys(parseResult.data).map((key) =>
        recipeInputKeyContract.parse(key),
      );
      return {
        runs: listing.runs,
        makes: listing.makes,
        inputKeys,
      };
    },
    execute: async ({ params, target }) => {
      const parsedParams = sessionWithNestedChainInputsContract.safeParse(params ?? {});
      if (!parsedParams.success) {
        throw new Error(
          `recipesSeedRunBroker: recipe 'session-single-turn' refused params — ${parsedParams.error.message} — this recipe takes: ${Object.keys(sessionWithNestedChainInputsContract.shape).join(', ')}`,
        );
      }
      return dmRegistryBroker.run(recipesSessionSingleTurnBroker(parsedParams.data), target);
    },
  },
  {
    recipeName: recipeNameContract.parse(recipesSessionWithNestedChainBroker.recipeName),
    description: recipesSessionWithNestedChainBroker.description,
    inputs: recipesSessionWithNestedChainBroker.inputs,
    probeListing: () => {
      const parseResult = sessionWithNestedChainInputsContract.safeParse(
        recipeListingProbeStatics.sessionWithNestedChain,
      );
      if (!parseResult.success) {
        throw new Error(
          `recipe 'session-with-nested-chain': its listing probe no longer satisfies its own inputs contract — ${parseResult.error.message}`,
          { cause: parseResult.error },
        );
      }
      const plan = recipesSessionWithNestedChainBroker(parseResult.data);
      const listing = dmRegistryBroker.listing(plan);
      const inputKeys = Object.keys(parseResult.data).map((key) =>
        recipeInputKeyContract.parse(key),
      );
      return {
        runs: listing.runs,
        makes: listing.makes,
        inputKeys,
      };
    },
    execute: async ({ params, target }) => {
      const parsedParams = sessionWithNestedChainInputsContract.safeParse(params ?? {});
      if (!parsedParams.success) {
        throw new Error(
          `recipesSeedRunBroker: recipe 'session-with-nested-chain' refused params — ${parsedParams.error.message} — this recipe takes: ${Object.keys(sessionWithNestedChainInputsContract.shape).join(', ')}`,
        );
      }
      return dmRegistryBroker.run(recipesSessionWithNestedChainBroker(parsedParams.data), target);
    },
  },
  {
    recipeName: recipeNameContract.parse(recipesGuildActiveSuiteBroker.recipeName),
    description: recipesGuildActiveSuiteBroker.description,
    probeListing: () => {
      const plan = recipesGuildActiveSuiteBroker();
      const listing = dmRegistryBroker.listing(plan);
      return {
        runs: listing.runs,
        makes: listing.makes,
        inputKeys: [],
      };
    },
    execute: async ({ params, target }) => {
      const suppliedKeys = Object.keys(params ?? {});
      if (suppliedKeys.length > 0) {
        throw new Error(
          `recipesSeedRunBroker: recipe 'guild-active-suite' takes no params, got: ${suppliedKeys.join(', ')}`,
        );
      }
      return dmRegistryBroker.run(recipesGuildActiveSuiteBroker(), target);
    },
  },
];

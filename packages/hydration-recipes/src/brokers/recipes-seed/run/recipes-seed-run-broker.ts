/**
 * PURPOSE: The `seed` step's whole implementation — resolves a recipe by name off this repo's own
 * three, refuses one that does not exist, validates `params` through THAT recipe's own `inputs`
 * schema (siegelense itself may import neither `@dungeonmaster/hydration` nor this package, so it
 * cannot hold that schema — `siegelense-recipes.md`'s `seed` section is why the check splits in
 * two), then runs the built plan through `dmRegistryBroker` — never a fresh
 * `recipesHydrationCreateBroker()` call, which would see an empty registered-ingredient list and
 * fail every route as `needs a server`.
 *
 * A seed runs in the CLI's own driver process, which inherits the OPERATOR's environment, not the
 * lane's — only the lane's spawned api process is ever handed `DUNGEONMASTER_HOME`
 * (`instance-start-broker.ts`'s driver spawn carries a snapshot of the caller's own `process.env`).
 * `guildWriteRouteBroker` and `operationWriteRouteBroker` both resolve their home off that GLOBAL
 * variable rather than off the `target` a route was handed (`packages/siegelense-recipes/CLAUDE.md`),
 * so this broker points it at `home` for the run's duration and restores it in a `finally` —
 * otherwise a seed registers a guild into whatever `~/.dungeonmaster` the operator's shell had while
 * the quest files this same plan writes land under `home`, and the next step cannot find them.
 *
 * USAGE:
 * const ids = await recipesSeedRunBroker({ recipeName: 'guild-mid-execution', home: '/tmp/lane-1' });
 * // Returns { guild: {...}, quest1: {...}, quest2: {...}, quest3: {...} }
 */
import type { HydrationRunResult } from '@dungeonmaster/hydration/contracts';

import { dmTargetContract } from '../../../contracts/dm-target/dm-target-contract';
import { questAdvancesOneStepInputsContract } from '../../../contracts/quest-advances-one-step-inputs/quest-advances-one-step-inputs-contract';
import { sessionWithNestedChainInputsContract } from '../../../contracts/session-with-nested-chain-inputs/session-with-nested-chain-inputs-contract';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { guildMidExecutionRecipeBroker } from '../../guild-mid-execution/recipe/guild-mid-execution-recipe-broker';
import { questAdvancesOneStepRecipeBroker } from '../../quest-advances-one-step/recipe/quest-advances-one-step-recipe-broker';
import { sessionWithNestedChainRecipeBroker } from '../../session-with-nested-chain/recipe/session-with-nested-chain-recipe-broker';

const DUNGEONMASTER_HOME_ENV_VAR = 'DUNGEONMASTER_HOME';

const KNOWN_RECIPE_NAMES = [
  guildMidExecutionRecipeBroker.recipeName,
  questAdvancesOneStepRecipeBroker.recipeName,
  sessionWithNestedChainRecipeBroker.recipeName,
];

export const recipesSeedRunBroker = async ({
  recipeName,
  params,
  home,
  baseUrl,
}: {
  recipeName: string;
  params?: Record<string, unknown> | null;
  home: string;
  baseUrl?: string;
}): Promise<HydrationRunResult> => {
  const target = dmTargetContract.parse(
    baseUrl === undefined ? { home, claudeHome: home } : { home, claudeHome: home, baseUrl },
  );

  const previousDungeonmasterHome = process.env[DUNGEONMASTER_HOME_ENV_VAR];
  process.env[DUNGEONMASTER_HOME_ENV_VAR] = target.home;

  try {
    if (recipeName === guildMidExecutionRecipeBroker.recipeName) {
      const suppliedKeys = Object.keys(params ?? {});
      if (suppliedKeys.length > 0) {
        throw new Error(
          `recipesSeedRunBroker: recipe '${recipeName}' takes no params, got: ${suppliedKeys.join(', ')}`,
        );
      }
      return await dmRegistryBroker.run(guildMidExecutionRecipeBroker(), target);
    }

    if (recipeName === questAdvancesOneStepRecipeBroker.recipeName) {
      const parsedParams = questAdvancesOneStepInputsContract.safeParse(params ?? {});
      if (!parsedParams.success) {
        throw new Error(
          `recipesSeedRunBroker: recipe '${recipeName}' refused params — ${parsedParams.error.message} — this recipe takes: ${Object.keys(questAdvancesOneStepInputsContract.shape).join(', ')}`,
        );
      }
      return await dmRegistryBroker.run(
        questAdvancesOneStepRecipeBroker(parsedParams.data),
        target,
      );
    }

    if (recipeName === sessionWithNestedChainRecipeBroker.recipeName) {
      const parsedParams = sessionWithNestedChainInputsContract.safeParse(params ?? {});
      if (!parsedParams.success) {
        throw new Error(
          `recipesSeedRunBroker: recipe '${recipeName}' refused params — ${parsedParams.error.message} — this recipe takes: ${Object.keys(sessionWithNestedChainInputsContract.shape).join(', ')}`,
        );
      }
      return await dmRegistryBroker.run(
        sessionWithNestedChainRecipeBroker(parsedParams.data),
        target,
      );
    }

    throw new Error(
      `recipesSeedRunBroker: unknown recipe '${recipeName}' — known recipes: ${KNOWN_RECIPE_NAMES.join(', ')}`,
    );
  } finally {
    if (previousDungeonmasterHome === undefined) {
      Reflect.deleteProperty(process.env, DUNGEONMASTER_HOME_ENV_VAR);
    } else {
      process.env[DUNGEONMASTER_HOME_ENV_VAR] = previousDungeonmasterHome;
    }
  }
};

/**
 * PURPOSE: The `seed` step's whole implementation — resolves a recipe by name dynamically off
 * the recipe catalog, validates `params` through that recipe's own execution logic, and runs the
 * plan while managing the DUNGEONMASTER_HOME environment variable.
 *
 * USAGE:
 * const ids = await recipesSeedRunBroker({ recipeName: 'guild-mid-execution', home: '/tmp/lane-1' });
 * // Returns { guild: {...}, quest1: {...}, quest2: {...}, quest3: {...} }
 */

import type { HydrationRunResult } from '@dungeonmaster/hydration/contracts';

import { dmTargetContract } from '../../../contracts/dm-target/dm-target-contract';
import { recipesCatalogBroker } from '../../recipes/catalog/recipes-catalog-broker';

const DUNGEONMASTER_HOME_ENV_VAR = 'DUNGEONMASTER_HOME';

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

  const catalog = recipesCatalogBroker();
  const entry = catalog.find((candidate) => candidate.recipeName === recipeName);

  if (entry === undefined) {
    const knownNames = catalog.map((candidate) => candidate.recipeName);
    throw new Error(
      `recipesSeedRunBroker: unknown recipe '${recipeName}' — known recipes: ${knownNames.join(', ')}`,
    );
  }

  const previousDungeonmasterHome = process.env[DUNGEONMASTER_HOME_ENV_VAR];
  process.env[DUNGEONMASTER_HOME_ENV_VAR] = target.home;

  try {
    return await entry.execute(params === undefined ? { target } : { params, target });
  } finally {
    if (previousDungeonmasterHome === undefined) {
      Reflect.deleteProperty(process.env, DUNGEONMASTER_HOME_ENV_VAR);
    } else {
      process.env[DUNGEONMASTER_HOME_ENV_VAR] = previousDungeonmasterHome;
    }
  }
};

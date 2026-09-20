/**
 * PURPOSE: Responds to recipe seed requests by delegating to recipesSeedRunBroker. Reach for
 * this over directly calling recipesSeedRunBroker when invoking recipe execution from outer layers
 * or public responder barrels.
 *
 * USAGE:
 * const result = await RecipesSeedResponder({ recipeName: 'guild-mid-execution', home: '/tmp/test' });
 * // Returns HydrationRunResult
 */

import type { HydrationRunResult } from '@dungeonmaster/hydration/contracts';

import { recipesSeedRunBroker } from '../../../brokers/recipes-seed/run/recipes-seed-run-broker';

type SeedParams = Parameters<typeof recipesSeedRunBroker>[0];

export const RecipesSeedResponder = async ({
  recipeName,
  params,
  home,
  baseUrl,
}: SeedParams): Promise<HydrationRunResult> =>
  recipesSeedRunBroker({
    recipeName,
    home,
    ...(params !== undefined && { params }),
    ...(baseUrl !== undefined && { baseUrl }),
  });

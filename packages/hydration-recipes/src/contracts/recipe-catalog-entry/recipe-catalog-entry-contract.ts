/**
 * PURPOSE: Defines the catalog entry structure for hydration recipes, describing their
 * metadata, probe listing function, and execution logic. Reach for this over raw recipe definitions
 * when registering recipes in the central catalog for dynamic listing and execution.
 *
 * USAGE:
 * recipeCatalogEntryContract.parse({
 *   recipeName: 'guild-with-three-quests',
 *   description: 'one guild holding three quests',
 * });
 * // Returns RecipeCatalogEntryData
 */

import { z } from 'zod';
import { recipeNameContract } from '@dungeonmaster/hydration/contracts';
import type {
  HydrationRunResult,
  PlanMakesEntry,
  PlanRunsResult,
} from '@dungeonmaster/hydration/contracts';
import type { DmTarget } from '../dm-target/dm-target-contract';

import type { RecipeInputKey } from '../recipe-input-key/recipe-input-key-contract';

const recipeDescriptionContract = z.string().min(1).brand<'RecipeDescription'>();

export type RecipeDescription = z.infer<typeof recipeDescriptionContract>;

export const recipeCatalogEntryContract = z.object({
  recipeName: recipeNameContract,
  description: recipeDescriptionContract,
});

export type RecipeCatalogEntryData = z.infer<typeof recipeCatalogEntryContract>;

export type RecipeCatalogEntry = RecipeCatalogEntryData & {
  inputs?: z.ZodTypeAny | undefined;
  probeListing: () => {
    runs: PlanRunsResult;
    makes: readonly PlanMakesEntry[];
    inputKeys: readonly RecipeInputKey[];
  };
  execute: (args: {
    params?: Record<string, unknown> | null;
    target: DmTarget;
  }) => Promise<HydrationRunResult>;
};

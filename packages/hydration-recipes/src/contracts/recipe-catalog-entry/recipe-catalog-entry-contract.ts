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

import { z } from '#gateway/npm/zod';
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

// The schema itself, not its shape — `z.custom` with no type argument hands the same reference
// back rather than expanding a `ZodTypeAny`'s own methods through `StubArgument`.
const zodSchemaContract = z.custom((value) => value instanceof z.ZodType, {
  message: 'Expected a zod schema',
});

export const recipeCatalogEntryContract = z.object({
  recipeName: recipeNameContract,
  description: recipeDescriptionContract,
  inputs: zodSchemaContract.optional(),
});

export type RecipeCatalogEntryData = z.infer<typeof recipeCatalogEntryContract>;

export type RecipeCatalogEntry = RecipeCatalogEntryData & {
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

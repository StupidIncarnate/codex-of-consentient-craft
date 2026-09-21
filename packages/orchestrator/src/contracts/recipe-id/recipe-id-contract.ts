/**
 * PURPOSE: Names the hydration recipe a plan piece is told to mirror, in the kebab-case shape a
 * recipe book uses. Reach for this over `pieceIdContract` — that one addresses a piece INSIDE a
 * single plan file and is free-form because a planner types it by hand, where this one is a lookup
 * key into a durable, repo-wide book and is therefore shaped.
 *
 * USAGE:
 * recipeIdContract.parse('session-with-nested-chain');
 * // Returns a branded RecipeId
 *
 * A DELIBERATE PARALLEL DECLARATION of `recipeNameContract`
 * (`packages/hydration-recipes/src/contracts/recipe-name/recipe-name-contract.ts`), not a second
 * source of truth for what a real recipe book entry looks like: `packages/orchestrator/package.json`
 * depends on exactly `@dungeonmaster/config`, `@dungeonmaster/shared` and `zod`, so that contract
 * cannot be imported here.
 */

import { z } from 'zod';

export const recipeIdContract = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u)
  .brand<'RecipeId'>();

export type RecipeId = z.infer<typeof recipeIdContract>;

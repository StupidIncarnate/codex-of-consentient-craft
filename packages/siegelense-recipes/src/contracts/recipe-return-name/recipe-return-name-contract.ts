/**
 * PURPOSE: One name a recipe declares under `returns` and hands back under — `guildSlug`,
 * `questId`, `sessions.nested`. Reach for this over `recipeNameContract`: that one names WHICH
 * recipe, this one names one id INSIDE a recipe's result, and the two are what a `seed` step's
 * `{binding.field}` placeholder is built from either side of the dot.
 *
 * A dot is legal, because a return name is also a PATH into the rendered result — the book declares
 * `sessions.nested` and the spec's own worked batch reads it back as `{s.sessions.nested}`
 * (siegelense-tooling.md line 2922). A leading, trailing or doubled dot is not: each would name a
 * segment with no name, and `seedResultRenderTransformer` would expand it into a key nothing can
 * address.
 *
 * USAGE:
 * recipeReturnNameContract.parse('sessions.nested');
 * // Returns a branded RecipeReturnName
 */

import { z } from 'zod';

export const recipeReturnNameContract = z
  .string()
  .regex(
    /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/u,
    'A recipe return name is one or more dot-separated identifier segments, such as "guildSlug" or "sessions.nested"',
  )
  .brand<'RecipeReturnName'>();

export type RecipeReturnName = z.infer<typeof recipeReturnNameContract>;

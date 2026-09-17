/**
 * PURPOSE: What `dungeonmaster siegelense recipes`'s argv parses into. The call takes no input of
 * its own — it lists every recipe, always — so `human` is the only field: the listing is one of the
 * calls that ships a renderer, and `--human` picks the reading table over the JSON default. Reach
 * for this over `StatusArgs` or `CleanupArgs` purely for the call it belongs to; the three are
 * separate shapes so a flag added to one never silently becomes legal on another.
 *
 * USAGE:
 * recipesArgsContract.parse({ human: false });
 * // Returns a validated RecipesArgs
 */

import { z } from 'zod';

export const recipesArgsContract = z
  .object({
    human: z.boolean(),
  })
  .strict();

export type RecipesArgs = z.infer<typeof recipesArgsContract>;

/**
 * PURPOSE: What `dungeonmaster siegelense recipes`'s argv parses into — `human` is the ONLY field,
 * because `recipes` takes no instance: it lists what states CAN be created, not what one running
 * instance is doing (siegelense-recipes.md's "The calls this document uses" section, "No instance
 * needed"). `human` names which of the two renderers (`recipesAnswerRenderTransformer` or the JSON
 * default) the responder reaches for.
 * Reach for this over `z.object({})` directly: a bare empty object gives a reader nothing to name
 * when the parser rejects every other flag.
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

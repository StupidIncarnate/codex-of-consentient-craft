/**
 * PURPOSE: One entry in `flow.recipes[]` — a seed recipe a planner proved for this flow, and
 * the run that proved it. The field is named `id`, not `name`, on purpose: `flow.recipes[]` is
 * an ID-BEARING ARRAY exactly like `flow.offMapSignoffs[]` — `questItemDeepMergeTransformer`
 * recurses only into arrays whose items carry a literal `id` field, replacing anything else
 * WHOLESALE on every write, and a recipe's name is already its unique key in the recipe book,
 * so reusing it as `id` is the same move `flowOffMapSignoffContract` makes reusing the family as
 * its own `id`. `instanceId` + `runId`, not a bare run id: a run id alone is not resolvable — it
 * is scoped to the instance whose timeline it numbers — the SAME pair `quest-note-contract`'s
 * `walked` note already carries for the identical "which run proved this claim" citation.
 *
 * USAGE:
 * flowRecipeContract.parse({id: 'pc-walk-1', instanceId: 'inst_7f3a9c21', runId: 'run_2'});
 * // Returns: FlowRecipe
 */

import { z } from '#gateway/npm/zod';

import { siegeInstanceContract } from '../siege-instance/siege-instance-contract';
import { siegeRunContract } from '../siege-run/siege-run-contract';

export const flowRecipeContract = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, 'Recipe name must be kebab-case …').brand<'FlowRecipeId'>(),
  instanceId: siegeInstanceContract.shape.id,
  runId: siegeRunContract.shape.id,
});

export type FlowRecipe = z.infer<typeof flowRecipeContract>;

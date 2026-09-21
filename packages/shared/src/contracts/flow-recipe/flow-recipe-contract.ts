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

import { z } from 'zod';

import { flowRecipeNameContract } from '../flow-recipe-name/flow-recipe-name-contract';
import { siegeInstanceIdContract } from '../siege-instance-id/siege-instance-id-contract';
import { siegeRunIdContract } from '../siege-run-id/siege-run-id-contract';

export const flowRecipeContract = z.object({
  id: flowRecipeNameContract,
  instanceId: siegeInstanceIdContract,
  runId: siegeRunIdContract,
});

export type FlowRecipe = z.infer<typeof flowRecipeContract>;

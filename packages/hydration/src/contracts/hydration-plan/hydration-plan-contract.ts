/**
 * PURPOSE: What a recipe returns — its name and its ops, as data nothing has run. Reach for this
 * over a hand-written summary anywhere: the `recipes {}` listing prints this object, so there is
 * nothing for a description to drift from.
 *
 * USAGE:
 * hydrationPlanContract.parse({ recipeName: 'guild-mid-execution', ops: [] });
 * // Returns HydrationPlan
 */
import { z } from 'zod';
import { recipeNameContract } from '../recipe-name/recipe-name-contract';
import { hydrationOpContract } from '../hydration-op/hydration-op-contract';

export const hydrationPlanContract = z.object({
  recipeName: recipeNameContract,
  ops: z.array(hydrationOpContract),
});

export type HydrationPlan = z.infer<typeof hydrationPlanContract>;

/**
 * `run`'s return type, carried as a phantom property so the object stays printable data rather
 * than becoming a call. `TOut` stays `Record<string, unknown>` through chunks 1–3 — threading the
 * names `saveRecordAs` saves through this type is chunk 3b's own scheduled pass.
 */
export type Plan<TOut = Record<string, unknown>> = HydrationPlan & { readonly __out?: TOut };

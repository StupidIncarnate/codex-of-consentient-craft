/**
 * PURPOSE: What `planRunsTransformer` answers about a plan's route requirement — either every
 * ingredient the plan creates declares a `write` route, or the name of the first one that does
 * not. Reach for this over a boolean or a list of routes: the honest line the listing prints is
 * one of exactly two shapes, `runs serverless` or the ingredient that blocks it — never a count,
 * and never a union of routes that merely appear somewhere in the plan.
 *
 * USAGE:
 * planRunsResultContract.parse({ serverless: true });
 * planRunsResultContract.parse({ serverless: false, needsServerFor: 'guild' });
 * // Returns PlanRunsResult
 */
import { z } from 'zod';
import { ingredientNameContract } from '../ingredient-name/ingredient-name-contract';

export const planRunsResultContract = z.discriminatedUnion('serverless', [
  z.object({ serverless: z.literal(true) }),
  z.object({ serverless: z.literal(false), needsServerFor: ingredientNameContract }),
]);

export type PlanRunsResult = z.infer<typeof planRunsResultContract>;

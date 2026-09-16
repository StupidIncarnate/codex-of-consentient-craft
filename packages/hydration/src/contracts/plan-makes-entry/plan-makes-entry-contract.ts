/**
 * PURPOSE: One ingredient's row count as `planMakesTransformer` counts it off a plan — an exact
 * tally from its `create` ops, or `varies` wherever a `filter` reaches rows the plan cannot count
 * before it runs. Reach for this over a bare number: a plan holding a filter has no honest exact
 * count to report, and `varies` is that answer, not a placeholder for one.
 *
 * USAGE:
 * planMakesEntryContract.parse({ ingredient: 'quest', count: 3 });
 * planMakesEntryContract.parse({ ingredient: 'operation', count: 'varies' });
 * // Returns PlanMakesEntry
 */
import { z } from 'zod';
import { ingredientNameContract } from '../ingredient-name/ingredient-name-contract';

const planMakesCountContract = z.number().int().positive().brand<'PlanMakesCount'>();

export const planMakesEntryContract = z.object({
  ingredient: ingredientNameContract,
  count: z.union([planMakesCountContract, z.literal('varies')]),
});

export type PlanMakesEntry = z.infer<typeof planMakesEntryContract>;

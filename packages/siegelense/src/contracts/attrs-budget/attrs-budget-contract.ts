/**
 * PURPOSE: Defines the data `attrsBudgetTransformer` returns
 *
 * USAGE:
 * attrsBudgetContract.parse(value);
 * // Returns validated AttrsBudget
 */
import { z } from '#gateway/npm/zod';
import { attrPairContract } from '../attr-pair/attr-pair-contract';

export const attrsBudgetContract = z
  .object({
    kept: z.array(attrPairContract).readonly(),
    dropped: z.number().brand<'AttrsBudgetDropped'>(),
  })
  .brand<'AttrsBudget'>();

export type AttrsBudget = z.infer<typeof attrsBudgetContract>;

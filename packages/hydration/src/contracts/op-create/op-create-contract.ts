/**
 * PURPOSE: One node of the plan tree — a row this recipe MINTS, carrying the index it was born at,
 * the ancestor chain it hangs off, and the fields `defaults(index)` resolved for it. Reach for this
 * over `op-set` for any row that does not exist yet: every `set`, `saveRecord`, `filter` or `extra`
 * op targets a `ref` a `create` op already put on the tree.
 *
 * USAGE:
 * opCreateContract.parse({
 *   op: 'create',
 *   ingredient: 'quest',
 *   ref: 'guild[0]/quest[2]',
 *   index: 2,
 *   ancestors: ['guild[0]'],
 *   fields: { title: 'The running one' },
 * });
 * // Returns an OpCreate
 */
import { z } from 'zod';
import { ingredientNameContract } from '../ingredient-name/ingredient-name-contract';
import { rowRefContract } from '../row-ref/row-ref-contract';
import { rowIndexContract } from '../row-index/row-index-contract';
import { fieldValuesContract } from '../field-values/field-values-contract';

export const opCreateContract = z.object({
  op: z.literal('create'),
  ingredient: ingredientNameContract,
  ref: rowRefContract,
  index: rowIndexContract,
  ancestors: z.array(rowRefContract),
  fields: fieldValuesContract,
});

export type OpCreate = z.infer<typeof opCreateContract>;

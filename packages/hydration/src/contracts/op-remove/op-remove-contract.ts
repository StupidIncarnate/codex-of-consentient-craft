/**
 * PURPOSE: Deletes exactly the row `ref` names — nothing else on the plan tree, the smallest of the
 * six op kinds. Reach for this over `op-set` wherever a row is being taken OUT rather than written
 * to; `ref` here is either a row the chain resolved directly or `matchedRef`, the placeholder an
 * `op-filter` hands the nested ops it runs once per row it finds.
 *
 * USAGE:
 * opRemoveContract.parse({ op: 'remove', ref: 'guild[0:0]/quest[0:1]' });
 * // Returns an OpRemove
 */
import { z } from 'zod';
import { rowRefContract } from '../row-ref/row-ref-contract';

export const opRemoveContract = z.object({
  op: z.literal('remove'),
  ref: rowRefContract,
});

export type OpRemove = z.infer<typeof opRemoveContract>;

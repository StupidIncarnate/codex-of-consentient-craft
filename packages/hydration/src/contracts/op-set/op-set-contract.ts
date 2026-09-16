/**
 * PURPOSE: Writes values onto a row that already exists, split into `written` (plain fields) and,
 * only when the ingredient routed one of them through a walk, `transition` (the field that was
 * WALKED and the value it reached). Reach for this over `op-create` for any row a `create` op
 * already put on the tree, and reach for it even for `setRaw`'s output — `setRaw` puts the
 * transitioned field in `written` and carries no `transition` key at all, which is what keeps it
 * one op kind with two producers instead of a seventh.
 *
 * USAGE:
 * opSetContract.parse({ op: 'set', ref: 'guild[0]/quest[2]', written: { title: 'The running one' } });
 * opSetContract.parse({
 *   op: 'set',
 *   ref: 'guild[0]/quest[2]',
 *   written: {},
 *   transition: { field: 'status', to: 'in_progress' },
 * });
 * // Returns an OpSet
 */
import { z } from 'zod';
import { rowRefContract } from '../row-ref/row-ref-contract';
import { fieldNameContract } from '../field-name/field-name-contract';
import { fieldValuesContract } from '../field-values/field-values-contract';

export const opSetContract = z.object({
  op: z.literal('set'),
  ref: rowRefContract,
  written: fieldValuesContract,
  transition: z
    .object({
      field: fieldNameContract,
      to: z.unknown(),
    })
    .optional(),
});

export type OpSet = z.infer<typeof opSetContract>;

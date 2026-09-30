/**
 * PURPOSE: Writes values onto a row that already exists, split into `written` (plain fields) and,
 * only when the ingredient routed one of them through a walk, `transition` (the field that was
 * WALKED and the value it reached). Reach for this over `op-create` for any row a `create` op
 * already put on the tree, and reach for it even for `setRaw`'s output — `setRaw` puts the
 * transitioned field in `written` and carries no `transition` key at all, which is what keeps it
 * one op kind with two producers instead of a seventh.
 *
 * USAGE:
 * opSetContract.parse({ op: 'set', ref: 'guild[0:0]/quest[0:2]', written: { title: 'The running one' } });
 * opSetContract.parse({
 *   op: 'set',
 *   ref: 'guild[0:0]/quest[0:2]',
 *   written: {},
 *   transition: { field: 'status', to: 'in_progress' },
 * });
 * // Returns an OpSet
 */
import { z } from '#gateway/npm/zod';
import { fieldValuesContract } from '../field-values/field-values-contract';

export const opSetContract = z
  .object({
    op: z.literal('set'),
    ref: z.string().min(1).brand<'OpSetRef'>(),
    written: fieldValuesContract,
    transition: z
      .object({
        field: z.string().min(1).brand<'OpSetTransitionField'>(),
        to: z.json(),
      })
      .brand<'OpSetTransition'>()
      .optional(),
  })
  .brand<'OpSet'>();

export type OpSet = z.infer<typeof opSetContract>;

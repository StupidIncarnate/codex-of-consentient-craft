/**
 * PURPOSE: One node of the plan tree — a row this recipe BRINGS INTO SCOPE rather than mints,
 * addressed by a `where` match the ingredient's own `query` route resolves at RUN time. Reach for
 * this over `op-create` whenever the row already exists — created by an EARLIER, separate `run()`,
 * or simply not this plan's to make — and a later op still needs to reference it by a real `ref`,
 * chain a child collection off it, or call one of its extras. `ancestors` is carried for the same
 * reason `op-create` carries it (a link-value fill for whatever this op's own builder mints
 * underneath it), never to fill THIS op's own fields — the matched row already has its real ones.
 *
 * USAGE:
 * opAttachContract.parse({
 *   op: 'attach',
 *   ingredient: 'quest',
 *   ref: 'quest[0:0]',
 *   ancestors: [],
 *   where: { id: '00000000-0000-4000-8000-000000000001' },
 * });
 * // Returns an OpAttach
 */
import { z } from 'zod';
import { ingredientNameContract } from '../ingredient-name/ingredient-name-contract';
import { rowRefContract } from '../row-ref/row-ref-contract';
import { fieldValuesContract } from '../field-values/field-values-contract';

export const opAttachContract = z.object({
  op: z.literal('attach'),
  ingredient: ingredientNameContract,
  ref: rowRefContract,
  ancestors: z.array(rowRefContract),
  where: fieldValuesContract,
});

export type OpAttach = z.infer<typeof opAttachContract>;

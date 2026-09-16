/**
 * PURPOSE: The one op kind whose row COUNT is unknown until the runner queries live state — every
 * other op names a `ref` the chain already resolved at build time. Carries `scope`, the immediate
 * host's own ref (absent at top level, never a top-level `filter`'s own value), so two guilds in one
 * plan cannot bleed into each other's matches, and `ops`, the nested verbs the runner replays once
 * per row `matchedRef` stands in for. Reach for this over the other five wherever a row is selected
 * by VALUE rather than named directly.
 *
 * USAGE:
 * opFilterContract.parse({
 *   op: 'filter',
 *   ingredient: 'operation',
 *   where: { role: 'riftcarver' },
 *   expect: 'one',
 *   matchedRef: 'operation[match]',
 *   ops: [{ op: 'remove', ref: 'operation[match]' }],
 * });
 * // Returns an OpFilter
 */
import { z } from 'zod';
import { ingredientNameContract } from '../ingredient-name/ingredient-name-contract';
import { rowRefContract } from '../row-ref/row-ref-contract';
import { fieldValuesContract } from '../field-values/field-values-contract';
import { filterExpectContract } from '../filter-expect/filter-expect-contract';
import { opCreateContract } from '../op-create/op-create-contract';
import type { OpCreate } from '../op-create/op-create-contract';
import { opSetContract } from '../op-set/op-set-contract';
import type { OpSet } from '../op-set/op-set-contract';
import { opRemoveContract } from '../op-remove/op-remove-contract';
import type { OpRemove } from '../op-remove/op-remove-contract';
import { opSaveRecordContract } from '../op-save-record/op-save-record-contract';
import type { OpSaveRecord } from '../op-save-record/op-save-record-contract';
import { opExtraContract } from '../op-extra/op-extra-contract';
import type { OpExtra } from '../op-extra/op-extra-contract';

const baseOpFilterContract = z.object({
  op: z.literal('filter'),
  ingredient: ingredientNameContract,
  scope: rowRefContract.optional(),
  where: fieldValuesContract,
  expect: filterExpectContract,
  matchedRef: rowRefContract,
});

/**
 * `hydrationOpContract` (the discriminated union over all six op kinds) is declared one file group
 * later than this one and cannot be imported here without a real import cycle. This union names the
 * same six branches by hand so `filter`'s own nested ops validate identically to that later union —
 * see this package's `hydration-op-contract.ts` once it lands.
 */
export type OpFilterNestedOp = OpCreate | OpSet | OpRemove | OpSaveRecord | OpExtra | OpFilter;

export type OpFilter = z.infer<typeof baseOpFilterContract> & {
  ops: readonly OpFilterNestedOp[];
};

type OpFilterInput = z.input<typeof baseOpFilterContract> & {
  ops: readonly OpFilterNestedOp[];
};

export const opFilterContract: z.ZodType<OpFilter, z.ZodTypeDef, OpFilterInput> =
  baseOpFilterContract.extend({
    // z.discriminatedUnion demands every branch stay a ZodObject; the cast below already widens
    // this contract's own type to a plain ZodType, which a discriminated union's own type rejects
    // as a branch. z.union has no such constraint and validates the identical six shapes.
    ops: z.lazy(() =>
      z.array(
        z.union([
          opCreateContract,
          opSetContract,
          opRemoveContract,
          opSaveRecordContract,
          opExtraContract,
          opFilterContract,
        ]),
      ),
    ),
  }) as unknown as z.ZodType<OpFilter, z.ZodTypeDef, OpFilterInput>;

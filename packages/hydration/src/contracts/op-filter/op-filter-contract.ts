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
 * `hydrationOpContract` (the union over every op kind) is declared one file group later than this
 * one and cannot be imported here without a real import cycle — see this package's
 * `hydration-op-contract.ts`. So the getter below names the same six branches by hand, and this
 * local type is the only place their union is spelled out (no separate exported alias beside it).
 */
type OpFilterSelf = z.infer<typeof baseOpFilterContract> & {
  ops: readonly (OpCreate | OpSet | OpRemove | OpSaveRecord | OpExtra | OpFilterSelf)[];
};

// A getter, not `z.lazy` + a cast — the getter's return type wraps `z.core.$ZodType`, which is
// the only self-reference form `contracts/` allows (zod v4 dropped the old `z.ZodTypeDef` type
// param `z.lazy` needed here). z.discriminatedUnion demands every branch stay a ZodObject, which a
// self-referencing branch cannot; z.union has no such constraint and validates the identical shapes.
export const opFilterContract = z.object({
  ...baseOpFilterContract.shape,
  get ops(): z.ZodReadonly<
    z.ZodArray<
      z.ZodUnion<
        readonly [
          typeof opCreateContract,
          typeof opSetContract,
          typeof opRemoveContract,
          typeof opSaveRecordContract,
          typeof opExtraContract,
          z.core.$ZodType<OpFilterSelf>,
        ]
      >
    >
  > {
    return z
      .array(
        z.union([
          opCreateContract,
          opSetContract,
          opRemoveContract,
          opSaveRecordContract,
          opExtraContract,
          opFilterContract,
        ]),
      )
      .readonly();
  },
});

export type OpFilter = z.infer<typeof opFilterContract>;

// Derived from the getter above, not a second hand-written union — a caller that narrows one
// nested op at a time (`op-filter-transformer.ts`, `op-filter-apply-layer-broker.ts`) names this
// rather than repeating the six branches.
export type OpFilterNestedOp = OpFilter['ops'][number];

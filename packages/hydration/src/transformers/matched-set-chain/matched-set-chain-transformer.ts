/**
 * PURPOSE: Builds what `filter` hands back — the row verbs and this ingredient's extras, over a set
 * whose size nothing knows yet. Every verb call wraps its own op in a FRESH `opFilterTransformer`
 * call sharing the same ingredient/scope/where/expect, so two verbs called off the same matched set
 * (or two separate `filter()` calls sharing an ingredient and a scope) become sibling filter nodes
 * with the identical `matchedRef` rather than one node mutated after the fact — a filter's nested ops
 * are a subtree hanging off its own node, and nothing here resolves a reference globally. `matchedRef`
 * is derived through `matchedRefTransformer`, never `rowRefTransformer`: this set has no `CallIndex`
 * and no `RowIndex` to offer, only a scope and an ingredient, so its placeholder's slot is the fixed
 * match word — never a digit pair a real `add`-created row could also produce. Reach for
 * `collectionChainTransformer` instead wherever the count IS known at build time; this one
 * deliberately has no index and no `add`.
 *
 * USAGE:
 * matchedSetChainTransformer({
 *   ingredientConfig: operationIngredientConfig,
 *   ingredient: 'operation',
 *   scope: 'guild[0:0]/quest[0:0]',
 *   where: { role: 'riftcarver' },
 *   expect: 'one',
 * });
 * // Returns a Matched<Operation> whose .remove() etc. each build one filter op
 */
import { fieldValuesContract } from '../../contracts/field-values/field-values-contract';
import type { IngredientName } from '../../contracts/ingredient-name/ingredient-name-contract';
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';
import type { FilterExpect } from '../../contracts/filter-expect/filter-expect-contract';
import { matchedSetContract } from '../../contracts/matched-set/matched-set-contract';
import type { Matched } from '../../contracts/matched-set/matched-set-contract';
import type { Op } from '../../contracts/ingredient-handle/ingredient-handle-contract';
import type { IngredientConfigData } from '../../contracts/ingredient-config/ingredient-config-contract';
import { savedRecordNameContract } from '../../contracts/saved-record-name/saved-record-name-contract';
import { extraVerbNameContract } from '../../contracts/extra-verb-name/extra-verb-name-contract';
import { matchedRefTransformer } from '../matched-ref/matched-ref-transformer';
import { opSetTransformer } from '../op-set/op-set-transformer';
import { opSetRawTransformer } from '../op-set-raw/op-set-raw-transformer';
import { opRemoveTransformer } from '../op-remove/op-remove-transformer';
import { opSaveRecordTransformer } from '../op-save-record/op-save-record-transformer';
import { opExtraTransformer } from '../op-extra/op-extra-transformer';
import { opFilterTransformer } from '../op-filter/op-filter-transformer';

export const matchedSetChainTransformer = <I>({
  ingredientConfig,
  ingredient,
  scope,
  where,
  expect: filterExpect,
}: {
  ingredientConfig: IngredientConfigData;
  ingredient: IngredientName;
  scope?: RowRef;
  where: Record<string, unknown>;
  expect?: FilterExpect;
}): Matched<I> => {
  const parsedWhere = fieldValuesContract.parse(where);
  const matchedRef = matchedRefTransformer({
    ancestors: scope === undefined ? [] : [scope],
    ingredient,
  });
  const identity = matchedSetContract.parse({ ingredient, matchedRef });
  const filterArgs = {
    ingredient,
    ...(scope === undefined ? {} : { scope }),
    where: parsedWhere,
    ...(filterExpect === undefined ? {} : { expect: filterExpect }),
  };

  const extraEntries = Object.entries(ingredientConfig.extras ?? {}).map(([verb]) => [
    verb,
    (args: Record<string, unknown>): Op =>
      [
        opFilterTransformer({
          ...filterArgs,
          ops: [
            opExtraTransformer({
              ref: matchedRef,
              verb: extraVerbNameContract.parse(verb),
              args: fieldValuesContract.parse(args),
            }),
          ],
        }),
      ] as unknown as Op,
  ]);

  return {
    ...identity,
    set: (values: Record<string, unknown>): Op =>
      [
        opFilterTransformer({
          ...filterArgs,
          ops: [
            opSetTransformer({
              ref: matchedRef,
              values: fieldValuesContract.parse(values),
              ...(ingredientConfig.transitions === undefined
                ? {}
                : { transitions: ingredientConfig.transitions }),
            }),
          ],
        }),
      ] as unknown as Op,
    setRaw: (values: Record<string, unknown>): Op =>
      [
        opFilterTransformer({
          ...filterArgs,
          ops: [
            opSetRawTransformer({ ref: matchedRef, values: fieldValuesContract.parse(values) }),
          ],
        }),
      ] as unknown as Op,
    saveRecordAs: ({ name }: { name: string }): Op =>
      [
        opFilterTransformer({
          ...filterArgs,
          ops: [
            opSaveRecordTransformer({ ref: matchedRef, name: savedRecordNameContract.parse(name) }),
          ],
        }),
      ] as unknown as Op,
    remove: (): Op =>
      [
        opFilterTransformer({
          ...filterArgs,
          ops: [opRemoveTransformer({ ref: matchedRef })],
        }),
      ] as unknown as Op,
    ...Object.fromEntries(extraEntries),
  } as unknown as Matched<I>;
};

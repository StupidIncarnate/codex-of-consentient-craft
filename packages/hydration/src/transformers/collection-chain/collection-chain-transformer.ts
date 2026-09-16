/**
 * PURPOSE: Builds a set of rows you may still `add` to — the object a registry accessor and a child
 * accessor both are. Each `add` call draws the NEXT `CallIndex` off this one collection instance, in
 * the order those calls run, and folds it into every row that call mints — the axis that keeps two
 * sibling `add` calls, or one top-level ingredient added twice, from minting the same reference. A
 * fresh collection instance (a fresh `entryChainTransformer`, a fresh child hanging off a fresh row)
 * starts that counter back at 0, which is what keeps it from surviving between separate builds. `add`
 * mints `count` rows, hands the builder a tuple of their handles plus `all` as a second argument
 * (never a property beside the tuple — that silently loses the out-of-bounds check `add(3, …)`
 * needs), and flattens whatever the builder returns onto the fresh `create` ops. `filter` hands off
 * to `matchedSetChainTransformer` for a set whose size is a run-time fact and needs no `CallIndex`
 * of its own; `under` rebinds a link that has no ancestor to draw from. Reach for
 * `entryChainTransformer` at the top level instead; a collection below that always arrives through a
 * handle's own child accessor.
 *
 * USAGE:
 * collectionChainTransformer({
 *   registry, ingredientConfig: questIngredientConfig, ancestors: ['guild[0:0]'], ancestorNames: ['guild'],
 * }).add(3, (q, all) => [all.set({ userRequest: 'seeded' }), q[0].set({ title: 'first' })]);
 * // Returns one Op standing in for three create ops plus the four set ops the builder returned
 */
import { hydrationCollectionContract } from '../../contracts/hydration-collection/hydration-collection-contract';
import type {
  Collection,
  Handles,
} from '../../contracts/hydration-collection/hydration-collection-contract';
import type {
  Registry,
  AnyIngredient,
  IngredientConfigData,
} from '../../contracts/ingredient-config/ingredient-config-contract';
import type { Handle, Op } from '../../contracts/ingredient-handle/ingredient-handle-contract';
import type { Matched } from '../../contracts/matched-set/matched-set-contract';
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';
import type { IngredientName } from '../../contracts/ingredient-name/ingredient-name-contract';
import { fieldValuesContract } from '../../contracts/field-values/field-values-contract';
import type { FilterExpect } from '../../contracts/filter-expect/filter-expect-contract';
import { rowIndexContract } from '../../contracts/row-index/row-index-contract';
import { callIndexContract } from '../../contracts/call-index/call-index-contract';
import type { HydrationOp } from '../../contracts/hydration-op/hydration-op-contract';
import { savedRecordNameContract } from '../../contracts/saved-record-name/saved-record-name-contract';
import { extraVerbNameContract } from '../../contracts/extra-verb-name/extra-verb-name-contract';
import { rowRefTransformer } from '../row-ref/row-ref-transformer';
import { opCreateTransformer } from '../op-create/op-create-transformer';
import { opSetTransformer } from '../op-set/op-set-transformer';
import { opSetRawTransformer } from '../op-set-raw/op-set-raw-transformer';
import { opRemoveTransformer } from '../op-remove/op-remove-transformer';
import { opSaveRecordTransformer } from '../op-save-record/op-save-record-transformer';
import { opExtraTransformer } from '../op-extra/op-extra-transformer';
import { rowHandleChainTransformer } from '../row-handle-chain/row-handle-chain-transformer';
import { matchedSetChainTransformer } from '../matched-set-chain/matched-set-chain-transformer';

export const collectionChainTransformer = <
  I,
  R extends Registry = Registry,
  Anc extends AnyIngredient[] = [],
>({
  registry,
  ingredientConfig,
  ancestors,
  ancestorNames,
  under: underValues,
}: {
  registry: R;
  ingredientConfig: IngredientConfigData;
  ancestors: readonly RowRef[];
  ancestorNames: readonly IngredientName[];
  under?: Record<string, unknown>;
}): Collection<R, I, Anc> => {
  const identity = hydrationCollectionContract.parse({ ingredient: ingredientConfig.name });
  const scope = ancestors.length === 0 ? undefined : ancestors[ancestors.length - 1];
  let nextCallIndex = 0;

  return {
    ...identity,
    add: <N extends number>(
      count: N,
      build: (rows: Handles<R, I, N, Anc>, all: Handle<R, I, Anc>) => Op[],
    ): Op => {
      const callIndex = callIndexContract.parse(nextCallIndex);
      nextCallIndex += 1;

      const refs = Array.from({ length: count }, (_unused, index) =>
        rowRefTransformer({
          ancestors,
          ingredient: ingredientConfig.name,
          callIndex,
          index: rowIndexContract.parse(index),
        }),
      );

      const createOps = refs.map((_unusedRef, index) =>
        opCreateTransformer({
          ingredient: ingredientConfig.name,
          callIndex,
          index: rowIndexContract.parse(index),
          ancestors,
          fields: fieldValuesContract.parse({
            ...(underValues ?? {}),
            ...(ingredientConfig.defaults?.(index) ?? {}),
          }),
        }),
      );

      const rows = refs.map((ref) =>
        rowHandleChainTransformer<I, R, Anc>({
          registry,
          ingredientConfig,
          ref,
          ancestors,
          ancestorNames,
        }),
      );

      const extraEntries = Object.entries(ingredientConfig.extras ?? {}).map(([verb]) => [
        verb,
        (args: Record<string, unknown>): Op =>
          refs.map((ref) =>
            opExtraTransformer({
              ref,
              verb: extraVerbNameContract.parse(verb),
              args: fieldValuesContract.parse(args),
            }),
          ) as unknown as Op,
      ]);

      const all = {
        ingredient: ingredientConfig.name,
        set: (values: Record<string, unknown>): Op =>
          refs.map((ref) =>
            opSetTransformer({
              ref,
              values: fieldValuesContract.parse(values),
              ...(ingredientConfig.transitions === undefined
                ? {}
                : { transitions: ingredientConfig.transitions }),
            }),
          ) as unknown as Op,
        setRaw: (values: Record<string, unknown>): Op =>
          refs.map((ref) =>
            opSetRawTransformer({ ref, values: fieldValuesContract.parse(values) }),
          ) as unknown as Op,
        saveRecordAs: ({ name }: { name: string }): Op =>
          refs.map((ref) =>
            opSaveRecordTransformer({ ref, name: savedRecordNameContract.parse(name) }),
          ) as unknown as Op,
        remove: (): Op => refs.map((ref) => opRemoveTransformer({ ref })) as unknown as Op,
        ...Object.fromEntries(extraEntries),
      } as unknown as Handle<R, I, Anc>;

      const results = build(rows as unknown as Handles<R, I, N, Anc>, all);
      const flattened = results.flatMap((op) => op as unknown as readonly HydrationOp[]);

      return [...createOps, ...flattened] as unknown as Op;
    },
    filter: (args: { where: Record<string, unknown>; expect?: FilterExpect }): Matched<I> =>
      matchedSetChainTransformer<I>({
        ingredientConfig,
        ingredient: ingredientConfig.name,
        ...(scope === undefined ? {} : { scope }),
        where: args.where,
        ...(args.expect === undefined ? {} : { expect: args.expect }),
      }),
    under: (ids: Record<string, unknown>): Collection<R, I, Anc> =>
      collectionChainTransformer<I, R, Anc>({
        registry,
        ingredientConfig,
        ancestors,
        ancestorNames,
        under: fieldValuesContract.parse({ ...(underValues ?? {}), ...ids }),
      }),
  } as unknown as Collection<R, I, Anc>;
};

/**
 * PURPOSE: Builds a set of rows you may still `add` to — the object a registry accessor and a child
 * accessor both are. Each `add` call draws the NEXT `CallIndex` off this one collection instance, in
 * the order those calls run, and folds it into every row that call mints — the axis that keeps two
 * sibling `add` calls, or one top-level ingredient added twice, from minting the same reference. A
 * TOP-LEVEL collection (the object `registry()` hands back) is built ONCE and reused by every later
 * call to whichever recipe closes over it, so a fresh JS closure never marks a fresh build the way a
 * nested child collection's does — instead, every `add` peeks `buildSequenceMarkTransformer`'s own
 * marker and resets the counter to 0 the moment that marker has moved since this collection's last
 * `add`, which is what keeps the counter from surviving between separate builds while still letting
 * two sibling `add` calls inside ONE build share the same marker and keep counting. `add` mints
 * `count` rows, hands the builder a tuple of their handles plus `all` as a second argument
 * (never a property beside the tuple — that silently loses the out-of-bounds check `add(3, …)`
 * needs), and flattens whatever the builder returns onto the fresh `create` ops. `filter` hands off
 * to `matchedSetChainTransformer` for a set whose size is a run-time fact and needs no `CallIndex`
 * of its own; `under` rebinds a link that has no ancestor to draw from, and grows the ancestor NAME
 * chain by exactly the links the supplied ids satisfy — never the ingredient's whole link set — so a
 * row minted under it exposes the same child accessors the type promises and no others. Those same
 * supplied VALUES ride along into every row `rowHandleChainTransformer` hangs off THIS row's own
 * child accessors, unchanged — a guild id supplied here is as true of a grandchild reached through
 * one of those accessors as it is of this row, and `under()`'s ids-win merge already lets a
 * descendant's own `under()` call override what rode down. Reach for `entryChainTransformer` at the
 * top level instead; a collection below that always arrives through a handle's own child accessor.
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
import type { BuildSequence } from '../../contracts/build-sequence/build-sequence-contract';
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
import { buildSequenceMarkTransformer } from '../build-sequence-mark/build-sequence-mark-transformer';

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
  let lastSeenBuildSequence: BuildSequence | null = null;

  return {
    ...identity,
    add: <N extends number>(
      count: N,
      build: (rows: Handles<R, I, N, Anc>, all: Handle<R, I, Anc>) => Op[],
    ): Op => {
      const currentBuildSequence = buildSequenceMarkTransformer({ advance: false });
      if (lastSeenBuildSequence !== currentBuildSequence) {
        lastSeenBuildSequence = currentBuildSequence;
        nextCallIndex = 0;
      }
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
          ...(underValues === undefined ? {} : { under: underValues }),
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
    under: (ids: Record<string, unknown>): Collection<R, I, Anc> => {
      const merged = fieldValuesContract.parse({ ...(underValues ?? {}), ...ids });
      // Only a link whose OWN `as` field is a key `merged` actually carries counts as satisfied —
      // matches `SuppliedAncestorNames`'s type-level rule so a row minted here exposes exactly the
      // child accessors the type promises, never more.
      const suppliedNames = (ingredientConfig.links ?? [])
        .filter((link) => Reflect.has(merged, link.as))
        .map((link) => link.of);

      return collectionChainTransformer<I, R, Anc>({
        registry,
        ingredientConfig,
        ancestors,
        ancestorNames: [...ancestorNames, ...suppliedNames],
        under: merged,
      });
    },
  } as unknown as Collection<R, I, Anc>;
};

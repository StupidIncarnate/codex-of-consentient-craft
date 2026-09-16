/**
 * PURPOSE: Builds one handle — a reference to a row this `add` will make, carrying every verb the
 * ingredient allows, that ingredient's own extras, and a child collection for every registered
 * ingredient whose links this row's own ancestry satisfies. Reach for this over a record: nothing has
 * been created when the builder runs, so only `ingredient` and `ref` exist yet — reading an id off
 * this object is not possible and must not be made so. A child accessor appears here only where BOTH
 * hold: the host (this ingredient) is named in the child's own `links`, AND every one of the child's
 * links is satisfied by something already in the ancestor chain — dropping the second condition alone
 * puts a grandchild's accessor on a grandparent, which is measured.
 *
 * USAGE:
 * rowHandleChainTransformer({
 *   registry: dmRegistry,
 *   ingredientConfig: questIngredientConfig,
 *   ref: 'guild[0:0]/quest[0:2]',
 *   ancestors: ['guild[0:0]'],
 *   ancestorNames: ['guild'],
 * });
 * // Returns a Handle whose set/setRaw/saveRecordAs/remove build ops targeting 'guild[0:0]/quest[0:2]',
 * // and whose child keys hang collections off that same ref
 */
import { ingredientHandleContract } from '../../contracts/ingredient-handle/ingredient-handle-contract';
import type { Handle, Op } from '../../contracts/ingredient-handle/ingredient-handle-contract';
import type {
  Registry,
  AnyIngredient,
  IngredientConfigData,
} from '../../contracts/ingredient-config/ingredient-config-contract';
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';
import type { IngredientName } from '../../contracts/ingredient-name/ingredient-name-contract';
import { fieldValuesContract } from '../../contracts/field-values/field-values-contract';
import { savedRecordNameContract } from '../../contracts/saved-record-name/saved-record-name-contract';
import { extraVerbNameContract } from '../../contracts/extra-verb-name/extra-verb-name-contract';
import { opSetTransformer } from '../op-set/op-set-transformer';
import { opSetRawTransformer } from '../op-set-raw/op-set-raw-transformer';
import { opRemoveTransformer } from '../op-remove/op-remove-transformer';
import { opSaveRecordTransformer } from '../op-save-record/op-save-record-transformer';
import { opExtraTransformer } from '../op-extra/op-extra-transformer';
import { collectionChainTransformer } from '../collection-chain/collection-chain-transformer';

export const rowHandleChainTransformer = <
  I,
  R extends Registry = Registry,
  Anc extends AnyIngredient[] = [],
>({
  registry,
  ingredientConfig,
  ref,
  ancestors,
  ancestorNames,
}: {
  registry: R;
  ingredientConfig: IngredientConfigData;
  ref: RowRef;
  ancestors: readonly RowRef[];
  ancestorNames: readonly IngredientName[];
}): Handle<R, I, Anc> => {
  const identity = ingredientHandleContract.parse({ ingredient: ingredientConfig.name, ref });
  const namesWithMe = [...ancestorNames, ingredientConfig.name];

  const extraEntries = Object.entries(ingredientConfig.extras ?? {}).map(([verb]) => [
    verb,
    (args: Record<string, unknown>): Op =>
      [
        opExtraTransformer({
          ref,
          verb: extraVerbNameContract.parse(verb),
          args: fieldValuesContract.parse(args),
        }),
      ] as unknown as Op,
  ]);

  const childEntries = Object.entries(registry)
    .filter(([, token]) => {
      const childConfig = token as unknown as IngredientConfigData;
      const links = childConfig.links ?? [];
      return (
        links.some((link) => link.of === ingredientConfig.name) &&
        links.every((link) => namesWithMe.includes(link.of))
      );
    })
    .map(([key, token]) => [
      key,
      collectionChainTransformer({
        registry,
        ingredientConfig: token as unknown as IngredientConfigData,
        ancestors: [...ancestors, ref],
        ancestorNames: namesWithMe,
      }),
    ]);

  return {
    ...identity,
    set: (values: Record<string, unknown>): Op =>
      [
        opSetTransformer({
          ref,
          values: fieldValuesContract.parse(values),
          ...(ingredientConfig.transitions === undefined
            ? {}
            : { transitions: ingredientConfig.transitions }),
        }),
      ] as unknown as Op,
    setRaw: (values: Record<string, unknown>): Op =>
      [opSetRawTransformer({ ref, values: fieldValuesContract.parse(values) })] as unknown as Op,
    saveRecordAs: ({ name }: { name: string }): Op =>
      [
        opSaveRecordTransformer({ ref, name: savedRecordNameContract.parse(name) }),
      ] as unknown as Op,
    remove: (): Op => [opRemoveTransformer({ ref })] as unknown as Op,
    ...Object.fromEntries(extraEntries),
    ...Object.fromEntries(childEntries),
  } as unknown as Handle<R, I, Anc>;
};

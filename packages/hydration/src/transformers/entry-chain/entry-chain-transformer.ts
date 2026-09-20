/**
 * PURPOSE: Builds the top-level accessor per registered ingredient — the object a recipe opens with.
 * Every entry starts with no ancestors and no ancestor names, since nothing has been built yet at the
 * top of a plan. Reach for `collectionChainTransformer` directly only below depth zero; a collection
 * there always arrives through a handle's own child accessor instead.
 *
 * USAGE:
 * entryChainTransformer({ registry: { guilds: guildIngredient, quests: questIngredient } });
 * // Returns { guilds: Collection<...>, quests: Collection<...> }, each starting with no ancestors
 */
import type {
  Registry,
  IngredientConfigData,
} from '../../contracts/ingredient-config/ingredient-config-contract';
import type { Entry } from '../../contracts/hydration-collection/hydration-collection-contract';
import { collectionChainTransformer } from '../collection-chain/collection-chain-transformer';

export const entryChainTransformer = <R extends Registry>({
  registry,
}: {
  registry: R;
}): Entry<R> => {
  const entries = Object.entries(registry).map(([key, ingredient]) => [
    key,
    collectionChainTransformer({
      registry,
      ingredientConfig: ingredient as unknown as IngredientConfigData,
      ancestors: [],
      ancestorNames: [],
    }),
  ]);

  return Object.fromEntries(entries) as unknown as Entry<R>;
};

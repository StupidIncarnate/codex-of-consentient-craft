/**
 * PURPOSE: Turns named ingredients into the accessors a chain opens with, and is the one place two
 * ingredients sharing a `name` is caught — the malformed declaration no type can refuse, since two
 * config objects can each carry the same string with nothing at compile time to compare them
 * against. Reach for this over an object literal of ingredients: the KEY is the accessor name a
 * chain uses, and nothing else inverts the links a child declared against its parent's NAME.
 *
 * USAGE:
 * const dm = registryCreateBroker({ guilds: guildIngredient, quests: questIngredient });
 * // Returns { guilds: Collection<...>, quests: Collection<...> }
 */
import { entryChainTransformer } from '../../../transformers/entry-chain/entry-chain-transformer';
import type { Entry } from '../../../contracts/hydration-collection/hydration-collection-contract';
import type {
  Registry,
  NameOf,
  LinkNames,
  IngredientConfigData,
} from '../../../contracts/ingredient-config/ingredient-config-contract';
import { RegistryDuplicateNameError } from '../../../errors/registry-duplicate-name/registry-duplicate-name-error';
import { RegistryDanglingLinkError } from '../../../errors/registry-dangling-link/registry-dangling-link-error';

export const registryCreateBroker = <R extends Registry>({
  ...entries
}: R &
  (LinkNames<R[keyof R]> extends NameOf<R[keyof R]>
    ? unknown
    : { LINK_NAMES_AN_UNREGISTERED_INGREDIENT: LinkNames<R[keyof R]> })): Entry<R> => {
  const configEntries = Object.entries(entries).map(
    ([key, token]) => [key, token as unknown as IngredientConfigData] as const,
  );

  const registryKeyByName = new Map<string, string>();
  configEntries.forEach(([registryKey, config]) => {
    const existingKey = registryKeyByName.get(config.name);
    if (existingKey !== undefined) {
      throw new RegistryDuplicateNameError({
        firstRegistryKey: existingKey,
        secondRegistryKey: registryKey,
        ingredientName: config.name,
      });
    }
    registryKeyByName.set(config.name, registryKey);
  });

  const registeredNames = [...registryKeyByName.keys()];
  configEntries.forEach(([, config]) => {
    (config.links ?? []).forEach((link) => {
      if (!registeredNames.includes(link.of)) {
        throw new RegistryDanglingLinkError({
          ingredientName: config.name,
          linkTarget: link.of,
          registeredNames,
        });
      }
    });
  });

  return entryChainTransformer({ registry: entries as unknown as R });
};

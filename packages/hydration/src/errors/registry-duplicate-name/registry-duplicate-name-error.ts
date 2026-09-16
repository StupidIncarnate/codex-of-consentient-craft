/**
 * PURPOSE: Refuses two ingredients sharing a `name` inside one registry — the one malformed
 * declaration no type can catch, since two config objects can each carry the same string with
 * nothing at compile time to compare them against. Reach for this over `IngredientDeclarationError`:
 * this is a fact about TWO entries relative to each other, not about either declaration in
 * isolation, so naming both registry keys is what lets a fixer find both call sites instead of
 * guessing which of two `quest` declarations is the stray one.
 *
 * USAGE:
 * throw new RegistryDuplicateNameError({
 *   firstRegistryKey: 'quests',
 *   secondRegistryKey: 'tasks',
 *   ingredientName: 'quest',
 * });
 * // Throws error naming both registry keys and the ingredient name they both declare
 *
 * WHEN-TO-USE: From `registryCreateBroker`, once two ingredients passed to `createHydration`'s
 * registry map declare the same `name`.
 * WHEN-NOT-TO-USE: When a `links.of` in one of those ingredients points at a name the registry
 * never declares at all — that is `RegistryDanglingLinkError`.
 */
export class RegistryDuplicateNameError extends Error {
  public constructor({
    firstRegistryKey,
    secondRegistryKey,
    ingredientName,
  }: {
    firstRegistryKey: string;
    secondRegistryKey: string;
    ingredientName: string;
  }) {
    super(
      `registry keys "${firstRegistryKey}" and "${secondRegistryKey}" both declare the ingredient name "${ingredientName}"`,
    );
    this.name = 'RegistryDuplicateNameError';
  }
}

/**
 * PURPOSE: Represents an error when a `seed` step's `params` carries a key the named recipe does
 * not declare — including every key, when the recipe declares none at all. siegelense holds only
 * the recipe's declared input KEYS, never its schema (`siegelense-recipes.md`'s "Three packages, and
 * what may cross between them" table — "neither of the others" — the tool may import neither
 * `@dungeonmaster/hydration` nor the recipes package), so this is the structural half of params
 * validation: a key check, not a value check. The recipe's own schema, run on the producing side,
 * is what catches a bad VALUE.
 *
 * USAGE:
 * throw new RecipeParamsRefusedError({ recipeName: 'guild-mid-execution', offendingKey: 'x', accepted: [] });
 * // Throws error naming the recipe, the key it refused, and every key that recipe does accept
 *
 * WHEN-TO-USE: From the broker validating a `seed` step's `params` keys against the recipe's
 * listing entry, once a supplied key falls outside `inputKeys` — including any key at all, when
 * `inputKeys` is empty — so a caller can `instanceof`-check it apart from an unknown recipe name.
 * WHEN-NOT-TO-USE: When every supplied key is one the recipe declares — validation proceeds and
 * never throws this. A supplied VALUE that fails the recipe's own schema is not this error either.
 */
export class RecipeParamsRefusedError extends Error {
  public constructor({
    recipeName,
    offendingKey,
    accepted,
  }: {
    recipeName: string;
    offendingKey: string;
    accepted: readonly string[];
  }) {
    const acceptedClause =
      accepted.length > 0
        ? `Accepted params: ${accepted.join(', ')}.`
        : 'This recipe takes no params.';
    super(`Recipe "${recipeName}" does not accept the param "${offendingKey}". ${acceptedClause}`);
    this.name = 'RecipeParamsRefusedError';
  }
}

/**
 * PURPOSE: Represents an error when a `seed` step's `params` shape disagrees with the named
 * recipe's declared input keys — a supplied key the recipe does not declare (`reason: 'unrecognized'`,
 * including every key, when the recipe declares none at all), or a declared key `params` never
 * supplies (`reason: 'missing'`). siegelense holds only the recipe's declared input KEYS, never its
 * schema (`siegelense-recipes.md`'s "Three packages, and what may cross between them" table —
 * "neither of the others" — the tool may import neither `@dungeonmaster/hydration` nor the recipes
 * package), so both branches are the structural half of params validation: knowable from the key
 * LIST alone, with no value in hand. The recipe's own schema, run on the producing side, is what
 * catches a bad VALUE — including a value for a key that IS present.
 *
 * USAGE:
 * throw new RecipeParamsRefusedError({ recipeName: 'guild-mid-execution', key: 'x', reason: 'unrecognized', accepted: [] });
 * throw new RecipeParamsRefusedError({ recipeName: 'session-with-nested-chain', key: 'guildPath', reason: 'missing', accepted: ['guildPath'] });
 * // Throws error naming the recipe, the key, whether it was refused or required, and every key that recipe accepts
 *
 * WHEN-TO-USE: From the broker validating a `seed` step's `params` keys against the recipe's
 * listing entry — once a supplied key falls outside `inputKeys` (`reason: 'unrecognized'`), or once
 * a key `inputKeys` declares is absent from `params` (`reason: 'missing'`) — so a caller can
 * `instanceof`-check either apart from an unknown recipe name.
 * WHEN-NOT-TO-USE: When every key `inputKeys` declares is supplied and every supplied key is one the
 * recipe declares — validation proceeds and never throws this. A supplied VALUE that fails the
 * recipe's own schema is not this error either.
 */
export class RecipeParamsRefusedError extends Error {
  public constructor({
    recipeName,
    key,
    reason,
    accepted,
  }: {
    recipeName: string;
    key: string;
    reason: 'unrecognized' | 'missing';
    accepted: readonly string[];
  }) {
    const acceptedClause =
      accepted.length > 0
        ? `Accepted params: ${accepted.join(', ')}.`
        : 'This recipe takes no params.';
    const keyClause =
      reason === 'missing'
        ? `requires the param "${key}", which was not supplied`
        : `does not accept the param "${key}"`;
    super(`Recipe "${recipeName}" ${keyClause}. ${acceptedClause}`);
    this.name = 'RecipeParamsRefusedError';
  }
}

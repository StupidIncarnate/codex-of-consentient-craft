/**
 * PURPOSE: Represents an error when a caller names a recipe by a `recipeName` the listing does
 * not hold — a `seed` step or a `recipes` lookup naming a recipe that either never existed or was
 * renamed. The known names are folded into the message so a caller sees every option on the first
 * refusal, the same shape `UnknownResultKindError` uses for its own closed vocabulary; unlike that
 * vocabulary this one can be genuinely empty, so an empty `known` says so rather than trailing off
 * after a colon.
 *
 * USAGE:
 * throw new RecipeUnknownError({ recipeName: 'nope', known: ['guild-mid-execution', 'quest-advances-one-step'] });
 * // Throws error naming the unrecognized recipe and every recipe name the listing does hold
 *
 * WHEN-TO-USE: From the broker resolving a `recipeName` against the recipes listing, once the
 * name matches none of its entries, so a caller can `instanceof`-check it apart from every other
 * recipe-resolution failure.
 * WHEN-NOT-TO-USE: When `recipeName` matches a listing entry — resolution proceeds and never
 * throws this.
 */
export class RecipeUnknownError extends Error {
  public constructor({ recipeName, known }: { recipeName: string; known: readonly string[] }) {
    const knownList = known.length > 0 ? known.join(', ') : '(none — no recipes are declared yet)';
    super(`Unknown recipe "${recipeName}". Known recipes: ${knownList}.`);
    this.name = 'RecipeUnknownError';
  }
}

/**
 * PURPOSE: Halts a plan whose route answered 2xx with a shape the ingredient's `record` contract
 * rejects, naming the field. A silently wrong record poisons every `fromSaved` and every link built
 * on top of it, and this is the last point where the bad value is still easy to trace to its source.
 * Reach for this over `HydrationRouteFailedError`: the route succeeded at the transport level; the
 * DATA it returned is what is wrong.
 *
 * USAGE:
 * throw new HydrationRecordShapeError({
 *   recipeName: 'guild-mid-execution',
 *   ingredientName: 'guild',
 *   fieldName: 'urlSlug',
 *   validationMessage: 'Required',
 * });
 * // Throws error naming the recipe, the ingredient, the offending field and the validation failure
 *
 * WHEN-TO-USE: From the runner, once a route's 2xx response fails `record.safeParse`.
 * WHEN-NOT-TO-USE: When the response parses clean — the row is created and nothing throws.
 */
export class HydrationRecordShapeError extends Error {
  public constructor({
    recipeName,
    ingredientName,
    fieldName,
    validationMessage,
  }: {
    recipeName: string;
    ingredientName: string;
    fieldName: string;
    validationMessage: string;
  }) {
    super(
      `recipe "${recipeName}": ingredient "${ingredientName}"'s route answered 2xx with a record that field "${fieldName}" rejects: ${validationMessage}`,
    );
    this.name = 'HydrationRecordShapeError';
  }
}

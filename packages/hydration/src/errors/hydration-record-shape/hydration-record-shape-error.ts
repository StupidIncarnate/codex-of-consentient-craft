/**
 * PURPOSE: Halts a plan whose route returned a shape the ingredient's `record` contract rejects,
 * naming the field. A silently wrong record poisons every `fromSaved` and every link built on top of
 * it, and this is the last point where the bad value is still easy to trace to its source. Reach for
 * this over `HydrationRouteFailedError`: the route itself succeeded; the DATA it returned is what is
 * wrong.
 *
 * A `write` route is pure file and broker code — it answers no status, so its message never claims
 * one. Every other route (`api`, `update`) really did answer 2xx, so its message says so and names
 * which route.
 *
 * USAGE:
 * throw new HydrationRecordShapeError({
 *   recipeName: 'guild-mid-execution',
 *   ingredientName: 'guild',
 *   route: 'write',
 *   fieldName: 'urlSlug',
 *   validationMessage: 'Required',
 * });
 * // Throws error naming the recipe, the ingredient, the field and the validation failure — worded
 * // for a write route, which never answers a status
 *
 * WHEN-TO-USE: From the runner, once a route's return fails `record.safeParse`.
 * WHEN-NOT-TO-USE: When the response parses clean — the row is created and nothing throws.
 */
export class HydrationRecordShapeError extends Error {
  public constructor({
    recipeName,
    ingredientName,
    route,
    fieldName,
    validationMessage,
  }: {
    recipeName: string;
    ingredientName: string;
    route: string;
    fieldName: string;
    validationMessage: string;
  }) {
    const outcome =
      route === 'write'
        ? `write route returned a record that field "${fieldName}" rejects: ${validationMessage}`
        : `"${route}" route answered 2xx with a record that field "${fieldName}" rejects: ${validationMessage}`;
    super(`recipe "${recipeName}": ingredient "${ingredientName}"'s ${outcome}`);
    this.name = 'HydrationRecordShapeError';
  }
}

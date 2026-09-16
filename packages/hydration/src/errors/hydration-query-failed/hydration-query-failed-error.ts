/**
 * PURPOSE: Halts a plan whose `filter` could not query at all — the app was unreachable, not merely
 * empty-handed. Reach for this over `HydrationFilterExpectationError`: that class means the row was
 * not there; this one means the question was never answered, and conflating the two is exactly the
 * bug this pair of classes exists to prevent.
 *
 * USAGE:
 * throw new HydrationQueryFailedError({
 *   recipeName: 'drop-riftcarver-item',
 *   ingredientName: 'operation',
 *   where: '{"role":"riftcarver"}',
 *   cause: new Error('connect ECONNREFUSED'),
 * });
 * // Throws error naming the recipe, the ingredient, the filter and the underlying query failure
 *
 * WHEN-TO-USE: From the runner, once a `filter` op's underlying query rejects before returning any
 * rows.
 * WHEN-NOT-TO-USE: When the query resolves and simply returns fewer rows than expected — that is
 * `HydrationFilterExpectationError`.
 */
export class HydrationQueryFailedError extends Error {
  public constructor({
    recipeName,
    ingredientName,
    where,
    cause,
  }: {
    recipeName: string;
    ingredientName: string;
    where: string;
    cause: unknown;
  }) {
    super(
      `recipe "${recipeName}": ingredient "${ingredientName}" filter where ${where} could not query: ${String(cause)}`,
    );
    this.name = 'HydrationQueryFailedError';
  }
}

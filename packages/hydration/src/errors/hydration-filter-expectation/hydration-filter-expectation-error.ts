/**
 * PURPOSE: Halts a plan whose `filter` matched fewer rows than its `expect` allows, naming the
 * ingredient, the `where` and what WAS actually there. Reach for this over
 * `HydrationQueryFailedError`: the app answered fine here — the row the recipe expected simply was
 * not in that answer, which is a fact about the DATA, not about reachability.
 *
 * USAGE:
 * throw new HydrationFilterExpectationError({
 *   recipeName: 'drop-riftcarver-item',
 *   ingredientName: 'operation',
 *   where: '{"role":"riftcarver"}',
 *   expect: 'some',
 *   matchedCount: 0,
 * });
 * // Throws error naming the recipe, the ingredient, the filter and how many rows it actually matched
 *
 * WHEN-TO-USE: From the runner, once a `filter` op's query succeeds but returns fewer rows than
 * `expect` requires (zero, for the default `'some'`).
 * WHEN-NOT-TO-USE: When the query itself fails to run at all — connection refused, a malformed
 * query — that is `HydrationQueryFailedError`, and conflating the two hides whether the row is
 * missing or the app is unreachable.
 */
export class HydrationFilterExpectationError extends Error {
  public constructor({
    recipeName,
    ingredientName,
    where,
    expect,
    matchedCount,
  }: {
    recipeName: string;
    ingredientName: string;
    where: string;
    expect: string;
    matchedCount: number;
  }) {
    super(
      `recipe "${recipeName}": ingredient "${ingredientName}" filter where ${where} expected "${expect}" but matched ${String(matchedCount)} row(s)`,
    );
    this.name = 'HydrationFilterExpectationError';
  }
}

/**
 * PURPOSE: Halts a plan whose `filter` matched a row count that its `expect` does not permit, naming
 * the ingredient, the `where`, what WAS actually there, and candidate rows when ambiguous. Reach
 * for this over `HydrationQueryFailedError`: the app answered fine here — the row count the recipe
 * expected did not match what the data held, which is a fact about the DATA, not about reachability.
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
 * WHEN-TO-USE: From the runner, once a `filter` op's query succeeds but returns a row count
 * `expect` forbids (zero for `'some'`, or multiple rows for `'one'`).
 * WHEN-NOT-TO-USE: When the query itself fails to run at all — connection refused, a malformed
 * query — that is `HydrationQueryFailedError`, and conflating the two hides whether the row is
 * missing or the app is unreachable.
 */
export class HydrationFilterExpectationError extends Error {
  public readonly candidates: readonly unknown[];

  public constructor({
    recipeName,
    ingredientName,
    where,
    expect,
    matchedCount,
    candidates,
  }: {
    recipeName: string;
    ingredientName: string;
    where: string;
    expect: string;
    matchedCount: number;
    candidates?: readonly unknown[];
  }) {
    const candidateList =
      candidates !== undefined && candidates.length > 0
        ? `\nCandidates (${String(matchedCount)}):\n${candidates
            .map((c, i) => `  [${String(i)}]: ${JSON.stringify(c)}`)
            .join('\n')}`
        : '';
    super(
      `recipe "${recipeName}": ingredient "${ingredientName}" filter where ${where} expected "${expect}" but matched ${String(matchedCount)} row(s)${candidateList}`,
    );
    this.name = 'HydrationFilterExpectationError';
    this.candidates = candidates ?? [];
  }
}

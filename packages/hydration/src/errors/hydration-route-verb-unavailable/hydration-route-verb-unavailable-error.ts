/**
 * PURPOSE: Refuses a plan, before the first write, whose chain calls `query`, `update` or `remove`
 * against an ingredient that declares no matching route. Reach for this over
 * `HydrationRouteUnavailableError`: that class is about what the TARGET lacks for a MAKE route
 * (`api`/`write`); this one is about a VERB the ingredient itself never declared, which reads wrong
 * phrased as a target gap.
 *
 * USAGE:
 * throw new HydrationRouteVerbUnavailableError({
 *   recipeName: 'guild-mid-execution',
 *   ingredientName: 'operation',
 *   verb: 'remove',
 * });
 * // Throws error naming the recipe, the ingredient and the verb it cannot serve
 *
 * WHEN-TO-USE: From the pre-flight pass, once it walks the finished op tree and finds a `filter`,
 * a `remove`, or a non-foldable `set` targeting an ingredient whose `routes` has no `query`,
 * `update` or `remove` entry to serve it.
 * WHEN-NOT-TO-USE: When the ingredient does declare the matching route — the call proceeds and
 * nothing throws. WHEN-NOT-TO-USE also covers a MAKE route the target cannot reach, which is
 * `HydrationRouteUnavailableError`'s case, not this one.
 */
export class HydrationRouteVerbUnavailableError extends Error {
  public constructor({
    recipeName,
    ingredientName,
    verb,
  }: {
    recipeName: string;
    ingredientName: string;
    verb: string;
  }) {
    super(
      `recipe "${recipeName}": ingredient "${ingredientName}" declares no "${verb}" route, so a call needing one cannot run`,
    );
    this.name = 'HydrationRouteVerbUnavailableError';
  }
}

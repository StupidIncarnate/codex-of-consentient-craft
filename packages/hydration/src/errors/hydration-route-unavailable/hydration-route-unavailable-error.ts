/**
 * PURPOSE: Refuses a plan, before the first write, whose ingredient offers only routes the target
 * cannot use — an `api`-only ingredient handed no reachable server. Reach for this over
 * `HydrationRouteFailedError`: this fires from the plan's SHAPE alone, before any route runs, so a
 * caller never burns a half-made instance finding out a route was never reachable in the first
 * place.
 *
 * USAGE:
 * throw new HydrationRouteUnavailableError({
 *   recipeName: 'guild-mid-execution',
 *   ingredientName: 'guild',
 *   availableRoutes: ['api'],
 *   targetLacks: 'a baseUrl, so the api route has nothing to call',
 * });
 * // Throws error naming the recipe, the ingredient, the routes it has and what the target lacks
 *
 * WHEN-TO-USE: From the pre-flight pass, computed off the plan and the target with nothing yet on
 * disk — an ingredient's only route needs a server and the target carries no `baseUrl`.
 * WHEN-NOT-TO-USE: Once a route has actually been invoked and it threw or answered badly — that is
 * `HydrationRouteFailedError`, a mid-run fact about what the app did rather than what the plan needs.
 */
export class HydrationRouteUnavailableError extends Error {
  public constructor({
    recipeName,
    ingredientName,
    availableRoutes,
    targetLacks,
  }: {
    recipeName: string;
    ingredientName: string;
    availableRoutes: readonly string[];
    targetLacks: string;
  }) {
    super(
      `recipe "${recipeName}": ingredient "${ingredientName}" needs a route this target cannot serve. Routes it declares: ${availableRoutes.join(', ')}. The target lacks ${targetLacks}`,
    );
    this.name = 'HydrationRouteUnavailableError';
  }
}

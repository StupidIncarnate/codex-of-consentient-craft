/**
 * PURPOSE: Halts a plan whose gates refused a transition `set` asked for, naming `from`, `to` and
 * what the gate itself said — "Cannot go to in_progress from created" is a real answer a fixer can
 * act on; a bare stack trace from `reach` is not. Reach for this over `HydrationRouteFailedError`:
 * the transition's OWN rule refused the value, independent of whether any route ever ran.
 *
 * USAGE:
 * throw new HydrationTransitionRefusedError({
 *   recipeName: 'guild-mid-execution',
 *   ingredientName: 'quest',
 *   from: 'created',
 *   to: 'in_progress',
 *   gateMessage: 'a quest needs at least one session before it can start',
 * });
 * // Throws error naming the recipe, the ingredient, the refused transition and what the gate said
 *
 * WHEN-TO-USE: From the runner, once a `set` op's transition field calls `reach` and the target's
 * own gate function refuses the move.
 * WHEN-NOT-TO-USE: When the gate accepts the transition — the walk proceeds and nothing throws.
 */
export class HydrationTransitionRefusedError extends Error {
  public constructor({
    recipeName,
    ingredientName,
    from,
    to,
    gateMessage,
  }: {
    recipeName: string;
    ingredientName: string;
    from: string;
    to: string;
    gateMessage: string;
  }) {
    super(
      `recipe "${recipeName}": ingredient "${ingredientName}" cannot go to "${to}" from "${from}": ${gateMessage}`,
    );
    this.name = 'HydrationTransitionRefusedError';
  }
}

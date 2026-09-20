/**
 * PURPOSE: Refuses a plan, before the first write, whose `set` asks a transition for a `to` off the
 * ingredient's own declared list. Reach for this over `HydrationTransitionRefusedError`: that class
 * is for when `reach` — a live gate, run against the row's actual current state — refuses the move;
 * this one is a SHAPE mismatch (the asked-for `to` against the ingredient's own config), known before
 * anything runs, for the untyped paths that reach the runner without ever passing through the typed
 * chain (a hand-built op, or a plan assembled outside it) — the chain itself already refuses this at
 * the call site.
 *
 * USAGE:
 * throw new HydrationTransitionUnreachableError({
 *   recipeName: 'guild-mid-execution',
 *   ingredientName: 'quest',
 *   to: 'blocked',
 *   reachableStates: ['created', 'in_progress'],
 * });
 * // Throws error naming the recipe, the ingredient, the refused "to" and the states it can reach
 *
 * WHEN-TO-USE: From the pre-flight pass, once it walks the finished op tree and finds a `set` whose
 * `transition.to` is not one of the ingredient's own `transitions.to`.
 * WHEN-NOT-TO-USE: When `to` is on the list — the walk proceeds and nothing throws. Also not for a
 * gate refusing a reachable `to` once the walk actually runs `reach`; that is
 * `HydrationTransitionRefusedError`.
 */
export class HydrationTransitionUnreachableError extends Error {
  public constructor({
    recipeName,
    ingredientName,
    to,
    reachableStates,
  }: {
    recipeName: string;
    ingredientName: string;
    to: string;
    reachableStates: readonly string[];
  }) {
    super(
      `recipe "${recipeName}": ingredient "${ingredientName}" asks a transition for "${to}", which is not one of the states it reaches by asking. States it can reach: ${reachableStates.join(', ')}`,
    );
    this.name = 'HydrationTransitionUnreachableError';
  }
}

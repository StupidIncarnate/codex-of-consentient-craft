/**
 * PURPOSE: Distinguishes SiegelenseFlow's own routing refusal for `recipes` — the "is a siegelense
 * call but is not built yet" fall-through, a plain `Error` thrown BEFORE the call ever reaches
 * `recipesLocateBroker` — from every outcome the real recipes pipeline itself can produce.
 * `recipesLocateBroker` checks the sibling `hydration-recipes` package's compiled `dist/index.js`
 * with real fs I/O, so `SiegelenseFlow({ args: ['recipes'] })` resolves or rejects differently
 * depending on that package's own build state; `reachedPipeline` reports the one thing true in
 * either state — the call passed SiegelenseFlow's own routing — so a caller of this harness never
 * has to branch on which build state the checkout is currently in. Matches the routing refusal's
 * fixed prefix rather than its full message, since the message's tail (`Built calls: ...`) lists
 * every built call and grows as more land — asserting the whole string would break on each one.
 *
 * USAGE:
 * const recipesRouteOutcome = recipesRouteOutcomeHarness();
 * const [settled] = await Promise.allSettled([SiegelenseFlow({ args: ['recipes'] })]);
 * recipesRouteOutcome.reachedPipeline({ settled });
 * // Returns true for a resolved call or a rejection that is not SiegelenseFlow's own routing
 * // refusal; false when the call never left SiegelenseFlow's own routing.
 */

const OWN_REFUSAL_PREFIX = 'recipes is a siegelense call but is not built yet.';

export const recipesRouteOutcomeHarness = (): {
  reachedPipeline: (params: { settled: PromiseSettledResult<unknown> }) => boolean;
} => ({
  reachedPipeline: ({ settled }: { settled: PromiseSettledResult<unknown> }): boolean => {
    if (settled.status === 'fulfilled') {
      return true;
    }
    const { reason } = settled;
    if (!(reason instanceof Error)) {
      return false;
    }
    return !reason.message.startsWith(OWN_REFUSAL_PREFIX);
  },
});

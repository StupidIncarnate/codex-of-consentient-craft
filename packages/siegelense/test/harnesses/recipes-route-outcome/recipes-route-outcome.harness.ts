/**
 * PURPOSE: Distinguishes SiegelenseFlow's own refusals for `recipes` — the generic "is a siegelense
 * call but is not built yet" fall-through and the named "--human is not implemented" refusal, both
 * plain `Error`s thrown BEFORE the call ever reaches `recipesLocateBroker` — from every outcome the
 * real recipes pipeline itself can produce. `recipesLocateBroker` checks the sibling
 * `hydration-recipes` package's compiled `dist/index.js` with real fs I/O, so
 * `SiegelenseFlow({ args: ['recipes'] })` resolves or rejects differently depending on that
 * package's own build state; `reachedPipeline` reports the one thing true in either state — the
 * call passed SiegelenseFlow's own routing — so a caller of this harness never has to branch on
 * which build state the checkout is currently in.
 *
 * USAGE:
 * const recipesRouteOutcome = recipesRouteOutcomeHarness();
 * const [settled] = await Promise.allSettled([SiegelenseFlow({ args: ['recipes'] })]);
 * recipesRouteOutcome.reachedPipeline({ settled });
 * // Returns true for a resolved call or a rejection that is not one of SiegelenseFlow's own
 * // refusals; false when the call never left SiegelenseFlow's own routing.
 */

const SIEGELENSE_FLOW_OWN_REFUSAL_PATTERNS = [
  /^recipes is a siegelense call but is not built yet\./u,
  /^--human is not implemented for recipes:/u,
] as const;

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
    return !SIEGELENSE_FLOW_OWN_REFUSAL_PATTERNS.some((pattern) => pattern.test(reason.message));
  },
});

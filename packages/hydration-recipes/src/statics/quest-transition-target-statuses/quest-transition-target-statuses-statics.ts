/**
 * PURPOSE: The quest statuses `questIngredientBroker`'s own `transitions.to` may be asked to walk
 * to, held as an inline literal tuple so `to`'s STATIC TYPE narrows along with its runtime value —
 * see `quest-ingredient-broker.ts`'s own header for the compile-time guarantee this restores.
 * Reach for this over `questStatusContract.options.filter(isTransitionTargetQuestStatusGuard)` at
 * the declaration site: a `.filter()` call cannot carry literal types forward, so `to` would stay
 * the un-narrowed `QuestStatus[]` even though the runtime array is identical. Written as an inline
 * literal array rather than derived, deliberately: this folder is the one path
 * `@dungeonmaster-local/ban-quest-status-literals`'s `allowlistPathSubstrings` names for exactly
 * this purpose, so the rule that refuses two-or-more recognized status literals in an inline array
 * everywhere else does not fire here. `is-transition-target-quest-status-guard.test.ts` pins an
 * assertion that this list stays exactly what `isTransitionTargetQuestStatusGuard` computes over
 * the live `questStatusContract.options`, so an enum change this file misses fails a test instead
 * of silently narrowing or widening what a caller may ask `to`.
 *
 * USAGE:
 * questTransitionTargetStatusesStatics.value.includes('explore_flows');
 * // Returns true
 */
export const questTransitionTargetStatusesStatics = {
  value: [
    'explore_flows',
    'review_flows',
    'flows_approved',
    'explore_observables',
    'review_observables',
    'approved',
    'in_progress',
    'complete',
    'abandoned',
  ],
} as const;

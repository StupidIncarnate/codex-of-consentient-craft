/**
 * PURPOSE: Configuration for the ban-locator-pick rule — the one path substring it enforces against
 * (the step-command broker implementations, siegelense-tooling.md's "Holding the no-pick rule
 * mechanically") and the method names it watches. `.first()`/`.last()` are never legitimate there:
 * both mean an ambiguity the caller did not resolve. `.nth()` is banned only when its argument is a
 * literal — `.nth(0)` written as a literal is `.first()` with extra steps, but `.nth()` is a
 * naming-ladder rung a caller may legitimately ask for when the index comes from caller input.
 *
 * USAGE:
 * locatorPickStatics.scope.inScopePathSubstring
 * // 'packages/siegelense/src/brokers/step/'
 */
export const locatorPickStatics = {
  scope: {
    // The rule fires ONLY on files whose path contains this substring — everywhere else `.first()`,
    // `.last()` and a literal `.nth()` decide nothing about this rule. Stated here, in the guard
    // that reads it, and in the rule's own message text, per the caution in
    // siegelense-recipes.md against a rule that looks broader than it is.
    inScopePathSubstring: 'packages/siegelense/src/brokers/step/',
  },
  bannedMethodNames: {
    // Locator methods that always silently resolve an ambiguity the caller did not resolve.
    always: ['first', 'last'],
    // The naming-ladder rung: legitimate when the index is caller input, `.first()` with extra
    // steps when the index is a literal.
    conditional: 'nth',
  },
} as const;

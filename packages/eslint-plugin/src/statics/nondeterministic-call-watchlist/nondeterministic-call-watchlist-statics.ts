/**
 * PURPOSE: The exact call shapes `ban-nondeterminism-in-ingredients` watches for — the three calls
 * the recipe-book specification names as the only way left to break determinism once the chain
 * supplies each row its own index. Deliberately narrow to that literal global-namespace call: a
 * destructured import of the same function (`import { randomUUID } from 'node:crypto'`) or an
 * equivalent source of variation (`new Date()`, `performance.now()`) is not on this list; see the
 * rule's own message.
 *
 * USAGE:
 * import { nondeterministicCallWatchlistStatics } from './statics/nondeterministic-call-watchlist/nondeterministic-call-watchlist-statics';
 * nondeterministicCallWatchlistStatics.bannedCalls;
 * // Returns the readonly {objectName, propertyName} pairs this rule reports on
 *
 * WHEN-TO-USE: Only `rule-ban-nondeterminism-in-ingredients-broker` should consume this.
 */
export const nondeterministicCallWatchlistStatics = {
  bannedCalls: [
    { objectName: 'Date', propertyName: 'now' },
    { objectName: 'Math', propertyName: 'random' },
    { objectName: 'crypto', propertyName: 'randomUUID' },
  ],
} as const;

/**
 * PURPOSE: Holds the ignore patterns discover scans with for the life of the MCP child, so the
 * repo's .gitignore is read once at startup rather than on every search. Until init has run it
 * answers with the always-on static rules instead of nothing, because a discover that lands before
 * startup finishes must still refuse to walk node_modules.
 *
 * USAGE:
 * discoverIgnoreState.set({ patterns });
 * const patterns = discoverIgnoreState.get();
 * // Returns the merged list once init has run, the static rules before that
 */

import { fileDiscoveryStatics } from '../../statics/file-discovery/file-discovery-statics';

const STATIC_PATTERNS: readonly string[] = fileDiscoveryStatics.globIgnorePatterns.map(
  (pattern) => pattern,
);

// Empty reads as "init has not run", which is sound because the only writer —
// discoverIgnoreInitBroker — always returns the static rules at minimum, so a legitimately empty
// ignore list is not a state this can be in.
const currentPatterns: string[] = [];

export const discoverIgnoreState = {
  set: ({ patterns }: { patterns: readonly string[] }): void => {
    currentPatterns.splice(0, currentPatterns.length, ...patterns);
  },

  get: (): readonly string[] =>
    currentPatterns.length === 0 ? STATIC_PATTERNS : [...currentPatterns],

  clear: (): void => {
    currentPatterns.length = 0;
  },
} as const;

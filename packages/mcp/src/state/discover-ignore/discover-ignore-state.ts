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

import { globPatternContract } from '@dungeonmaster/shared/contracts';
import type { GlobPattern } from '@dungeonmaster/shared/contracts';
import { fileDiscoveryStatics } from '../../statics/file-discovery/file-discovery-statics';

const STATIC_PATTERNS: readonly GlobPattern[] = fileDiscoveryStatics.globIgnorePatterns.map(
  (pattern) => globPatternContract.parse(pattern),
);

// Empty reads as "init has not run", which is sound because the only writer —
// discoverIgnoreInitBroker — always returns the static rules at minimum, so a legitimately empty
// ignore list is not a state this can be in.
const currentPatterns: GlobPattern[] = [];

export const discoverIgnoreState = {
  set: ({ patterns }: { patterns: readonly GlobPattern[] }): void => {
    currentPatterns.splice(0, currentPatterns.length, ...patterns);
  },

  get: (): readonly GlobPattern[] =>
    currentPatterns.length === 0 ? STATIC_PATTERNS : [...currentPatterns],

  clear: (): void => {
    currentPatterns.length = 0;
  },
} as const;

/**
 * PURPOSE: Names the ESLint result-entry keys dropped from the stdout a lint run saves under `.ward/`.
 * `stats` is a per-rule timing tree of about 21KB per file, and it is the bulk of a saved lint run:
 * measured on one whole-repo result, 252MB of a 286MB file. `checkRunLintBroker` reads it into
 * `fileTimings` before the save, and nothing reads it back out of the saved stdout.
 *
 * USAGE:
 * eslintStripKeysStatics.keys;
 * // Returns: ['stats', 'usedDeprecatedRules']
 */
export const eslintStripKeysStatics = {
  keys: ['stats', 'usedDeprecatedRules'],
} as const;

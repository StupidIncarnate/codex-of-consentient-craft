/**
 * PURPOSE: Maps each check type to its binary name, arguments, and file discovery patterns
 *
 * USAGE:
 * const {bin, args} = checkCommandsStatics.lint;
 * // Returns: {bin: 'eslint', args: ['--fix', '--stats', '--format', 'json', '.']}
 */

// TypeScript-only extensions (tsc). Mirrors tsExtensionsStatics.extensions —
// statics cannot import from statics.
const tsExts = ['ts', 'tsx'] as const;

// All source extensions that eslint and jest can process in user projects.
// Ward runs in external codebases that may use JS/JSX alongside TS.
const allExts = ['ts', 'tsx', 'js', 'jsx'] as const;

const lintDiscoverPatterns = [
  ...allExts.flatMap((ext) => [`src/**/*.${ext}`, `bin/**/*.${ext}`, `test/**/*.${ext}`]),
  '*.ts',
  '*.js',
];
const typecheckDiscoverPatterns = tsExts.flatMap((ext) => [`src/**/*.${ext}`, `bin/**/*.${ext}`]);
const unitDiscoverPatterns = allExts.flatMap((ext) => [
  `src/**/*.test.${ext}`,
  `bin/**/*.test.${ext}`,
  `test/**/*.test.${ext}`,
]);
// `.e2e.test` is retained defensively: e2e is now exclusively Playwright `*.e2e.ts`,
// so no repo file carries the Jest `.e2e.test` suffix after the rename — but a stray one
// must still be excluded from the unit run rather than collected as a unit test.
const unitExcludePatterns = allExts.flatMap((ext) => [
  `**/*.integration.test.${ext}`,
  `**/*.e2e.test.${ext}`,
]);
const integrationDiscoverPatterns = allExts.flatMap((ext) => [
  `src/**/*.integration.test.${ext}`,
  `bin/**/*.integration.test.${ext}`,
  `test/**/*.integration.test.${ext}`,
]);

// Regex alternation for all extensions: ts|tsx|js|jsx
const extRegex = allExts.join('|');

// Jest resolves the percentage against the machine's cores, so this multiplies with ward's OWN
// package concurrency rather than replacing it: `configDefaultsStatics.ward.concurrency.default`
// packages in flight, this share of the cores each, lands on the whole machine and no more.
// A repo that lowers `ward.concurrency` leaves cores idle and may raise it to compensate.
// Percentage, never a count: every worker builds its own ts-jest LanguageService and TypeScript
// program, so a count that suits a 12-core box exhausts memory on a laptop.
const maxWorkersBudget = '--maxWorkers=25%';

export const checkCommandsStatics = {
  lint: {
    bin: 'eslint',
    args: ['--fix', '--stats', '--format', 'json', '.'],
    discoverPatterns: lintDiscoverPatterns,
  },
  typecheck: {
    bin: 'tsc',
    args: ['--noEmit', '--listFiles'],
    discoverPatterns: typecheckDiscoverPatterns,
  },
  unit: {
    bin: 'jest',
    // No `--detectOpenHandles` HERE. Jest reads it as implying `--runInBand`
    // (`if (runInBand || detectOpenHandles)` in @jest/core), so from this list — which every run
    // shares — it single-threads the whole repo whatever the machine has, and its async_hooks stack
    // capture cost 24.7% of a profiled 69s web run. Leak detection is not lost: the check-run
    // brokers add the flag on the FILE-scoped branch, which is already in band, so it costs nothing
    // there. `--forceExit` is what stops a leaked handle hanging the run.
    args: [
      '--json',
      '--no-color',
      '--forceExit',
      maxWorkersBudget,
      '--testPathIgnorePatterns',
      // `.e2e.test` is retained defensively here too: e2e is Playwright-only (`*.e2e.ts`),
      // so the Jest `.e2e.test` suffix is unused after the rename, but a stray one should
      // still never run as a unit test.
      `\\.integration\\.test\\.(${extRegex})$|\\.e2e\\.test\\.(${extRegex})$`,
    ],
    discoverPatterns: unitDiscoverPatterns,
    excludePatterns: unitExcludePatterns,
  },
  integration: {
    bin: 'jest',
    args: [
      '--json',
      '--no-color',
      '--forceExit',
      maxWorkersBudget,
      '--testTimeout=30000',
      '--testPathPatterns',
      `\\.integration\\.test\\.(${extRegex})$`,
    ],
    discoverPatterns: integrationDiscoverPatterns,
  },
  e2e: {
    bin: 'playwright',
    args: ['test', '--reporter=line,json'],
    discoverPatterns: ['**/*.e2e.ts'],
  },
} as const;

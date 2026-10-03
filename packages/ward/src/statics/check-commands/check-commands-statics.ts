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

// Jest resolves the percentage against the machine's cores when no dynamic share is passed.
// Percentage, never a count: every worker builds its own ts-jest LanguageService and TypeScript
// program, so a count that suits a multi-core machine exhausts memory on a laptop.
const maxWorkersBudget = '--maxWorkers=25%';

export const checkCommandsStatics = {
  lint: {
    bin: 'eslint',
    args: ['--fix', '--stats', '--format', 'json', '.'],
    // No second pass for this check type — present so `checkCommandsStatics` has one shape every
    // entry satisfies, which is what lets `check-commands-statics.test.ts` flatten `args` and
    // `buildArgs` together with no conditional.
    buildArgs: [],
    discoverPatterns: lintDiscoverPatterns,
  },
  typecheck: {
    bin: 'tsc',
    args: ['--noEmit', '--listFiles'],
    // Appended to at runtime with `-p <package's tsconfig.build.json>` — the path is per-package,
    // so it cannot live here. Never `--listFiles`: the build pass exists only to surface errors the
    // checking pass misses, and the checking pass's own `--listFiles` output already covers
    // discovery/filesCount for the package.
    buildArgs: ['--noEmit'],
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
    buildArgs: [],
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
    // `--findRelatedTests` REPLACES jest's test-path filter, so `--testPathPatterns` above stops
    // applying the moment the file branch adds it. Measured: a three-path scope holding no
    // integration test at all ran three UNIT suites under this check's name, so every unit
    // finding — a failure, a slow file, a leaked timer — was reported a second time against the
    // wrong check, and the scope paid for its unit tests twice. An IGNORE pattern DOES survive
    // `--findRelatedTests`, which is why `unit` above never had this. So "keep only integration
    // tests" has to be spelled as "ignore everything else".
    //
    // Ward runs in other people's repos, so this names the file-suffix convention it already
    // owns and NO directory. A `node_modules` or build-output entry would be this repo's folder
    // names travelling inside a published tool; they are also unnecessary here, since this
    // pattern only ever rides the `--findRelatedTests` branch, where the candidates are already
    // the tests reachable from the source files the caller named.
    relatedTestsIgnorePattern: `^(?!.*\\.integration\\.test\\.(${extRegex})$)`,
    buildArgs: [],
    discoverPatterns: integrationDiscoverPatterns,
  },
  e2e: {
    bin: 'playwright',
    args: ['test', '--reporter=line,json'],
    buildArgs: [],
    discoverPatterns: ['**/*.e2e.ts'],
  },
} as const;

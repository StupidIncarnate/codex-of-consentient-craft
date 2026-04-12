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
  ...allExts.flatMap((ext) => [`src/**/*.${ext}`, `bin/**/*.${ext}`]),
  '*.ts',
  '*.js',
];
const typecheckDiscoverPatterns = tsExts.flatMap((ext) => [`src/**/*.${ext}`, `bin/**/*.${ext}`]);
const unitDiscoverPatterns = allExts.flatMap((ext) => [
  `src/**/*.test.${ext}`,
  `bin/**/*.test.${ext}`,
]);
const unitExcludePatterns = allExts.flatMap((ext) => [
  `**/*.integration.test.${ext}`,
  `**/*.e2e.test.${ext}`,
]);
const integrationDiscoverPatterns = allExts.flatMap((ext) => [
  `src/**/*.integration.test.${ext}`,
  `bin/**/*.integration.test.${ext}`,
]);

// Regex alternation for all extensions: ts|tsx|js|jsx
const extRegex = allExts.join('|');

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
    args: [
      '--json',
      '--no-color',
      '--forceExit',
      '--detectOpenHandles',
      '--testPathIgnorePatterns',
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
      '--detectOpenHandles',
      '--testTimeout=30000',
      '--testPathPatterns',
      `\\.integration\\.test\\.(${extRegex})$`,
    ],
    discoverPatterns: integrationDiscoverPatterns,
  },
  e2e: {
    bin: 'playwright',
    args: ['test', '--reporter=line'],
    discoverPatterns: ['tests/e2e/**/*.spec.ts', 'e2e/**/*.spec.ts'],
  },
} as const;

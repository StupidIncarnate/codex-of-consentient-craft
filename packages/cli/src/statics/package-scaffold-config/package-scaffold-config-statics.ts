/**
 * PURPOSE: The exact config a workspace package in this monorepo needs, taken from what the
 * packages on disk actually carry rather than from the prose in `packages/CLAUDE.md` — the two
 * disagree in ways that break a build. Reach for this over `tsconfigTemplateStatics` /
 * `jestConfigTemplateStatics`, which are the ROOT-level files `dungeonmaster init` writes into a
 * consumer repo; these are the PER-PACKAGE ones `dungeonmaster create-package` writes.
 *
 * Three values here are the ones a hand-copied config gets wrong, and each cost something real:
 * `buildExclude` omitting `**\/*.stub.ts` / `**\/*.harness.ts` ships test scaffolding inside `dist`;
 * omitting `tsBuildInfoFile` leaves every package's `build:clean` deleting a file the build never
 * wrote; and a jest config that pins its own `testEnvironmentOptions` loses the repo-root base's
 * `customExportConditions: ['source', ...]`, which is what makes a suite read a sibling package's
 * edited TypeScript instead of its last build — so it goes green over stale code and says nothing.
 *
 * USAGE:
 * packageScaffoldConfigStatics.buildCompilerOptions;
 * // Returns the compilerOptions block for a package's tsconfig.build.json
 */

export const packageScaffoldConfigStatics = {
  jsonIndentSpaces: 2,
  defaultPackagesDir: 'packages',
  workspaceDependencyVersion: '*',
  packageVersion: '0.1.0',

  tsconfigExtends: '../../tsconfig.json',
  buildTsconfigExtends: './tsconfig.json',
  buildTsconfigFileName: 'tsconfig.build.json',
  jestConfigFileName: 'jest.config.js',
  playwrightConfigFileName: 'playwright.config.ts',

  // Two entries, in this order, in every package on disk. `packages/mcp` adds a third for its own
  // package-local `@types/`; a fresh package has none, so it gets the pair.
  typeRoots: ['../../node_modules/@types', '../../@types'],

  // The include globs every package shares. A type that ships binaries adds `bin/**/*`, and an
  // e2e-eligible type adds its playwright config — both handled by the caller, not here.
  baseInclude: ['src/**/*', 'test/**/*', '*.ts'],

  buildCompilerOptions: {
    noEmit: false,
    rootDir: './',
    outDir: './dist',
    declaration: true,
    declarationMap: true,
    incremental: true,
    tsBuildInfoFile: './.ward/build.tsbuildinfo',
  },

  // `test/**` alone would not do it: the emit walks `include`, and a `.stub.ts` or `.harness.ts`
  // colocated under `src/` is reached from there.
  buildExclude: [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.proxy.ts',
    '**/*.stub.ts',
    '**/*.harness.ts',
    'test/**',
    'src/.test-tmp/**',
    'src/_lint-testbed/**',
  ],

  scripts: {
    build: 'tsc -p tsconfig.build.json',
    'build:clean': 'rm -rf dist .ward/build.tsbuildinfo && npm run build',
    test: 'dungeonmaster-ward --only test',
    typecheck: 'dungeonmaster-ward --only typecheck',
    lint: 'dungeonmaster-ward --only lint',
    ward: 'dungeonmaster-ward',
  },

  binPostbuildScript: 'chmod +x dist/bin/*.js 2>/dev/null || true',

  publishConfig: { access: 'public' },
  files: ['dist/**/*'],

  devDependencies: {
    '@types/node': '^20.11.0',
    typescript: '^5.3.3',
  },

  // A node-environment package. `setupFilesAfterEnv` restates what the repo-root base already sets;
  // every package on disk restates it too, and an explicit path survives a base that stops setting it.
  jestConfigNode: `const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  roots: [__ROOTS__],
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
};
`,

  // A package with .tsx sources. The repo-root base transforms '^.+\\.ts$' only, so a widget file
  // reaches jest untransformed without this block. `testEnvironmentOptions` is deliberately NOT
  // restated: spreading the base is what carries `customExportConditions`, and pinning it here
  // would drop the `source` condition.
  jestConfigTsx: `const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTransformers = require('../../packages/testing/ts-jest/transformers.js');

module.exports = {
  ...baseConfig,
  preset: undefined,
  testEnvironment: '__TEST_ENVIRONMENT__',
  roots: [__ROOTS__],
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/src/**/*.test.[jt]s?(x)'],
  transform: {
    '^.+\\\\.[jt]sx?$': [
      'ts-jest',
      {
        tsconfig: {
          allowJs: true,
          esModuleInterop: true,
          skipLibCheck: true,
          jsx: 'react-jsx',
        },
        astTransformers: {
          before: dungeonmasterTransformers,
        },
      },
    ],
  },
};
`,

  jestRootsPlaceholder: '__ROOTS__',
  jestTestEnvironmentPlaceholder: '__TEST_ENVIRONMENT__',
  jestRootSrc: "'<rootDir>/src'",
  jestRootBin: "'<rootDir>/bin'",
  jestEnvironmentJsdom: 'jsdom',
  jestEnvironmentNode: 'node',
} as const;

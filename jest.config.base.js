const dungeonmasterTransformers = require('./packages/testing/ts-jest/transformers.js');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // `source` first is what makes a test read a sibling workspace package's TypeScript rather than
  // its last build — see packages/config/src/module-resolution.integration.test.ts.
  testEnvironmentOptions: { customExportConditions: ['source', 'require', 'default'] },
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
  testMatch: ['**/src/**/*.test.[jt]s', '**/bin/**/*.test.[jt]s'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/tmp/', '/hypothesis/', '/dist/'],
  modulePathIgnorePatterns: ['/tests/tmp/', '/hypothesis/'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          allowJs: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
        // `diagnostics: false` looks like free speed here and is not — measured on
        // `packages/config` at 3.4% of cold-cache CPU and nothing at all warm, because a warm
        // transform cache skips ts-jest entirely. It only skips `getSemanticDiagnostics`; the cost
        // is building the TypeScript program and `getEmitOutput`, which stay either way.
        // `isolatedModules` DOES remove the program and is what would actually pay — and is unusable
        // as things stand: ts-jest only sets `program` when it is off, and the proxy-mock
        // transformer below reads proxy source files out of that program to hoist `jest.mock()`
        // calls. Turning it on stops the hoisting silently. Give that transformer its own
        // `ts.createSourceFile` cache first; it uses the program for nothing else.
        astTransformers: {
          before: dungeonmasterTransformers,
        },
      },
    ],
  },
  coverageDirectory: 'coverage',
  verbose: false,
  // NEVER set `detectOpenHandles` here. Jest reads it as implying `--runInBand`
  // (`if (runInBand || detectOpenHandles)` in @jest/core), so from this file — which every package
  // spreads — it single-threads every suite on every core the machine has. It also installs an
  // async_hooks `init` hook that builds a 100-frame `ErrorWithStack` per async resource and
  // symbolicates each one through source-map-support: 24.7% of a profiled 69s web run.
  // Leak detection is not lost by leaving it out: ward passes the flag on its FILE-scoped jest
  // branch, which already runs in band, and reports what jest finds. `forceExit` below is what
  // keeps a leaked handle from hanging a run.
  forceExit: true,
};

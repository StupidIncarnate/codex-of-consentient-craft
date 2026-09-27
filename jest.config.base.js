const path = require('path');

// One shared entry for the ts-jest inline options every internal jest.config.* used to restate —
// see that file's own header for why isolatedModules/commonjs/node stay pinned separately from the
// published tsconfig's node16.
const dungeonmasterTsJestOptions = require('./packages/testing/ts-jest/options.js');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // `source` first is what makes a test read a sibling workspace package's TypeScript rather than
  // its last build — see packages/config/src/module-resolution.integration.test.ts.
  testEnvironmentOptions: { customExportConditions: ['source', 'require', 'default'] },
  // Runs once, in the main process, before any worker forks — the only place a `HOME` assignment
  // reaches every worker's real environ. See jest.setup-global.js's own header for why a
  // `setupFiles`/`setupFilesAfterEnv` entry cannot do this job. No package below sets its own
  // `globalSetup`/`globalTeardown` — confirmed by a repo-wide grep before adding these — so nothing
  // here needs chaining.
  //
  // Built from this file's own location (`__dirname`), not `<rootDir>/../../...`: `<rootDir>`
  // resolves against the CONSUMING package, which sits two directories under the repo root for
  // most packages but three for the gateway packages under `packages/@gateway/*` — a fixed
  // `../../` climbs out of the repo entirely for those. This file lives at the repo root, so
  // `__dirname` is depth-agnostic by construction.
  globalSetup: path.join(__dirname, 'packages/testing/src/jest.setup-global.js'),
  globalTeardown: path.join(__dirname, 'packages/testing/src/jest.setup-global-teardown.js'),
  // `setupFiles`, not `setupFilesAfterEnv`: this one has to run before the test file's own imports,
  // so a module that reads `DUNGEONMASTER_HOME` while it loads sees the sandbox. The file itself
  // says what that costs when it resolves to the developer's real home.
  setupFiles: [path.join(__dirname, 'packages/testing/src/jest.setup-home.js')],
  // `start-endpoint-mock-setup.js` loads MSW here so every package gets the fail-on-unhandled
  // HTTP/WS behavior without its own opt-in — see that file's own header. A package whose config
  // overrides this array wholesale (object spread does not merge arrays) has to spread
  // `...baseConfig.setupFilesAfterEnv` back in rather than re-listing `jest.setup.js` alone, or it
  // silently loses this entry.
  setupFilesAfterEnv: [
    path.join(__dirname, 'packages/testing/src/jest.setup.js'),
    path.join(__dirname, 'packages/testing/src/startup/start-endpoint-mock-setup.ts'),
  ],
  testMatch: ['**/src/**/*.test.[jt]s', '**/bin/**/*.test.[jt]s'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/tmp/', '/hypothesis/', '/dist/'],
  modulePathIgnorePatterns: ['/tests/tmp/', '/hypothesis/'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', dungeonmasterTsJestOptions],
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

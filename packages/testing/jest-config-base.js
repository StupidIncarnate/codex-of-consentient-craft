/**
 * Portable Jest base config for repos consuming @dungeonmaster/testing.
 *
 * Spread it from a package's jest.config.js:
 *
 *   const base = require('@dungeonmaster/testing/jest-config-base');
 *   module.exports = { ...base, roots: ['<rootDir>/src'] };
 *
 * It registers the dungeonmaster ts-jest AST transformers (so registerMock / proxy
 * files work), the auto-reset jest.setup (clears mocks, bans .skip/.todo, fails
 * assertion-less tests), and a sandboxed `HOME` for the whole run (globalSetup/globalTeardown,
 * so every worker and every process a test spawns inherits it). Paths resolve inside the
 * installed @dungeonmaster/testing.
 */
'use strict';

const path = require('path');

// One shared entry for the ts-jest inline options this file used to inline directly — see that
// file's own header for why it carries no isolatedModules, unlike the repo-internal sibling.
const dungeonmasterTsJestOptions = require('./ts-jest/published-options.js');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Runs once, in the main process, before any worker forks — the only place a `HOME` assignment
  // reaches every worker's real environ, since a worker inherits `process.env` from the OS process
  // that spawned it. See `jest.setup-global.js`'s own header for why a `setupFiles`/
  // `setupFilesAfterEnv` entry cannot do this job instead.
  globalSetup: path.join(__dirname, 'src', 'jest.setup-global.js'),
  globalTeardown: path.join(__dirname, 'src', 'jest.setup-global-teardown.js'),
  // `start-endpoint-mock-setup.ts` loads MSW here so a consumer's package gets the fail-on-unhandled
  // HTTP/WS behavior without its own opt-in, same as the repo-internal `jest.config.base.js`.
  setupFilesAfterEnv: [
    path.join(__dirname, 'src', 'jest.setup.js'),
    path.join(__dirname, 'src', 'startup', 'start-endpoint-mock-setup.ts'),
  ],
  testMatch: ['**/src/**/*.test.[jt]s', '**/bin/**/*.test.[jt]s'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // Jest's own default ignores every `node_modules/**` path for `transform` too — harmless inside
  // this monorepo, where `@dungeonmaster/testing` resolves through a workspace SYMLINK to real
  // source outside `node_modules` entirely, but a genuine consumer install has no such symlink:
  // this base's own `globalSetup`/`setupFilesAfterEnv` files (`jest.setup.js`,
  // `jest.setup-global.js`) `require()` sibling `.ts` broker files by RELATIVE path, and those
  // files physically sit inside `node_modules/@dungeonmaster/testing/src/**` there. Left ignored,
  // ts-jest never transforms them and Jest hands the raw TypeScript to Node's CJS loader, which
  // fails every single test with "Must use import to load ES Module" — confirmed against a real
  // packed-and-installed consumer (this repo's own scratch-consumer proof, item G25).
  // `msw|@mswjs|until-async|outvariant` joins that carve-out for the same reason
  // `start-endpoint-mock-setup.ts` now loads here: MSW ships ESM-only `.js` with no CJS build, and
  // a consumer install has msw hoisted to its own top-level `node_modules`, not nested under
  // `@dungeonmaster/testing`.
  transformIgnorePatterns: [
    '/node_modules/(?!(@dungeonmaster/testing|msw|@mswjs|until-async|outvariant)/)',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  // `[jt]s`, not `ts` alone: `transformIgnorePatterns` above only decides which node_modules paths
  // are ELIGIBLE for transforming — msw's own `.js`/`.mjs` files still need ts-jest (allowJs: true,
  // see `published-options.js`) to actually down-level their bare `export` syntax to `require()`.
  transform: {
    '^.+\\.[jt]s$': ['ts-jest', dungeonmasterTsJestOptions],
  },
  coverageDirectory: 'coverage',
  verbose: false,
  detectOpenHandles: true,
  forceExit: true,
};

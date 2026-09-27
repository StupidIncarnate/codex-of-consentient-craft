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
  // An empty list, not a named carve-out, because `msw`'s OWN transitive dependency graph turned
  // out too deep and too volatile to enumerate by name: tracing `msw`'s `dependencies` recursively
  // against a real packed-and-installed consumer (item G27) found 21 further ESM-only packages
  // reached from `start-endpoint-mock-setup.ts` requiring `msw/node` alone (`rettime`,
  // `@open-draft/deferred-promise`, `headers-polyfill`, `tough-cookie`, `set-cookie-parser`, the
  // whole `@inquirer/confirm` CLI-prompt chain it pulls in — `yargs`, `cliui`, `string-width`,
  // `wrap-ansi`, `y18n`, ...) — a named-package carve-out here is exactly the kind of second list
  // that silently drifts the day msw (or any future setupFilesAfterEnv dependency) adds one more.
  // Transforming everything costs real time only for files a test run ACTUALLY requires, and
  // ts-jest's `allowJs` (`published-options.js`) already down-levels plain JS/ESM fine.
  transformIgnorePatterns: [],
  moduleFileExtensions: ['ts', 'js', 'mjs', 'json'],
  // `[cm]?[jt]s`, not `[jt]s` alone: `transformIgnorePatterns` above only decides which
  // node_modules paths are ELIGIBLE for transforming — msw's own dependency chain ships real
  // `.mjs` files (`rettime`) that `^.+\.[jt]s$` never matched (an `.mjs` extension has no literal
  // "." immediately before its `js`), so ts-jest never even got asked to down-level them, and
  // Node's own CJS loader rejected the raw `import`/`export` syntax before ts-jest saw the file at
  // all — confirmed against a real packed-and-installed consumer (item G27): "Must use import to
  // load ES Module" fired on `rettime/build/index.mjs` even with the pattern above widened to
  // include `rettime`, because THIS regex, not that one, was what excluded the file from a
  // transform in the first place.
  transform: {
    '^.+\\.[cm]?[jt]s$': ['ts-jest', dungeonmasterTsJestOptions],
  },
  coverageDirectory: 'coverage',
  verbose: false,
  detectOpenHandles: true,
  forceExit: true,
};

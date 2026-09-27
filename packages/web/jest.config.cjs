const { resolve, dirname } = require('path');
const baseConfig = require('../../jest.config.base.js');
const {
  buildNodeModulesEsmTransformPatterns,
} = require('../../packages/testing/ts-jest/node-modules-esm-transform-packages.js');

// `undici` joins the shared four: this package's own fetch mocking pulls it in as an extra ESM
// dependency none of the other packages reach.
const { ignorePattern, packageNames } = buildNodeModulesEsmTransformPatterns({
  extraPackageNames: ['undici'],
});
// `.m?js$`, not `.js$` alone — this package's own combined transform key used to also match a bare
// `.mjs` anywhere, and anchoring that down to `node_modules` (rather than dropping it) keeps an ESM
// `.mjs` dependency working exactly as before.
const nodeModulesEsmTransformPattern = `/node_modules/(${packageNames.join('|')})/.+\\.m?js$`;

// Resolve react/react-dom to their actual install location so the test suite shares a
// single React instance regardless of whether npm hoists them to the repo root or nests
// them under packages/web. require.resolve follows npm's resolution from this package.
const reactDir = dirname(require.resolve('react/package.json'));
const reactDomDir = dirname(require.resolve('react-dom/package.json'));

module.exports = {
  ...baseConfig,
  preset: undefined,
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    // The empty string is MSW's jsdom workaround and must stay in the list; `source` in front of it
    // is what points a sibling workspace import at TypeScript instead of its last build.
    customExportConditions: ['source', '', 'require', 'default'],
    url: 'http://localhost',
  },
  roots: ['<rootDir>/src', '<rootDir>/test'],
  // The base entry rides along: a plain override would drop the sandbox dungeonmaster home it sets
  // before this package's own test files import anything.
  setupFiles: [...baseConfig.setupFiles, '<rootDir>/src/__mocks__/jsdom-polyfills.cjs'],
  // Spread, not re-listed: `jest.config.base.js` now carries both `jest.setup.js` AND
  // `start-endpoint-mock-setup.ts` (source, not dist — the specs reach `endpointMock` through
  // `@dungeonmaster/testing`, which the `source` condition above resolves to src; a dist setup file
  // would build MSW's server from a SECOND module instance, so every handler a spec registers lands
  // on a server that is not the one listening, surfacing as "[MSW] Cannot bypass a request" rather
  // than a resolution error). Re-listing either path here would still work but drifts the moment
  // the base's own array changes.
  setupFilesAfterEnv: [...baseConfig.setupFilesAfterEnv, '@testing-library/jest-dom'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // Jest collects src/**/*.test.ts(x) plus harness unit tests under test/**/*.test.ts(x).
  // Playwright e2e specs (src/flows/**/*.e2e.ts) and harness fixtures (test/**/*.harness.ts)
  // deliberately do NOT match this pattern, so Jest never collects them — they run under
  // Playwright via playwright.config.ts.
  testMatch: ['**/src/**/*.test.[jt]s?(x)', '<rootDir>/test/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css|less|scss)$': '<rootDir>/src/__mocks__/style-mock.cjs',
    '^react$': reactDir,
    '^react-dom$': reactDomDir,
    '^react-dom/(.*)$': `${reactDomDir}/$1`,
    '^react/(.*)$': `${reactDir}/$1`,
    // Each mocked package is mapped under its `#gateway/npm/` name too. Through the gateway, the
    // pass-through's `export *` copies only the keys a mock can list, and the tabler mock answers
    // any `Icon*` name on demand without listing any.
    '^(#gateway/npm/)?elkjs$': '<rootDir>/src/__mocks__/elkjs-mock.cjs',
    '^(#gateway/npm/tabler__icons-react|@tabler/icons-react)$': '<rootDir>/src/__mocks__/tabler-icons-mock.cjs',
    '^(#gateway/npm/xyflow__react|@xyflow/react)$': '<rootDir>/src/__mocks__/xyflow-react-mock.cjs',
  },
  transformIgnorePatterns: ['/dist/', ignorePattern],
  transform: {
    // Own source only (.ts/.tsx, and .js/.jsx should this package ever add one) — anchoring the
    // node_modules ESM entry below is what keeps a genuine syntax error in an own-source file
    // throwing instead of being silently repaired by ts-jest's error-recovering `transpileModule`.
    // This package holds no `.js`/`.jsx` file of its own today (verified against `packages/web/**`),
    // so narrowing this from the previous combined `.m?[jt]sx?$` pattern changes nothing it runs
    // today and only removes a latent trap. See `node-modules-esm-transform-packages.js`'s own
    // header for the class of bug this guards against.
    '^.+\\.[jt]sx?$': [
      'ts-jest',
      {
        tsconfig: resolve(__dirname, 'tsconfig.test.json'),
        astTransformers: {
          before: [
            {
              path: require.resolve('../../packages/testing/ts-jest/proxy-mock-transformer.js'),
            },
          ],
        },
      },
    ],
    [nodeModulesEsmTransformPattern]: [
      'ts-jest',
      {
        tsconfig: resolve(__dirname, 'tsconfig.test.json'),
        astTransformers: {
          before: [
            {
              path: require.resolve('../../packages/testing/ts-jest/proxy-mock-transformer.js'),
            },
          ],
        },
      },
    ],
  },
};

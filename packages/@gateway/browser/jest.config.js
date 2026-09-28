// Extend shared Jest configuration with a jsdom environment — this package wraps browser
// globals (fetch, localStorage, WebSocket, indexedDB, document, ...), none of which exist under
// the base config's Node test environment.
const baseConfig = require('../../../jest.config.base.js');
const dungeonmasterTsJestOptions = require('../../../packages/testing/ts-jest/options.js');
const {
  buildNodeModulesEsmTransformPatterns,
} = require('../../../packages/testing/ts-jest/node-modules-esm-transform-packages.js');

const { ignorePattern, transformPattern } = buildNodeModulesEsmTransformPatterns();

module.exports = {
  ...baseConfig,
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    // `source` first is what makes a test resolve a sibling workspace package (@dungeonmaster/testing)
    // to its TypeScript rather than its last build — see jest.config.base.js's own comment on this.
    customExportConditions: ['source', 'require', 'default'],
    url: 'http://localhost',
  },
  // The base entry rides along: a plain override would drop the sandbox dungeonmaster home it
  // sets before this package's own test files import anything.
  setupFiles: [...baseConfig.setupFiles, '@dungeonmaster/testing/jsdom-polyfills'],
  // `@dungeonmaster/testing`'s root barrel pulls in msw (ESM), which jest's default
  // transformIgnorePatterns leaves untransformed.
  transformIgnorePatterns: ['/dist/', ignorePattern],
  transform: {
    // Own TypeScript source only — an unanchored `.js` match here also routes this package's own
    // real `.js` files through ts-jest's error-recovering `transpileModule`, silently repairing a
    // genuine syntax error. See `node-modules-esm-transform-packages.js`'s own header.
    '^.+\\.ts$': ['ts-jest', dungeonmasterTsJestOptions],
    [transformPattern]: ['ts-jest', dungeonmasterTsJestOptions],
  },
};

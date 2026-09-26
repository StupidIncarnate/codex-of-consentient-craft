// Extend shared Jest configuration with a jsdom environment — this package wraps browser
// globals (fetch, localStorage, WebSocket, indexedDB, document, ...), none of which exist under
// the base config's Node test environment.
const baseConfig = require('../../jest.config.base.js');

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
  setupFiles: [...baseConfig.setupFiles, '<rootDir>/src/__mocks__/jsdom-polyfills.cjs'],
};

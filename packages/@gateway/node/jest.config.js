// Extend shared Jest configuration
const baseConfig = require('../../../jest.config.base.js');
const dungeonmasterTsJestOptions = require('../../../packages/testing/ts-jest/options.js');
const {
  buildNodeModulesEsmTransformPatterns,
} = require('../../../packages/testing/ts-jest/node-modules-esm-transform-packages.js');

const { ignorePattern, transformPattern } = buildNodeModulesEsmTransformPatterns();

module.exports = {
  ...baseConfig,
  // `@dungeonmaster/testing`'s root barrel pulls in msw (ESM), which jest's default
  // transformIgnorePatterns leaves untransformed.
  transformIgnorePatterns: ['/dist/', ignorePattern],
  transform: {
    '^.+\\.ts$': ['ts-jest', dungeonmasterTsJestOptions],
    // msw's own `.js` is the only `.js` this package needs ts-jest to transpile (ESM to
    // commonjs). Matching `.js` more broadly routes every real file `dynamicImport` loads through
    // TypeScript's error-recovering parser instead of V8's own, so a genuinely broken file (see
    // dynamic-import.test.ts's syntax-error case) comes back parsed and valid instead of rejecting.
    [transformPattern]: ['ts-jest', dungeonmasterTsJestOptions],
  },
};

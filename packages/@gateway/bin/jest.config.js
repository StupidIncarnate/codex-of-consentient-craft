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
    // Own TypeScript source only — an unanchored `.js` match here also routes this package's own
    // real `.js` files (a broken-syntax fixture included) through ts-jest's error-recovering
    // `transpileModule`, silently repairing what should throw. See
    // `node-modules-esm-transform-packages.js`'s own header, and `@gateway/node`'s
    // `dynamic-import.test.ts` (fixed the same way in cdf22d643) for the live bug this class caused.
    '^.+\\.ts$': ['ts-jest', dungeonmasterTsJestOptions],
    [transformPattern]: ['ts-jest', dungeonmasterTsJestOptions],
  },
};

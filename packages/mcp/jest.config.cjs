// Extend shared Jest configuration
const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTsJestOptions = require('../testing/ts-jest/options.js');
const { buildNodeModulesEsmTransformPatterns } = require('../testing/ts-jest/node-modules-esm-transform-packages.js');

const { ignorePattern, transformPattern } = buildNodeModulesEsmTransformPatterns();

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src'],
  // Map .js imports to .ts files for ESM compatibility
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: ['/dist/', ignorePattern],
  transform: {
    // Own TypeScript source only — an unanchored `.js` match also routes this package's own real
    // `.js` files through ts-jest's error-recovering `transpileModule`. See
    // `node-modules-esm-transform-packages.js`'s own header.
    '^.+\\.ts$': ['ts-jest', dungeonmasterTsJestOptions],
    [transformPattern]: ['ts-jest', dungeonmasterTsJestOptions],
  },
};

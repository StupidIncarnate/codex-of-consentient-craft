// Extend shared Jest configuration
const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTsJestOptions = require('../../packages/testing/ts-jest/options.js');
const {
  buildNodeModulesEsmTransformPatterns,
} = require('../../packages/testing/ts-jest/node-modules-esm-transform-packages.js');

const { ignorePattern, transformPattern } = buildNodeModulesEsmTransformPatterns();

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/src/**/*.test.[jt]s', '**/bin/**/*.test.[jt]s', '**/test/**/*.test.[jt]s'],
  transformIgnorePatterns: [
    '/dist/',
    ignorePattern,
    '/packages/testing/src/jest\\.setup\\.js$',
  ],
  transform: {
    // Own TypeScript source only — an unanchored `.js` match also routes this package's own real
    // `.js` files through ts-jest's error-recovering `transpileModule`. See
    // `node-modules-esm-transform-packages.js`'s own header.
    '^.+\\.ts$': ['ts-jest', dungeonmasterTsJestOptions],
    [transformPattern]: ['ts-jest', dungeonmasterTsJestOptions],
  },
};

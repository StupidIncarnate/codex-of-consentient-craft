const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTsJestOptions = require('../../packages/testing/ts-jest/options.js');
const {
  buildNodeModulesEsmTransformPatterns,
} = require('../../packages/testing/ts-jest/node-modules-esm-transform-packages.js');

const { ignorePattern, transformPattern } = buildNodeModulesEsmTransformPatterns();

module.exports = {
  ...baseConfig,
  preset: undefined, // Override ts-jest preset to use our custom transform
  roots: ['<rootDir>/src', '<rootDir>/bin'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testMatch: ['**/src/**/*.test.ts', '**/bin/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: ['/dist/', ignorePattern],
  transform: {
    // Own TypeScript source only — an unanchored `.js`/`.jsx` match also routes this package's own
    // real `.js` files through ts-jest's error-recovering `transpileModule`. See
    // `node-modules-esm-transform-packages.js`'s own header.
    '^.+\\.tsx?$': ['ts-jest', dungeonmasterTsJestOptions],
    [transformPattern]: ['ts-jest', dungeonmasterTsJestOptions],
  },
};

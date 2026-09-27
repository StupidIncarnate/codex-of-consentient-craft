const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTsJestOptions = require('../../packages/testing/ts-jest/options.js');
const {
  buildNodeModulesEsmTransformPatterns,
} = require('../../packages/testing/ts-jest/node-modules-esm-transform-packages.js');

const { ignorePattern, transformPattern } = buildNodeModulesEsmTransformPatterns();

module.exports = {
  ...baseConfig,
  displayName: '@dungeonmaster/eslint-plugin',
  rootDir: __dirname,
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/tests/**/*.test.ts'],
  transformIgnorePatterns: ['/dist/', ignorePattern],
  transform: {
    // Own TypeScript source only — an unanchored `.js`/`.jsx` match also routes this package's own
    // real `.js` files through ts-jest's error-recovering `transpileModule`. See
    // `node-modules-esm-transform-packages.js`'s own header.
    '^.+\\.tsx?$': ['ts-jest', dungeonmasterTsJestOptions],
    [transformPattern]: ['ts-jest', dungeonmasterTsJestOptions],
  },
};

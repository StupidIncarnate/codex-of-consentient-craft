// Extend shared Jest configuration
const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTsJestOptions = require('../../packages/testing/ts-jest/options.js');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/src/**/*.test.[jt]s', '**/bin/**/*.test.[jt]s', '**/test/**/*.test.[jt]s'],
  transformIgnorePatterns: [
    '/dist/',
    '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)',
    '/packages/testing/src/jest\\.setup\\.js$',
  ],
  transform: {
    '^.+\\.[jt]s$': ['ts-jest', dungeonmasterTsJestOptions],
  },
};

const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTsJestOptions = require('../../packages/testing/ts-jest/options.js');

module.exports = {
  ...baseConfig,
  displayName: '@dungeonmaster/local-eslint',
  rootDir: __dirname,
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  transformIgnorePatterns: ['/dist/', '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)'],
  transform: {
    '^.+\\.[jt]sx?$': ['ts-jest', dungeonmasterTsJestOptions],
  },
};

// Extend shared Jest configuration
const baseConfig = require('../../../jest.config.base.js');
const dungeonmasterTsJestOptions = require('../../../packages/testing/ts-jest/options.js');

module.exports = {
  ...baseConfig,
  // `@dungeonmaster/testing`'s root barrel pulls in msw (ESM), which jest's default
  // transformIgnorePatterns leaves untransformed.
  transformIgnorePatterns: ['/dist/', '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)'],
  transform: {
    '^.+\\.[jt]s$': ['ts-jest', dungeonmasterTsJestOptions],
  },
};

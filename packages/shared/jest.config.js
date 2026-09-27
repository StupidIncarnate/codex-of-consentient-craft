// Extend shared Jest configuration
const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTsJestOptions = require('../../packages/testing/ts-jest/options.js');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src'],
  // `@dungeonmaster/testing`'s root barrel (`installTestbedCreateBroker`, `BaseNameStub`) pulls in
  // its own MSW-backed endpoint-mock flow, and MSW ships ESM-only `.js` in `node_modules` — the
  // base config's default `transformIgnorePatterns` ignores all of `node_modules`, so Jest chokes
  // on MSW's bare `export`.
  transformIgnorePatterns: ['/dist/', '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)'],
  transform: {
    '^.+\\.[jt]s$': ['ts-jest', dungeonmasterTsJestOptions],
  },
};

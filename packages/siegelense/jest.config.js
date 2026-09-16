const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTransformers = require('../../packages/testing/ts-jest/transformers.js');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
  // `@dungeonmaster/testing`'s root barrel pulls in msw (ESM), which jest's default
  // transformIgnorePatterns leaves untransformed — matches packages/orchestrator and packages/cli,
  // both of which need this for the same `installTestbedCreateBroker` import their own install-flow
  // integration tests use.
  transformIgnorePatterns: ['/dist/', '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)'],
  transform: {
    '^.+\\.[jt]s$': [
      'ts-jest',
      {
        tsconfig: {
          allowJs: true,
          esModuleInterop: true,
          skipLibCheck: true,
          isolatedModules: true,
        },
        astTransformers: {
          before: dungeonmasterTransformers,
        },
      },
    ],
  },
};

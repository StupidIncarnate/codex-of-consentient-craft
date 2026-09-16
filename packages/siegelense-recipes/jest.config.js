const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTransformers = require('../../packages/testing/ts-jest/transformers.js');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/src/**/*.test.[jt]s', '**/test/**/*.test.[jt]s'],
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
  // `@dungeonmaster/testing`'s root barrel (`installTestbedCreateBroker`, `BaseNameStub`) pulls in
  // its own MSW-backed endpoint-mock flow, and MSW ships ESM-only `.js` in `node_modules` — the
  // repo-root base config's default `transformIgnorePatterns` ignores all of `node_modules`, so
  // Jest chokes on MSW's bare `export`. `packages/orchestrator/jest.config.js` carries the
  // identical override for the identical import; mirrored here rather than moved to the shared
  // base, matching this repo's own "no two jest configs are alike" precedent.
  transformIgnorePatterns: [
    '/dist/',
    '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)',
    '/packages/testing/src/jest\\.setup\\.js$',
  ],
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

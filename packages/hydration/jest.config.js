const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTransformers = require('../../packages/testing/ts-jest/transformers.js');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
  // `test/harnesses/file-target/file-target.harness.ts` imports `@dungeonmaster/testing`'s root
  // barrel (for `installTestbedCreateBroker`, `BaseNameStub`, `RelativePathStub`), which pulls in
  // msw's ESM `until-async` — every other package resolving that barrel carries this same pair
  // (`packages/orchestrator`, `packages/cli`, `packages/config`, …); this package's config never
  // needed it before its first integration suite that reaches the harness.
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

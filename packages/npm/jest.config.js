// Extend shared Jest configuration
const dungeonmasterTransformers = require('../../packages/testing/ts-jest/transformers.js');
const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  // The gateway is flat — no `src/`, each outside package gets its own folder at the package
  // root — so the base config's `**/src/**` testMatch never finds anything here.
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.[jt]s'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // msw's own dependencies (until-async, outvariant, @mswjs/*) ship ESM .js with no CJS build.
  // `transformIgnorePatterns` alone is not enough — the base config's transform key only matches
  // `.ts`, so an allowed `.js` still passes through untransformed. Match packages/testing and
  // packages/hooks: widen `transform` to `[jt]s` too, so ts-jest (allowJs: true) handles them.
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
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
};

// Extend shared Jest configuration
const dungeonmasterTransformers = require('../../packages/testing/ts-jest/transformers.js');
const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
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
};

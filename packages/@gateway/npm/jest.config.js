// Extend shared Jest configuration
const dungeonmasterTransformers = require('../../../packages/testing/ts-jest/transformers.js');
const baseConfig = require('../../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  // msw's own dependencies (until-async, outvariant, @mswjs/*) ship ESM .js with no CJS build.
  // `transformIgnorePatterns` alone is not enough — the base config's transform key only matches
  // `.ts`, so an allowed `.js` still passes through untransformed. Match packages/testing and
  // packages/hooks: widen `transform` to `[jt]s` too, so ts-jest (allowJs: true) handles them.
  transformIgnorePatterns: ['/dist/', '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)'],
  // The base entry rides along: a plain override would drop the sandbox dungeonmaster home it
  // sets before this package's own test files import anything. The extra entry only matters for a
  // file whose own `@jest-environment jsdom` docblock switches it out of this package's default
  // node environment (`@testing-library/react/render.test.ts`) — a node-environment file already
  // has a real `setImmediate`, so the polyfill's own guard is a no-op there.
  setupFiles: [...baseConfig.setupFiles, '<rootDir>/src/__mocks__/jsdom-polyfills.cjs'],
  transform: {
    '^.+\\.[jt]s$': [
      'ts-jest',
      {
        tsconfig: {
          allowJs: true,
          esModuleInterop: true,
          skipLibCheck: true,
          isolatedModules: true,
          module: 'commonjs',
          moduleResolution: 'node',
        },
        astTransformers: {
          before: dungeonmasterTransformers,
        },
      },
    ],
  },
};

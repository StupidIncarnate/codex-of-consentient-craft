// Extend shared Jest configuration
const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTsJestOptions = require('../../packages/testing/ts-jest/options.js');
const {
  buildNodeModulesEsmTransformPatterns,
} = require('../../packages/testing/ts-jest/node-modules-esm-transform-packages.js');

const { ignorePattern, transformPattern } = buildNodeModulesEsmTransformPatterns();

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src'],
  // `@dungeonmaster/testing`'s root barrel (`installTestbedCreateBroker`, `BaseNameStub`) pulls in
  // its own MSW-backed endpoint-mock flow, and MSW ships ESM-only `.js` in `node_modules` — the
  // base config's default `transformIgnorePatterns` ignores all of `node_modules`, so Jest chokes
  // on MSW's bare `export`.
  transformIgnorePatterns: ['/dist/', ignorePattern],
  transform: {
    // Own TypeScript source only — an unanchored `.js` match also routes this package's own real
    // `.js` files through ts-jest's error-recovering `transpileModule`. See
    // `node-modules-esm-transform-packages.js`'s own header.
    '^.+\\.ts$': ['ts-jest', dungeonmasterTsJestOptions],
    [transformPattern]: ['ts-jest', dungeonmasterTsJestOptions],
  },
};

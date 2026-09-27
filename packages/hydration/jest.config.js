const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTsJestOptions = require('../../packages/testing/ts-jest/options.js');
const {
  buildNodeModulesEsmTransformPatterns,
} = require('../../packages/testing/ts-jest/node-modules-esm-transform-packages.js');

const { ignorePattern, transformPattern } = buildNodeModulesEsmTransformPatterns();

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src'],
  // `test/harnesses/file-target/file-target.harness.ts` imports `@dungeonmaster/testing`'s root
  // barrel (for `installTestbedCreateBroker`, `BaseNameStub`, `RelativePathStub`), which pulls in
  // msw's ESM `until-async` — every other package resolving that barrel carries this same pair
  // (`packages/orchestrator`, `packages/cli`, `packages/config`, …); this package's config never
  // needed it before its first integration suite that reaches the harness.
  transformIgnorePatterns: ['/dist/', ignorePattern],
  transform: {
    // Own TypeScript source only — an unanchored `.js` match also routes this package's own real
    // `.js` files through ts-jest's error-recovering `transpileModule`. See
    // `node-modules-esm-transform-packages.js`'s own header.
    '^.+\\.ts$': ['ts-jest', dungeonmasterTsJestOptions],
    [transformPattern]: ['ts-jest', dungeonmasterTsJestOptions],
  },
};

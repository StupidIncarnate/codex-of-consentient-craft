const dungeonmasterTsJestOptions = require('./ts-jest/options.js');
const {
  buildNodeModulesEsmTransformPatterns,
} = require('./ts-jest/node-modules-esm-transform-packages.js');

const { ignorePattern: nodeModulesEsmIgnorePattern, transformPattern: nodeModulesEsmTransformPattern } =
  buildNodeModulesEsmTransformPatterns();

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // This config spreads nothing, so the repo's jest.config.base.js copy of this key never reaches
  // it — the two have to be kept in step by hand.
  testEnvironmentOptions: { customExportConditions: ['source', 'require', 'default'] },
  // A `@jest-environment jsdom` docblock file (e.g. `mantine-render-adapter.test.ts`) reaches
  // `setupFilesAfterEnv`'s `start-endpoint-mock-setup.ts` with no `Response` global —
  // `import { setupServer } from 'msw/node'` needs it at import time
  // (`@mswjs/interceptors`'s own `fetchUtils`), before this test file's own code runs, so a
  // polyfill written there arrives too late. `packages/@gateway/npm/jest.config.js` solves the
  // identical gap the same way.
  setupFiles: ['<rootDir>/../@gateway/browser/__mocks__/jsdom-polyfills.cjs'],
  setupFilesAfterEnv: [
    '<rootDir>/src/jest.setup.js',
    '<rootDir>/src/startup/start-endpoint-mock-setup.ts',
  ],
  testMatch: ['**/src/**/*.test.ts', '**/src/**/*.integration.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: ['/dist/', nodeModulesEsmIgnorePattern],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    // Own TypeScript source only — an unanchored `.js` match here would also route this package's
    // OWN `.js` fixtures through ts-jest's error-recovering `transpileModule`. See
    // `node-modules-esm-transform-packages.js`'s own header.
    '^.+\\.ts$': ['ts-jest', dungeonmasterTsJestOptions],
    [nodeModulesEsmTransformPattern]: ['ts-jest', dungeonmasterTsJestOptions],
  },
  coverageDirectory: 'coverage',
  verbose: false,
};

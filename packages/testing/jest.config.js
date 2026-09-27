const dungeonmasterTsJestOptions = require('./ts-jest/options.js');

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
  transformIgnorePatterns: ['/dist/', '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.[jt]s$': ['ts-jest', dungeonmasterTsJestOptions],
  },
  coverageDirectory: 'coverage',
  verbose: false,
};

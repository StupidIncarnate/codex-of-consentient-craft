const dungeonmasterTransformers = require('./packages/testing/ts-jest/transformers.js');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // `source` first is what makes a test read a sibling workspace package's TypeScript rather than
  // its last build — see packages/config/src/module-resolution.integration.test.ts.
  testEnvironmentOptions: { customExportConditions: ['source', 'require', 'default'] },
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
  testMatch: ['**/src/**/*.test.[jt]s', '**/bin/**/*.test.[jt]s'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/tmp/', '/hypothesis/', '/dist/'],
  modulePathIgnorePatterns: ['/tests/tmp/', '/hypothesis/'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          allowJs: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
        astTransformers: {
          before: dungeonmasterTransformers,
        },
      },
    ],
  },
  coverageDirectory: 'coverage',
  verbose: false,
  detectOpenHandles: true,
  forceExit: true,
};

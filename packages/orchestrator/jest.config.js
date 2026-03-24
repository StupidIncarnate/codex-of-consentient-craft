// Extend shared Jest configuration
const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTransformers = require('../../packages/testing/ts-jest/transformers.js');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/src/**/*.test.[jt]s', '**/bin/**/*.test.[jt]s', '**/test/**/*.test.[jt]s'],
  // Override setupFilesAfterEnv to use correct relative path from this package
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
  transformIgnorePatterns: ['/dist/', '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)'],
  transform: {
    '^.+\\.[jt]s$': [
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
};

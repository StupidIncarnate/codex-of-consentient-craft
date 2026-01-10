const { resolve } = require('path');
const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  preset: undefined, // Override ts-jest preset to use our custom transform
  roots: ['<rootDir>/src', '<rootDir>/bin'],
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testMatch: ['**/src/**/*.test.ts', '**/src/**/*.test.tsx', '**/bin/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: resolve(__dirname, 'tsconfig.json'),
        astTransformers: {
          before: [
            {
              path: require.resolve('../../packages/testing/ts-jest/proxy-mock-transformer.js'),
            },
          ],
        },
      },
    ],
  },
};

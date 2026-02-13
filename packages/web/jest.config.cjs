const { resolve } = require('path');
const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  preset: undefined,
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
    url: 'http://localhost',
  },
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/src/__mocks__/jsdom-polyfills.cjs'],
  setupFilesAfterEnv: [
    '<rootDir>/../../packages/testing/src/jest.setup.js',
    '<rootDir>/../../packages/testing/dist/startup/start-endpoint-mock-setup.js',
    '@testing-library/jest-dom',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/src/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css|less|scss)$': '<rootDir>/src/__mocks__/style-mock.cjs',
    '^react$': resolve(__dirname, 'node_modules/react'),
    '^react-dom$': resolve(__dirname, 'node_modules/react-dom'),
    '^react-dom/(.*)$': resolve(__dirname, 'node_modules/react-dom/$1'),
    '^react/(.*)$': resolve(__dirname, 'node_modules/react/$1'),
  },
  transformIgnorePatterns: [
    '/dist/',
    '/node_modules/(?!(msw|@mswjs|until-async|outvariant|undici)/)',
  ],
  transform: {
    '^.+\\.m?[jt]sx?$': [
      'ts-jest',
      {
        tsconfig: resolve(__dirname, 'tsconfig.test.json'),
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

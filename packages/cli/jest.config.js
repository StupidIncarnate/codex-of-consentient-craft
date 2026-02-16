const { resolve } = require('path');
const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  preset: undefined, // Override ts-jest preset to use our custom transform
  roots: ['<rootDir>/src', '<rootDir>/bin'],
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testMatch: ['**/src/**/*.test.ts', '**/bin/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: ['/dist/', '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'ts-jest',
      {
        tsconfig: {
          allowJs: true,
          esModuleInterop: true,
          skipLibCheck: true,
          module: 'commonjs',
          moduleResolution: 'node',
        },
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

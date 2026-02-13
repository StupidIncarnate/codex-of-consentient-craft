const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  displayName: '@dungeonmaster/eslint-plugin',
  rootDir: __dirname,
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/tests/**/*.test.ts'],
  transformIgnorePatterns: ['/dist/', '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'ts-jest',
      {
        tsconfig: {
          allowJs: true,
          esModuleInterop: true,
          skipLibCheck: true,
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

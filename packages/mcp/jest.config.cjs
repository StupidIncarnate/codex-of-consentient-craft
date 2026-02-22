// Extend shared Jest configuration
const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src'],
  // Override setupFilesAfterEnv to use correct relative path from this package
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
  // Map .js imports to .ts files for ESM compatibility
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
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

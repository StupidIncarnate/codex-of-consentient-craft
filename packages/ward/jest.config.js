const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
  transformIgnorePatterns: ['/dist/', '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)'],
  transform: {
    '^.+\\.[jt]s$': [
      'ts-jest',
      {
        tsconfig: { allowJs: true, esModuleInterop: true, skipLibCheck: true },
        astTransformers: {
          before: [{
            path: require.resolve('../../packages/testing/ts-jest/proxy-mock-transformer.js'),
          }],
        },
      },
    ],
  },
};

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '<rootDir>/src/jest.setup.js',
    '<rootDir>/src/startup/start-endpoint-mock-setup.ts',
  ],
  testMatch: ['**/src/**/*.test.ts', '**/src/**/*.integration.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: ['/dist/', '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)'],
  moduleFileExtensions: ['ts', 'js', 'json'],
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
              path: require.resolve('./ts-jest/proxy-mock-transformer.js'),
            },
          ],
        },
      },
    ],
  },
  coverageDirectory: 'coverage',
  verbose: false,
};

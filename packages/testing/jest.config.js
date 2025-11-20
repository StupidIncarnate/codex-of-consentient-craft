module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.js'],
  testMatch: ['**/src/**/*.test.ts', '**/src/**/*.integration.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
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
          before: [
            {
              path: require.resolve(
                './dist/adapters/typescript/proxy-mock-transformer/typescript-proxy-mock-transformer-adapter.js',
              ),
            },
          ],
        },
      },
    ],
  },
  coverageDirectory: 'coverage',
  verbose: true,
};

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
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
      },
    ],
  },
  coverageDirectory: 'coverage',
  verbose: true,
};

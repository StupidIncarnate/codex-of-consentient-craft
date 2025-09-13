module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/packages/testing/src/jest.setup.js'],
  testMatch: ['**/tests/**/*.test.[jt]s', '**/bin/**/*.test.[jt]s', '**/src/**/*.test.[jt]s'],
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
  collectCoverageFrom: [
    'src/**/*.js',
    'tests/utils/**/*.ts',
    '!**/node_modules/**',
      '!**/tests/**/*.test.[jt]s',
  ],
  coverageDirectory: 'coverage',
    verbose: true,
};

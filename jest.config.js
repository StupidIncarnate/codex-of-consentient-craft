module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.[jt]s'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/tmp/'],
  modulePathIgnorePatterns: ['/tests/tmp/'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        allowJs: true,
        esModuleInterop: true,
        skipLibCheck: true
      }
    }]
  },
  collectCoverageFrom: [
    'bin/**/*.js',
    'src/**/*.js',
    'tests/utils/**/*.ts',
    '!**/node_modules/**',
    '!**/tests/**/*.test.[jt]s'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};
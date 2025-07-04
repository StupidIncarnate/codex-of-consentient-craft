module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.[jt]s'],
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
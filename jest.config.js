module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.[jt]s', '**/bin/**/*.test.[jt]s', '**/src/**/*.test.[jt]s'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/tmp/', '/hypothesis/'],
  modulePathIgnorePatterns: ['/tests/tmp/', '/hypothesis/'],
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
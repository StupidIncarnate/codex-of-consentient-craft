module.exports = {
  projects: [
    '<rootDir>/packages/*'
  ],
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.test.ts'
  ]
};
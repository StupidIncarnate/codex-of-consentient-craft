module.exports = {
  projects: [
    '<rootDir>/packages/*'
  ],
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'packages/*/src/**/*.js',
    '!packages/*/src/**/*.test.js'
  ]
};
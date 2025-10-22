const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  displayName: '@questmaestro/eslint-plugin',
  rootDir: __dirname,
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/tests/**/*.test.ts'],
};

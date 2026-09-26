// Extend shared Jest configuration
const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  // The gateway is flat — no `src/`, each outside package gets its own folder at the package
  // root — so the base config's `**/src/**` testMatch never finds anything here.
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.[jt]s'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
};

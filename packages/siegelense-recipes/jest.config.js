const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
};

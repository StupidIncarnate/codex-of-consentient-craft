// Extend shared Jest configuration
const baseConfig = require('../../jest.config.base.js');

module.exports = {
    ...baseConfig,
    roots: ['<rootDir>/src'],
    // Override setupFilesAfterEnv to use correct relative path from this package
    setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
};

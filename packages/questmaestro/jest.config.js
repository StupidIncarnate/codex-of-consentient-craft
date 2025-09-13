// Extend shared Jest configuration
const baseConfig = require('../../jest.config.base.js');

module.exports = {
    ...baseConfig,
    roots: ['<rootDir>/src', '<rootDir>/bin'],
    // Override setupFilesAfterEnv to use correct relative path from this package
    setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
    collectCoverageFrom: [
        'src/**/*.ts',
        'bin/**/*.ts',
        '!src/**/*.test.ts',
        '!bin/**/*.test.ts',
        '!src/**/*.d.ts',
    ],
};

/**
 * Jest configuration for E2E tests
 *
 * Features:
 * - Extended timeout (120s) for real CLI execution with Claude spawning
 * - E2E-specific test pattern (*.e2e.test.ts)
 * - Testbed cleanup and environment setup
 * - Headless mode environment variables
 */

const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,

  // Override test pattern for E2E tests
  testMatch: ['**/*.e2e.test.ts'],

  // Root directory for E2E tests
  roots: ['<rootDir>'],

  // E2E-specific setup file
  setupFilesAfterEnv: [
    '<rootDir>/../../packages/testing/src/jest.setup.js',
    '<rootDir>/setup.ts',
  ],

  // Extended timeout for E2E tests (120 seconds)
  // Real Claude spawning and CLI operations take time
  testTimeout: 120000,

  // Run tests sequentially to avoid resource conflicts
  // E2E tests may share testbed directories or spawn Claude processes
  maxWorkers: 1,

  // Ignore paths
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/tmp/',
    '/hypothesis/',
    '/dist/',
  ],

  // Module paths to ignore during test discovery
  modulePathIgnorePatterns: ['/tests/tmp/', '/hypothesis/'],

  // Display name for test runner output
  displayName: {
    name: 'E2E',
    color: 'magenta',
  },

  // Verbose output for E2E tests to track long-running operations
  verbose: true,

  // Reporter configuration for detailed E2E output
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/../../coverage/e2e',
        outputName: 'junit-e2e.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' > ',
        usePathForSuiteName: true,
      },
    ],
  ].filter((reporter) => {
    // Only include jest-junit if available
    if (Array.isArray(reporter) && reporter[0] === 'jest-junit') {
      try {
        require.resolve('jest-junit');
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }),

  // Global variables available in tests
  globals: {
    E2E_TIMEOUT: 120000,
    E2E_CLAUDE_MODEL: 'sonnet',
  },
};

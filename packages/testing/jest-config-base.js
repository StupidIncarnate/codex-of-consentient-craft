/**
 * Portable Jest base config for repos consuming @dungeonmaster/testing.
 *
 * Spread it from a package's jest.config.js:
 *
 *   const base = require('@dungeonmaster/testing/jest-config-base');
 *   module.exports = { ...base, roots: ['<rootDir>/src'] };
 *
 * It registers the dungeonmaster ts-jest AST transformers (so registerMock / proxy
 * files work) and the auto-reset jest.setup (clears mocks, bans .skip/.todo, fails
 * assertion-less tests). Paths resolve inside the installed @dungeonmaster/testing.
 */
'use strict';

const path = require('path');

const dungeonmasterTransformers = require('./ts-jest/transformers.js');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: [path.join(__dirname, 'src', 'jest.setup.js')],
  testMatch: ['**/src/**/*.test.[jt]s', '**/bin/**/*.test.[jt]s'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: { allowJs: true, esModuleInterop: true, skipLibCheck: true },
        astTransformers: { before: dungeonmasterTransformers },
      },
    ],
  },
  coverageDirectory: 'coverage',
  verbose: false,
  detectOpenHandles: true,
  forceExit: true,
};

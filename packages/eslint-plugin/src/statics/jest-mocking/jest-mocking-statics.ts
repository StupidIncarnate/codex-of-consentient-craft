/**
 * PURPOSE: Defines allowed and banned Jest mocking functions for consistent test patterns
 *
 * USAGE:
 * import { jestMockingStatics } from './statics/jest-mocking/jest-mocking-statics';
 * const isBanned = jestMockingStatics.bannedFunctions.includes('spyOn');
 * // Returns true
 * const isAllowedGlobal = jestMockingStatics.allowedSpyOnGlobals.includes('Date');
 * // Returns true
 *
 * WHEN-TO-USE: When implementing Jest mocking rules or validating test code patterns
 */
export const jestMockingStatics = {
  allowedSpyOnGlobals: ['Date', 'crypto', 'console', 'Math', 'process'],
  bannedFunctions: [
    // Module mocking
    'mock',
    'unmock',
    'deepUnmock',
    'dontMock',
    'doMock',
    'setMock',
    'createMockFromModule',
    // Spying
    'spyOn',
    // Mock utilities
    'mocked',
    // Module system
    'requireActual',
    'requireMock',
    'resetModules',
    'isolateModules',
    'isolateModulesAsync',
    // Property mocking
    'replaceProperty',
  ],
  mockMethods: [
    'mockImplementation',
    'mockResolvedValue',
    'mockRejectedValue',
    'mockReturnValue',
    'mockReturnValueOnce',
    'mockResolvedValueOnce',
    'mockRejectedValueOnce',
  ],
} as const;

/**
 * PURPOSE: Defines allowed and banned Jest mocking functions for consistent test patterns
 *
 * USAGE:
 * import { jestMockingStatics } from './statics/jest-mocking/jest-mocking-statics';
 * const isBanned = jestMockingStatics.bannedFunctions.includes('spyOn');
 * // Returns true
 * const isAllowedGlobal = jestMockingStatics.allowedSpyOnGlobals.includes('Date');
 * // Returns true
 * const isStagingCall = jestMockingStatics.chainedMockStagingMethodSet.has('calledWith');
 * // Returns true — handle.calledWith([args]) starts an argument-addressed mock chain
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
  mockMethodSet: new Set([
    'mockImplementation',
    'mockResolvedValue',
    'mockRejectedValue',
    'mockReturnValue',
    'mockReturnValueOnce',
    'mockResolvedValueOnce',
    'mockRejectedValueOnce',
  ]),
  // Argument-addressed staging (registerMock): handle.calledWith([args]) / handle.onceFor([args])
  // describe a call and, chained with a result method below, what it gets back. Valid as a bare
  // statement on their own (the description alone) or as the object of a chained result call.
  chainedMockStagingMethods: ['calledWith', 'onceFor'],
  chainedMockStagingMethodSet: new Set(['calledWith', 'onceFor']),
  // Result methods only count as mock setup when chained onto a staging call above:
  // handle.calledWith([args]).resolves(value) — not when called on an arbitrary object.
  chainedMockResultMethods: ['returns', 'resolves', 'rejects', 'throws', 'implement'],
  chainedMockResultMethodSet: new Set(['returns', 'resolves', 'rejects', 'throws', 'implement']),
  // handle.callsMatching([args]) reads recorded calls for an argument description. Valid bare,
  // same as the staging methods, but never chains into a result method.
  chainedMockQueryMethods: ['callsMatching'],
  chainedMockQueryMethodSet: new Set(['callsMatching']),
} as const;

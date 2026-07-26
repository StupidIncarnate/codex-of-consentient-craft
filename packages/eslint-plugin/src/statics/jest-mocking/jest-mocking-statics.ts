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
  // Native Jest mock-function methods (mockImplementation, mockReturnValue, etc). These are NOT
  // part of registerMock's MockHandle (which exposes only calledWith/onceFor/callsMatching) —
  // a MockHandle never carries these names. They stay real and checked-for wherever raw
  // jest.fn()/jest.mocked()/jest.spyOn() results are still legitimately used directly: a harness
  // constructor building its own jest.fn() stub, or the adapter/side-effect layer brokers
  // recognizing native jest mocking as already-set-up rather than a banned side effect.
  nativeJestMockMethods: [
    'mockImplementation',
    'mockResolvedValue',
    'mockRejectedValue',
    'mockReturnValue',
    'mockReturnValueOnce',
    'mockResolvedValueOnce',
    'mockRejectedValueOnce',
  ],
  nativeJestMockMethodSet: new Set([
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

import { jestMockingStatics } from './jest-mocking-statics';

describe('jestMockingStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(jestMockingStatics).toStrictEqual({
      allowedSpyOnGlobals: ['Date', 'crypto', 'console', 'Math', 'process'],
      bannedFunctions: [
        'mock',
        'unmock',
        'deepUnmock',
        'dontMock',
        'doMock',
        'setMock',
        'createMockFromModule',
        'spyOn',
        'mocked',
        'requireActual',
        'requireMock',
        'resetModules',
        'isolateModules',
        'isolateModulesAsync',
        'replaceProperty',
      ],
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
      chainedMockStagingMethods: ['calledWith', 'onceFor'],
      chainedMockStagingMethodSet: new Set(['calledWith', 'onceFor']),
      chainedMockResultMethods: ['returns', 'resolves', 'rejects', 'throws', 'implement'],
      chainedMockResultMethodSet: new Set([
        'returns',
        'resolves',
        'rejects',
        'throws',
        'implement',
      ]),
      chainedMockQueryMethods: ['callsMatching'],
      chainedMockQueryMethodSet: new Set(['callsMatching']),
    });
  });
});

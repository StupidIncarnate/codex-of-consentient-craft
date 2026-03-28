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
    });
  });
});

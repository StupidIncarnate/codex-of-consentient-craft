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

import { jestTestingStatics } from './jest-testing-statics';

describe('jestTestingStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(jestTestingStatics).toStrictEqual({
      methods: ['test', 'it', 'describe'],
      forbiddenSuffixes: ['todo', 'skip'],
      cleanupFunctions: [
        'clearAllMocks',
        'resetAllMocks',
        'restoreAllMocks',
        'resetModuleRegistry',
      ],
    });
  });
});

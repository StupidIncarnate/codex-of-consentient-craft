import { eslintStripKeysStatics } from './eslint-strip-keys-statics';

describe('eslintStripKeysStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(eslintStripKeysStatics).toStrictEqual({
      keys: ['stats', 'usedDeprecatedRules'],
    });
  });
});

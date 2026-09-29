import { FlatConfigStub } from './flat-config.stub';

describe('FlatConfigStub', () => {
  it('VALID: {} => the default files, ignores and rule', () => {
    expect(FlatConfigStub()).toStrictEqual({
      files: ['**/*.ts'],
      ignores: ['dist/**'],
      rules: { 'no-console': 'error' },
    });
  });

  it('VALID: {files, ignores, rules} => reflects the given values', () => {
    expect(
      FlatConfigStub({ files: ['a.js'], ignores: [], rules: { 'no-var': 'warn' } }),
    ).toStrictEqual({ files: ['a.js'], ignores: [], rules: { 'no-var': 'warn' } });
  });
});

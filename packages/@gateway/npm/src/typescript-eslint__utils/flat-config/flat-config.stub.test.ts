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

  it('VALID: {plugins, languageOptions} => carries both beside the defaults', () => {
    const plugin = { meta: { name: 'demo' } };

    expect(
      FlatConfigStub({ plugins: { demo: plugin }, languageOptions: { ecmaVersion: 2022 } }),
    ).toStrictEqual({
      files: ['**/*.ts'],
      ignores: ['dist/**'],
      rules: { 'no-console': 'error' },
      plugins: { demo: plugin },
      languageOptions: { ecmaVersion: 2022 },
    });
  });
});

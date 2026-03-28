import { eslintConfigFilesStatics } from './eslint-config-files-statics';

describe('eslintConfigFilesStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(eslintConfigFilesStatics).toStrictEqual([
      'eslint.config.js',
      'eslint.config.mjs',
      'eslint.config.cjs',
    ]);
  });
});

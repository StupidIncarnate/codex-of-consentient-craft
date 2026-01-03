import { eslintConfigFilesStatics } from './eslint-config-files-statics';

describe('eslintConfigFilesStatics', () => {
  it('VALID: contains all ESLint config file variants', () => {
    expect(eslintConfigFilesStatics).toStrictEqual([
      'eslint.config.js',
      'eslint.config.mjs',
      'eslint.config.cjs',
    ]);
  });

  it('VALID: is readonly array', () => {
    expect(Array.isArray(eslintConfigFilesStatics)).toBe(true);
  });

  it('VALID: contains exactly 3 config files', () => {
    expect(eslintConfigFilesStatics).toHaveLength(3);
  });
});

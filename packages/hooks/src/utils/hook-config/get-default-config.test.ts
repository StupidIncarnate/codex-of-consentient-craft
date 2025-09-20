import { getDefaultConfig } from './get-default-config';

describe('getDefaultConfig', () => {
  it('VALID: {} => returns default PreEditLintConfig', () => {
    const result = getDefaultConfig();

    expect(result).toStrictEqual({
      rules: [
        '@typescript-eslint/no-explicit-any',
        '@typescript-eslint/ban-ts-comment',
        'eslint-comments/no-use',
      ],
    });
  });
});

import { hookConfigUtilGetDefaultConfig } from './hook-config-util-get-default-config';

describe('hookConfigUtilGetDefaultConfig', () => {
  it('VALID: {} => returns default PreEditLintConfig', () => {
    const result = hookConfigUtilGetDefaultConfig();

    expect(result).toStrictEqual({
      rules: [
        '@typescript-eslint/no-explicit-any',
        '@typescript-eslint/ban-ts-comment',
        'eslint-comments/no-use',
      ],
    });
  });
});

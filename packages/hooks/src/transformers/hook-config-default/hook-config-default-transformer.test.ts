import { hookConfigDefaultTransformer } from './hook-config-default-transformer';

describe('hookConfigDefaultTransformer', () => {
  it('VALID: {} => returns default PreEditLintConfig', () => {
    const result = hookConfigDefaultTransformer();

    expect(result).toStrictEqual({
      rules: [
        '@typescript-eslint/no-explicit-any',
        '@typescript-eslint/ban-ts-comment',
        'eslint-comments/no-use',
      ],
    });
  });
});

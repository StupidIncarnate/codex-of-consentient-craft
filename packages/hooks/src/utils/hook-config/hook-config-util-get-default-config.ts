import type { PreEditLintConfig } from '../../types/config-type';

export const hookConfigUtilGetDefaultConfig = (): PreEditLintConfig => ({
  rules: [
    '@typescript-eslint/no-explicit-any',
    '@typescript-eslint/ban-ts-comment',
    'eslint-comments/no-use',
  ],
});

import type { PreEditLintConfig } from '../../types/config-type';

export const hookConfigDefaultTransformer = (): PreEditLintConfig => ({
  rules: [
    '@typescript-eslint/no-explicit-any',
    '@typescript-eslint/ban-ts-comment',
    'eslint-comments/no-use',
  ],
});

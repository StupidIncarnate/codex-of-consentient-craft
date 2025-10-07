import type { PreEditLintConfig } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { preEditLintConfigContract } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';

export const hookConfigDefaultTransformer = (): PreEditLintConfig =>
  preEditLintConfigContract.parse({
    rules: [
      '@typescript-eslint/no-explicit-any',
      '@typescript-eslint/ban-ts-comment',
      'eslint-comments/no-use',
      'jest/no-restricted-jest-methods',
      'jest/no-restricted-matchers',
    ],
  });

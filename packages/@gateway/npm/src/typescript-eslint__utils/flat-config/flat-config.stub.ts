/**
 * PURPOSE: A real `TSESLint.FlatConfig.Config`, typed by the library rather than a local copy.
 *
 * USAGE:
 * const config = FlatConfigStub({ files: ['**\/*.ts'], rules: { 'no-console': 'error' } });
 * // Returns a FlatConfig.Config with the given files, ignores and rules
 */
import type { TSESLint } from '@typescript-eslint/utils';

export const FlatConfigStub = ({
  files = ['**/*.ts'],
  ignores = ['dist/**'],
  rules = { 'no-console': 'error' },
}: {
  files?: string[];
  ignores?: string[];
  rules?: TSESLint.FlatConfig.Rules;
} = {}): TSESLint.FlatConfig.Config => ({ files, ignores, rules });

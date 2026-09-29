/**
 * PURPOSE: Zod schema for ESLint Linter.Config with minimal required properties
 *
 * USAGE:
 * const config = linterConfigContract.parse({ rules: { 'no-console': 'error' } });
 * // Returns validated LinterConfig object
 */
import { z } from '#gateway/npm/zod';

import { eslintRuleNameContract } from '../eslint-rule-name/eslint-rule-name-contract';

export const linterConfigContract = z.object({
  rules: z.record(eslintRuleNameContract, z.unknown()).optional(),
  files: z.array(z.string().brand<'FilePattern'>()).optional(),
  plugins: z.unknown().optional(), // ESLint plugins configuration
  languageOptions: z.unknown().optional(), // TypeScript parser and parser options
});

export type LinterConfig = z.infer<typeof linterConfigContract>;

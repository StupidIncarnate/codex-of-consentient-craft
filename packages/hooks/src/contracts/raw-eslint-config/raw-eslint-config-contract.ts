/**
 * PURPOSE: Zod schema for raw ESLint config returned by calculateConfigForFile
 *
 * USAGE:
 * const config = rawEslintConfigContract.parse(rawConfig);
 * // Returns validated RawEslintConfig with all ESLint v9 fields
 */
import { z } from 'zod';

import { eslintRuleNameContract } from '../eslint-rule-name/eslint-rule-name-contract';

const rawEslintParserOptionsContract = z
  .object({
    project: z.unknown().optional(),
  })
  .loose();

const rawEslintLanguageOptionsContract = z
  .object({
    parserOptions: rawEslintParserOptionsContract.optional(),
  })
  .loose();

export const rawEslintConfigContract = z.object({
  rules: z.record(eslintRuleNameContract, z.unknown()).optional(),
  language: z.unknown().optional(),
  plugins: z.unknown().optional(),
  languageOptions: rawEslintLanguageOptionsContract.optional(),
});

export type RawEslintConfig = z.infer<typeof rawEslintConfigContract>;

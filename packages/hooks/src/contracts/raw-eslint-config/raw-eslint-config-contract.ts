/**
 * PURPOSE: Zod schema for raw ESLint config returned by calculateConfigForFile
 *
 * USAGE:
 * const config = rawEslintConfigContract.parse(rawConfig);
 * // Returns validated RawEslintConfig with all ESLint v9 fields
 */
import { z } from '#gateway/npm/zod';

const rawEslintParserOptionsContract = z
  .object({
    project: z.unknown().optional(),
  })
  .brand<'RawEslintParserOptions'>()
  .loose();

const rawEslintLanguageOptionsContract = z
  .object({
    parserOptions: rawEslintParserOptionsContract.optional(),
  })
  .brand<'RawEslintLanguageOptions'>()
  .loose();

export const rawEslintConfigContract = z
  .object({
    rules: z.record(z.string(), z.unknown()).optional(),
    language: z.unknown().optional(),
    plugins: z.unknown().optional(),
    languageOptions: rawEslintLanguageOptionsContract.optional(),
  })
  .brand<'RawEslintConfig'>();

export type RawEslintConfig = z.infer<typeof rawEslintConfigContract>;

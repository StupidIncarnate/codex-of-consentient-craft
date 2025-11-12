/**
 * PURPOSE: Zod schema for raw ESLint config returned by calculateConfigForFile
 *
 * USAGE:
 * const config = rawEslintConfigContract.parse(rawConfig);
 * // Returns validated RawEslintConfig with all ESLint v9 fields
 */
import { z } from 'zod';

export const rawEslintConfigContract = z.object({
  rules: z.record(z.unknown()).optional(),
  language: z.unknown().optional(),
  plugins: z.unknown().optional(),
  languageOptions: z.unknown().optional(),
});

export type RawEslintConfig = z.infer<typeof rawEslintConfigContract>;

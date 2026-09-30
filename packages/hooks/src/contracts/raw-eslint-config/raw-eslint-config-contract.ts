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
    project: z
      .union([
        z.string().brand<'RawEslintParserOptionsProject'>(),
        z.array(z.string().brand<'RawEslintParserOptionsProject'>()),
        z.boolean(),
        z.null(),
      ])
      .optional(),
  })
  .brand<'RawEslintParserOptions'>()
  .loose();

const rawEslintLanguageOptionsContract = z
  .object({
    parserOptions: rawEslintParserOptionsContract.optional(),
  })
  .brand<'RawEslintLanguageOptions'>()
  .loose();

// A plugin object carries functions (rules, processors), so it is loose rather than z.json().
const rawEslintPluginContract = z.object({}).brand<'RawEslintPlugin'>().loose();

const rawEslintLanguageContract = z
  .object({
    fileType: z.string().brand<'RawEslintLanguageFileType'>().optional(),
    lineStart: z.number().brand<'RawEslintLanguageLineStart'>().optional(),
  })
  .brand<'RawEslintLanguage'>()
  .loose();

export const rawEslintConfigContract = z
  .object({
    rules: z.record(z.string(), z.json()).optional(),
    language: z
      .union([z.string().brand<'RawEslintConfigLanguage'>(), rawEslintLanguageContract])
      .optional(),
    plugins: z.record(z.string(), rawEslintPluginContract).optional(),
    languageOptions: rawEslintLanguageOptionsContract.optional(),
  })
  .brand<'RawEslintConfig'>();

export type RawEslintConfig = z.infer<typeof rawEslintConfigContract>;

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

// `z.custom`, not an object schema: a parse hands back the SAME plugin object. ESLint compares
// plugins by reference, so a copied `@` core plugin fails with "Cannot redefine plugin" once the
// filtered config is passed back as `overrideConfig`.
const rawEslintPluginContract = z.custom<object>(
  (value) => typeof value === 'object' && value !== null,
  { message: 'An ESLint plugin is an object' },
);

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

/**
 * PURPOSE: Validates ESLint flat config object structure with plugins, rules, and language options
 *
 * USAGE:
 * const config = eslintConfigContract.parse({ plugins: {...}, rules: {...}, files: ['**\/*.ts'] });
 * // Returns validated EslintConfig object
 */
import { z } from 'zod';
import { eslintPluginNameContract } from '../eslint-plugin-name/eslint-plugin-name-contract';
import { eslintRulesContract } from '../eslint-rules/eslint-rules-contract';

export const eslintConfigContract = z.object({
  plugins: z.record(eslintPluginNameContract, z.unknown()).optional(),
  rules: eslintRulesContract.optional(),
  languageOptions: z
    .object({
      parser: z.unknown().optional(),
      parserOptions: z.record(z.string().brand<'ParserOptionName'>(), z.unknown()).optional(),
      globals: z.record(z.string().brand<'GlobalName'>(), z.boolean()).optional(),
    })
    .optional(),
  files: z.array(z.string().min(1).brand<'FilePattern'>()).optional(),
  ignores: z.array(z.string().min(1).brand<'FilePattern'>()).optional(),
});

export type EslintConfig = z.infer<typeof eslintConfigContract>;

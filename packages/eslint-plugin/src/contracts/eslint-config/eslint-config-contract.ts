import { z } from 'zod';
import { eslintRulesContract } from '../eslint-rules/eslint-rules-contract';

export const eslintConfigContract = z.object({
  plugins: z.record(z.unknown()).optional(),
  rules: eslintRulesContract.optional(),
  languageOptions: z
    .object({
      parser: z.unknown().optional(),
      parserOptions: z.record(z.unknown()).optional(),
      globals: z.record(z.boolean()).optional(),
    })
    .optional(),
  files: z.array(z.string().min(1).brand<'FilePattern'>()).optional(),
  ignores: z.array(z.string().min(1).brand<'FilePattern'>()).optional(),
});

export type EslintConfig = z.infer<typeof eslintConfigContract>;

import { z } from 'zod';

export const eslintConfigContract = z.object({
  plugins: z.record(z.unknown()).optional(),
  rules: z
    .record(
      z.union([z.literal('off'), z.literal('warn'), z.literal('error'), z.array(z.unknown())]),
    )
    .optional(),
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

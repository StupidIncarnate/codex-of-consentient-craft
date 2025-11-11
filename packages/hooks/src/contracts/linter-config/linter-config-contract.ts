/**
 * PURPOSE: Zod schema for ESLint Linter.Config with minimal required properties
 *
 * USAGE:
 * const config = linterConfigContract.parse({ rules: { 'no-console': 'error' } });
 * // Returns validated LinterConfig object
 */
import { z } from 'zod';

export const linterConfigContract = z.object({
  rules: z.record(z.unknown()).optional(),
  files: z.array(z.string().brand<'FilePattern'>()).optional(),
  language: z.string().brand<'Language'>().optional(),
});

export type LinterConfig = z.infer<typeof linterConfigContract>;

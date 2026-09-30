/**
 * PURPOSE: Zod schema for partial ESLint config with only rules field extracted
 *
 * USAGE:
 * const config = partialEslintConfigContract.parse({ rules: { 'no-console': 'error' } });
 * // Returns validated PartialEslintConfig with rules only
 */
import { z } from '#gateway/npm/zod';


export const partialEslintConfigContract = z.object({
  rules: z.record(z.string().brand<'PartialEslintConfigRules'>(), z.unknown()).optional(),
});

export type PartialEslintConfig = z.infer<typeof partialEslintConfigContract>;

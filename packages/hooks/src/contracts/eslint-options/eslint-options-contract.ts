/**
 * PURPOSE: Zod schema for ESLint.Options with minimal required properties
 *
 * USAGE:
 * const options = eslintOptionsContract.parse({ overrideConfigFile: true });
 * // Returns validated EslintOptions object
 */
import { z } from 'zod';

export const eslintOptionsContract = z.object({
  overrideConfigFile: z.boolean().optional(),
  baseConfig: z.unknown().optional(),
});

export type EslintOptions = z.infer<typeof eslintOptionsContract>;

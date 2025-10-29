import { z } from 'zod';

/**
 * ESLint Plugin contract - translates eslint plugin package types to branded Zod schemas.
 * Contract defines ONLY data properties (no z.function()).
 *
 * PURPOSE: Validates ESLint plugin object structure with rules, configs, and processors
 *
 * USAGE:
 * const plugin = eslintPluginContract.parse({ rules: {...}, configs: {...} });
 * // Returns validated EslintPlugin object
 */

export const eslintPluginContract = z.object({
  rules: z.record(z.unknown()).optional(),
  configs: z.record(z.unknown()).optional(),
  processors: z.record(z.unknown()).optional(),
});

export type EslintPlugin = z.infer<typeof eslintPluginContract>;

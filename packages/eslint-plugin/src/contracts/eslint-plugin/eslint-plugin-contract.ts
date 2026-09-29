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
import { z } from '#gateway/npm/zod';

export const eslintPluginContract = z.object({
  rules: z.record(z.string().brand<'EslintRuleName'>(), z.unknown()).optional(),
  configs: z.record(z.string().brand<'EslintConfigName'>(), z.unknown()).optional(),
  processors: z.record(z.string().brand<'EslintProcessorName'>(), z.unknown()).optional(),
});

export type EslintPlugin = z.infer<typeof eslintPluginContract>;

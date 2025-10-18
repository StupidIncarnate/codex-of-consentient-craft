import { z } from 'zod';

/**
 * ESLint Plugin contract - translates eslint plugin package types to branded Zod schemas.
 * Contract defines ONLY data properties (no z.function()).
 */

export const eslintPluginContract = z.object({
  rules: z.record(z.unknown()).optional(),
  configs: z.record(z.unknown()).optional(),
  processors: z.record(z.unknown()).optional(),
});

export type EslintPlugin = z.infer<typeof eslintPluginContract>;

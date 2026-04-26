/**
 * PURPOSE: Validates a single per-file entry in ESLint JSON output (filePath, messages[], stats.times.passes[].total)
 *
 * USAGE:
 * eslintJsonReportEntryContract.parse(rawEntry);
 * // Returns: EslintJsonReportEntry with optional filePath, messages, stats
 */

import { z } from 'zod';

const eslintMessageContract = z
  .object({
    ruleId: z.string().brand<'EslintRuleId'>().nullable().optional(),
    severity: z.number().brand<'EslintSeverity'>().optional(),
    message: z.string().brand<'EslintMessage'>().optional(),
    line: z.number().brand<'EslintLine'>().nullable().optional(),
    column: z.number().brand<'EslintColumn'>().nullable().optional(),
  })
  .passthrough();

const eslintPassContract = z
  .object({
    total: z.number().brand<'EslintPassTotal'>().optional().catch(undefined),
  })
  .passthrough();

const eslintStatsContract = z
  .object({
    times: z
      .object({
        passes: z.array(eslintPassContract).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const eslintJsonReportEntryContract = z
  .object({
    filePath: z.string().brand<'EslintFilePath'>().optional(),
    messages: z.array(eslintMessageContract).optional(),
    stats: eslintStatsContract.optional(),
  })
  .passthrough();

export type EslintJsonReportEntry = z.infer<typeof eslintJsonReportEntryContract>;

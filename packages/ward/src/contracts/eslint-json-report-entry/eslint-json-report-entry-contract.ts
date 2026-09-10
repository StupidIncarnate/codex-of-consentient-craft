/**
 * PURPOSE: Validates a single per-file entry in ESLint JSON output. Reach for this over
 * `eslintJsonParseTransformer`'s own shapes when you need the `--stats` timing split rather than the
 * diagnostics.
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

const eslintTimeContract = z
  .object({
    total: z.number().brand<'EslintTimeTotal'>().optional().catch(undefined),
  })
  .passthrough();

const eslintPassContract = z
  .object({
    // @typescript-eslint builds its TypeScript program HERE, once per eslint process, and charges
    // the whole thing to whichever file the parser reached first. Measured over one 40-file web
    // run: 3573ms on that file against 2-13ms on the other 39. Split out so nothing ranks on it.
    parse: eslintTimeContract.optional(),
    // One entry per rule that ran. This plus `fix` is the file's OWN cost, with no program build.
    rules: z.record(eslintTimeContract).optional(),
    fix: eslintTimeContract.optional(),
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

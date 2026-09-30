/**
 * PURPOSE: Validates a single per-file entry in ESLint JSON output. Reach for this over
 * `eslintJsonParseTransformer`'s own shapes when you need the `--stats` timing split rather than the
 * diagnostics.
 *
 * USAGE:
 * eslintJsonReportEntryContract.parse(rawEntry);
 * // Returns: EslintJsonReportEntry with optional filePath, messages, stats
 */

import { z } from '#gateway/npm/zod';

const eslintMessageContract = z
  .object({
    ruleId: z.string().brand<'EslintMessageRuleId'>().nullable().optional(),
    severity: z.number().brand<'EslintMessageSeverity'>().optional(),
    message: z.string().brand<'EslintMessageMessage'>().optional(),
    line: z.number().brand<'EslintMessageLine'>().nullable().optional(),
    column: z.number().brand<'EslintMessageColumn'>().nullable().optional(),
  }).brand<'EslintMessage'>()
  .loose();

const eslintTimeContract = z
  .object({
    total: z.number().brand<'EslintTimeTotal'>().optional().catch(undefined),
  }).brand<'EslintTime'>()
  .loose();

const eslintPassContract = z
  .object({
    // @typescript-eslint builds its TypeScript program HERE, once per eslint process, and charges
    // the whole thing to whichever file the parser reached first. Measured over one 40-file web
    // run: 3573ms on that file against 2-13ms on the other 39. Split out so nothing ranks on it.
    parse: eslintTimeContract.optional(),
    // One entry per rule that ran. This plus `fix` is the file's OWN cost, with no program build.
    rules: z.record(z.string().brand<'EslintPassRulesKey'>(), eslintTimeContract).optional(),
    fix: eslintTimeContract.optional(),
    total: z.number().brand<'EslintPassTotal'>().optional().catch(undefined),
  }).brand<'EslintPass'>()
  .loose();

const eslintStatsContract = z
  .object({
    times: z
      .object({
        passes: z.array(eslintPassContract).optional(),
      }).brand<'EslintStatsTimes'>()
      .loose()
      .optional(),
  }).brand<'EslintStats'>()
  .loose();

export const eslintJsonReportEntryContract = z
  .object({
    filePath: z.string().brand<'EslintJsonReportEntryFilePath'>().optional(),
    messages: z.array(eslintMessageContract).optional(),
    stats: eslintStatsContract.optional(),
  })
  .loose().brand<'EslintJsonReportEntry'>();

export type EslintJsonReportEntry = z.infer<typeof eslintJsonReportEntryContract>;

/**
 * PURPOSE: Zod schema for individual lint message with location and severity
 *
 * USAGE:
 * const message = lintMessageContract.parse(msgData);
 * // Returns validated LintMessage with line, column, message, severity (1=warn, 2=error), optional ruleId
 */
import { z } from '#gateway/npm/zod';

const LINT_SEVERITY_MIN = 1;
const LINT_SEVERITY_MAX = 2;

export const lintMessageContract = z.object({
  line: z.number().int().positive().brand<'LintMessageLine'>(),
  column: z.number().int().nonnegative().brand<'LintMessageColumn'>(),
  message: z.string().min(1).brand<'LintMessageMessage'>(),
  severity: z.number().int().min(LINT_SEVERITY_MIN).max(LINT_SEVERITY_MAX).brand<'LintMessageSeverity'>(), // 1 = warn, 2 = error
  ruleId: z.string().brand<'LintMessageRuleId'>().optional(),
}).brand<'LintMessage'>();

export type LintMessage = z.infer<typeof lintMessageContract>;

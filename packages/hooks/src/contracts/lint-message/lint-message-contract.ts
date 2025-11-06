/**
 * PURPOSE: Zod schema for individual lint message with location and severity
 *
 * USAGE:
 * const message = lintMessageContract.parse(msgData);
 * // Returns validated LintMessage with line, column, message, severity (1=warn, 2=error), optional ruleId
 */
import { z } from 'zod';

const LINT_SEVERITY_MIN = 1;
const LINT_SEVERITY_MAX = 2;

export const lintMessageContract = z.object({
  line: z.number().int().positive().brand<'LineNumber'>(),
  column: z.number().int().nonnegative().brand<'ColumnNumber'>(),
  message: z.string().min(1).brand<'LintMessageText'>(),
  severity: z.number().int().min(LINT_SEVERITY_MIN).max(LINT_SEVERITY_MAX).brand<'LintSeverity'>(), // 1 = warn, 2 = error
  ruleId: z.string().brand<'RuleId'>().optional(),
});

export type LintMessage = z.infer<typeof lintMessageContract>;

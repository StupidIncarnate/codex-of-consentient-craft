/**
 * PURPOSE: Zod schema for raw ESLint message object returned by lintText()
 *
 * USAGE:
 * const msg = eslintRawMessageContract.safeParse(rawMsg);
 * // Returns validated EslintRawMessage with line, column, message, severity, optional ruleId
 */
import { z } from 'zod';

export const eslintRawMessageContract = z.object({
  line: z.number().int().brand<'EslintLine'>(),
  column: z.number().int().brand<'EslintColumn'>(),
  message: z.string().brand<'EslintMessageText'>(),
  severity: z.number().int().brand<'EslintSeverity'>(),
  ruleId: z.string().brand<'EslintRuleId'>().nullable().optional(),
});

export type EslintRawMessage = z.infer<typeof eslintRawMessageContract>;

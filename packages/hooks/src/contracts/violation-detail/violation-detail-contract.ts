import { z } from 'zod';

export const violationDetailContract = z.object({
  ruleId: z.string().min(1).brand<'RuleId'>(),
  line: z.number().int().positive().brand<'LineNumber'>(),
  column: z.number().int().nonnegative().brand<'ColumnNumber'>(),
  message: z.string().min(1).brand<'ViolationMessage'>(),
});

export type ViolationDetail = z.infer<typeof violationDetailContract>;

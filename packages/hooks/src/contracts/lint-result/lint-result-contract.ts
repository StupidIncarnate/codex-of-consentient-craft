import { z } from 'zod';
import { lintMessageContract } from '../lint-message/lint-message-contract';

export const lintResultContract = z.object({
  filePath: z.string().min(1).brand<'FilePath'>(),
  messages: z.array(lintMessageContract),
  errorCount: z.number().int().nonnegative().brand<'ErrorCount'>(),
  warningCount: z.number().int().nonnegative().brand<'WarningCount'>(),
});

export type LintResult = z.infer<typeof lintResultContract>;

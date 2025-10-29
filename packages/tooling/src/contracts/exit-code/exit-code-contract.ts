import { z } from 'zod';
import { exitCodeStatics } from '../../statics/exit-code/exit-code-statics';

export const exitCodeContract = z
  .number()
  .int()
  .min(0)
  .max(exitCodeStatics.limits.max)
  .brand<'ExitCode'>();

export type ExitCode = z.infer<typeof exitCodeContract>;

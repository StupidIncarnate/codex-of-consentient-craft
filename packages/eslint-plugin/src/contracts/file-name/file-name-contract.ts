import { z } from 'zod';

export const fileNameContract = z
  .string()
  .min(1, 'Filename cannot be empty')
  .regex(/^[^/\\]+$/, 'Filename cannot contain path separators (/ or \\)')
  .brand<'FileName'>();

export type FileName = z.infer<typeof fileNameContract>;

import { z } from 'zod';

export const relativeFilePathContract = z
  .string()
  .min(1)
  .refine(
    (path) =>
      // Must start with ./ or ../
      path.startsWith('./') || path.startsWith('../'),
    {
      message: 'Path must be relative (start with ./ or ../)',
    },
  )
  .brand<'RelativeFilePath'>();

export type RelativeFilePath = z.infer<typeof relativeFilePathContract>;

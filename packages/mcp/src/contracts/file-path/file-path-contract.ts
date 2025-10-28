import { z } from 'zod';

export const filePathContract = z.string().brand<'FilePath'>();

export type FilePath = z.infer<typeof filePathContract>;

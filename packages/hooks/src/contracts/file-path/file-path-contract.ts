import { z } from 'zod';

export const filePathContract = z.string().min(1).brand<'FilePath'>();
export type FilePath = z.infer<typeof filePathContract>;

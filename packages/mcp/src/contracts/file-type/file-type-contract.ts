import { z } from 'zod';

export const fileTypeContract = z.string().brand<'FileType'>();

export type FileType = z.infer<typeof fileTypeContract>;

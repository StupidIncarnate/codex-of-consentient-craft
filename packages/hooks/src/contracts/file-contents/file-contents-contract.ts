import { z } from 'zod';

export const fileContentsContract = z.string().brand<'FileContents'>();
export type FileContents = z.infer<typeof fileContentsContract>;

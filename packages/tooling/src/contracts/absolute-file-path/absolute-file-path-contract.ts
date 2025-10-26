import { z } from 'zod';

export const absoluteFilePathContract = z.string().brand<'AbsoluteFilePath'>();

export type AbsoluteFilePath = z.infer<typeof absoluteFilePathContract>;

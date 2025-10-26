import { z } from 'zod';

export const sourceCodeContract = z.string().brand<'SourceCode'>();

export type SourceCode = z.infer<typeof sourceCodeContract>;

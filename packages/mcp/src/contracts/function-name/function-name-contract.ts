import { z } from 'zod';

export const functionNameContract = z.string().brand<'FunctionName'>();

export type FunctionName = z.infer<typeof functionNameContract>;

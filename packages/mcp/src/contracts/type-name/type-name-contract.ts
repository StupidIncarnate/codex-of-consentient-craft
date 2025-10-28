import { z } from 'zod';

export const typeNameContract = z.string().brand<'TypeName'>();

export type TypeName = z.infer<typeof typeNameContract>;

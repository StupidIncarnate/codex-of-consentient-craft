import { z } from 'zod';

export const returnTypeContract = z.string().brand<'ReturnType'>();

export type ReturnType = z.infer<typeof returnTypeContract>;

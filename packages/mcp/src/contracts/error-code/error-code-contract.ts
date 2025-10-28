import { z } from 'zod';

export const errorCodeContract = z.number().int().brand<'ErrorCode'>();

export type ErrorCode = z.infer<typeof errorCodeContract>;

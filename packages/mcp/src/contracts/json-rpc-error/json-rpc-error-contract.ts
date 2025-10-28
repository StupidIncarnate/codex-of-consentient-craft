import { z } from 'zod';

export const jsonRpcErrorContract = z.object({
  code: z.number().int().brand<'ErrorCode'>(),
  message: z.string().brand<'ErrorMessage'>(),
  data: z.unknown().optional(),
});

export type JsonRpcError = z.infer<typeof jsonRpcErrorContract>;

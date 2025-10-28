import { z } from 'zod';

const jsonRpcErrorContract = z.object({
  code: z.number().int().brand<'ErrorCode'>(),
  message: z.string().brand<'ErrorMessage'>(),
  data: z.unknown().optional(),
});

export const jsonRpcResponseContract = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.number(), z.string()]).brand<'RpcId'>(),
  result: z.unknown().optional(),
  error: jsonRpcErrorContract.optional(),
});

export type JsonRpcResponse = z.infer<typeof jsonRpcResponseContract>;

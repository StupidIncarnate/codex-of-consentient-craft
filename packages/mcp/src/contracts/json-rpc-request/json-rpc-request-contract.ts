import { z } from 'zod';

export const jsonRpcRequestContract = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.number(), z.string()]).brand<'RpcId'>(),
  method: z.string().brand<'RpcMethod'>(),
  params: z.unknown().optional(),
});

export type JsonRpcRequest = z.infer<typeof jsonRpcRequestContract>;

import { z } from 'zod';

export const rpcIdContract = z.union([z.number(), z.string()]).brand<'RpcId'>();

export type RpcId = z.infer<typeof rpcIdContract>;

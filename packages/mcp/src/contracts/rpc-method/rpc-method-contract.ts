import { z } from 'zod';

export const rpcMethodContract = z.string().brand<'RpcMethod'>();

export type RpcMethod = z.infer<typeof rpcMethodContract>;

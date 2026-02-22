/**
 * PURPOSE: Defines a branded string type for JSON-RPC method names
 *
 * USAGE:
 * const method: RpcMethod = rpcMethodContract.parse('tools/call');
 * // Returns a branded RpcMethod string type
 */
import { z } from 'zod';

export const rpcMethodContract = z.string().brand<'RpcMethod'>();

export type RpcMethod = z.infer<typeof rpcMethodContract>;

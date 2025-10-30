/**
 * PURPOSE: Defines a branded type for JSON-RPC request/response IDs (number or string)
 *
 * USAGE:
 * const id: RpcId = rpcIdContract.parse(1);
 * // Returns a branded RpcId that can be number or string
 */
import { z } from 'zod';

export const rpcIdContract = z.union([z.number(), z.string()]).brand<'RpcId'>();

export type RpcId = z.infer<typeof rpcIdContract>;

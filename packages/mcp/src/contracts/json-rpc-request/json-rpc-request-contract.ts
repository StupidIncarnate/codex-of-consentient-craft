/**
 * PURPOSE: Defines the schema for JSON-RPC 2.0 request objects
 *
 * USAGE:
 * const request: JsonRpcRequest = jsonRpcRequestContract.parse({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: {...} });
 * // Returns validated JSON-RPC request with jsonrpc version, id, method, and optional params
 */
import { z } from 'zod';

export const jsonRpcRequestContract = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.number(), z.string()]).brand<'RpcId'>(),
  method: z.string().brand<'RpcMethod'>(),
  params: z.unknown().optional(),
});

export type JsonRpcRequest = z.infer<typeof jsonRpcRequestContract>;

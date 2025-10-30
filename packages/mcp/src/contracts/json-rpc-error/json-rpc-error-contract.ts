/**
 * PURPOSE: Defines the schema for JSON-RPC 2.0 error objects
 *
 * USAGE:
 * const error: JsonRpcError = jsonRpcErrorContract.parse({ code: -32600, message: 'Invalid Request' });
 * // Returns validated JSON-RPC error with code, message, and optional data
 */
import { z } from 'zod';

export const jsonRpcErrorContract = z.object({
  code: z.number().int().brand<'ErrorCode'>(),
  message: z.string().brand<'ErrorMessage'>(),
  data: z.unknown().optional(),
});

export type JsonRpcError = z.infer<typeof jsonRpcErrorContract>;

/**
 * PURPOSE: A real `JSONRPCRequest`, built by parsing a plain object through the real
 * `JSONRPCRequestSchema`.
 *
 * USAGE:
 * const request = JsonRpcRequestStub({ id: 2, method: 'tools/list' });
 * // Returns a real, schema-validated JSONRPCRequest
 */
import { JSONRPCRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { JSONRPCRequest } from '@modelcontextprotocol/sdk/types.js';

export const JsonRpcRequestStub = ({
  id = 1,
  method = 'tools/list',
  params,
}: {
  id?: number | string;
  method?: string;
  params?: Record<string, unknown>;
} = {}): JSONRPCRequest =>
  JSONRPCRequestSchema.parse({ jsonrpc: '2.0', id, method, ...(params ? { params } : {}) });

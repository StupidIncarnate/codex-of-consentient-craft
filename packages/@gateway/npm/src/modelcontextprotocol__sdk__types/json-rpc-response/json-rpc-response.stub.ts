/**
 * PURPOSE: A real `JSONRPCResponse`, built by parsing a plain object through the real
 * `JSONRPCResponseSchema`.
 *
 * USAGE:
 * const response = JsonRpcResponseStub({ id: 2, result: { tools: [] } });
 * // Returns a real, schema-validated JSONRPCResponse
 */
import { JSONRPCResponseSchema } from '@modelcontextprotocol/sdk/types.js';
import type { JSONRPCResponse } from '@modelcontextprotocol/sdk/types.js';

export const JsonRpcResponseStub = ({
  id = 1,
  result = {},
}: {
  id?: number | string;
  result?: Record<string, unknown>;
} = {}): JSONRPCResponse => JSONRPCResponseSchema.parse({ jsonrpc: '2.0', id, result });

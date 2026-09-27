/**
 * PURPOSE: A real `CallToolRequest`, built by actually parsing a plain object through the real
 * `CallToolRequestSchema` — never a hand-typed object standing in for what the schema would
 * accept.
 *
 * USAGE:
 * const request = CallToolRequestStub();
 * // Returns a real, schema-validated CallToolRequest
 */
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';

export const CallToolRequestStub = ({
  name = 'gateway-stub-tool',
  args = { key: 'value' },
}: {
  name?: string;
  args?: Record<string, unknown>;
} = {}): CallToolRequest =>
  CallToolRequestSchema.parse({ method: 'tools/call', params: { name, arguments: args } });

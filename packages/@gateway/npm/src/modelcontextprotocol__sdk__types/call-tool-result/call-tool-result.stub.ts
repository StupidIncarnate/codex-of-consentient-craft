/**
 * PURPOSE: A real `CallToolResult`, built by parsing a plain object through the real
 * `CallToolResultSchema`.
 *
 * USAGE:
 * const result = CallToolResultStub({ text: 'done', isError: true });
 * // Returns a real, schema-validated CallToolResult with one text content block
 */
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export const CallToolResultStub = ({
  text = 'gateway-stub-result',
  isError = false,
}: {
  text?: string;
  isError?: boolean;
} = {}): CallToolResult =>
  CallToolResultSchema.parse({ content: [{ type: 'text', text }], isError });

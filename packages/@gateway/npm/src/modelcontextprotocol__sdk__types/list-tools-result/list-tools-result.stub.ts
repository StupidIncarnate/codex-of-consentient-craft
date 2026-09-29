/**
 * PURPOSE: A real `ListToolsResult`, built by parsing a plain object through the real
 * `ListToolsResultSchema`.
 *
 * USAGE:
 * const result = ListToolsResultStub({ names: ['a', 'b'] });
 * // Returns a real, schema-validated ListToolsResult with one tool per name
 */
import { ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';
import type { ListToolsResult } from '@modelcontextprotocol/sdk/types.js';

export const ListToolsResultStub = ({
  names = ['gateway-stub-tool'],
}: {
  names?: string[];
} = {}): ListToolsResult =>
  ListToolsResultSchema.parse({
    tools: names.map((name) => ({ name, inputSchema: { type: 'object' } })),
  });

/**
 * PURPOSE: A real `McpServer`, built through the real constructor — for a caller staging this
 * subpath's own value instead of hand-typing a fake one.
 *
 * USAGE:
 * const mcpServer = McpServerStub();
 * // Returns a real, unconnected McpServer, wrapping a real underlying Server
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export const McpServerStub = ({
  name = 'gateway-stub-server',
  version = '0.0.0',
}: { name?: string; version?: string } = {}): McpServer => new McpServer({ name, version });

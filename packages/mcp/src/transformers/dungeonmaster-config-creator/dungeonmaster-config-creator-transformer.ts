/**
 * PURPOSE: Create dungeonmaster MCP server configuration object
 *
 * USAGE:
 * const config = dungeonmasterConfigCreatorTransformer();
 * // Returns: { dungeonmaster: { type: 'stdio', command: 'node', args: [...] } }
 *
 * CONTRACTS: Output: Record<McpServerName, McpServerConfig>
 */

import type {
  McpServerConfig,
  McpServerName,
} from '../../contracts/mcp-config/mcp-config-contract';
import { mcpServerStatics } from '../../statics/mcp-server/mcp-server-statics';

export const dungeonmasterConfigCreatorTransformer = (): Record<McpServerName, McpServerConfig> =>
  ({
    dungeonmaster: {
      type: 'stdio' as const,
      command: 'node' as const,
      args: ['-e', mcpServerStatics.resolveScript] as const,
    },
  }) as Record<McpServerName, McpServerConfig>;

/**
 * PURPOSE: Create dungeonmaster MCP server configuration object
 *
 * USAGE:
 * const config = dungeonmasterConfigCreatorTransformer();
 * // Returns: { dungeonmaster: { type: 'stdio', command: 'npx', args: [...] } }
 *
 * CONTRACTS: Output: Record<McpServerName, McpServerConfig>
 */

import type {
  McpServerConfig,
  McpServerName,
} from '../../contracts/mcp-config/mcp-config-contract';

export const dungeonmasterConfigCreatorTransformer = (): Record<McpServerName, McpServerConfig> =>
  ({
    dungeonmaster: {
      type: 'stdio' as const,
      command: 'npx' as const,
      args: ['tsx', 'node_modules/@dungeonmaster/mcp/src/index.ts'] as const,
    },
  }) as Record<McpServerName, McpServerConfig>;

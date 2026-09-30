/**
 * PURPOSE: Create dungeonmaster MCP server configuration object
 *
 * USAGE:
 * const config = dungeonmasterConfigCreatorTransformer();
 * // Returns: { dungeonmaster: { type: 'stdio', command: 'node', args: [...] } }
 *
 * CONTRACTS: Output: Record<string, McpServerConfig>
 */

import { mcpConfigContract, type McpConfig } from '../../contracts/mcp-config/mcp-config-contract';
import { mcpServerStatics } from '../../statics/mcp-server/mcp-server-statics';

export const dungeonmasterConfigCreatorTransformer = (): NonNullable<McpConfig['mcpServers']> =>
  mcpConfigContract.parse({
    mcpServers: {
      dungeonmaster: {
        type: 'stdio',
        command: 'node',
        args: ['-e', mcpServerStatics.resolveScript],
      },
    },
  }).mcpServers ?? {};

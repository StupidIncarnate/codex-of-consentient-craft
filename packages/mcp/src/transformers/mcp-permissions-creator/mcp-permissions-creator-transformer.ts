/**
 * PURPOSE: Generates MCP permission strings for Claude settings from tool names
 *
 * USAGE:
 * mcpPermissionsCreatorTransformer();
 * // Returns ['mcp__dungeonmaster__discover', 'mcp__dungeonmaster__get-architecture', ...]
 */

import {
  mcpPermissionContract,
  type McpPermission,
} from '../../contracts/mcp-permission/mcp-permission-contract';
import { mcpToolsStatics } from '../../statics/mcp-tools/mcp-tools-statics';

export const mcpPermissionsCreatorTransformer = (): McpPermission[] => {
  const { server, tools } = mcpToolsStatics;

  return tools.names.map((toolName) => {
    const permission = `mcp__${server.name}__${toolName}`;
    return mcpPermissionContract.parse(permission);
  });
};

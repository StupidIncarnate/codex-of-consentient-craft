/**
 * PURPOSE: Generates MCP permission strings for Claude settings from tool names
 *
 * USAGE:
 * mcpPermissionsCreatorTransformer();
 * // Returns ['mcp__dungeonmaster__discover', 'mcp__dungeonmaster__get-architecture', ...]
 */

import { mcpToolsStatics } from '@dungeonmaster/shared/statics';

export const mcpPermissionsCreatorTransformer = (): string[] => {
  const { server, tools } = mcpToolsStatics;

  return tools.names.map((toolName) => {
    const permission = `mcp__${server.name}__${toolName}`;
    return permission;
  });
};

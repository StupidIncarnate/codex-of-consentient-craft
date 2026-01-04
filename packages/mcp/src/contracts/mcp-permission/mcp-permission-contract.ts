/**
 * PURPOSE: Zod schema for validating MCP permission strings in Claude settings
 *
 * USAGE:
 * const permission = mcpPermissionContract.parse('mcp__dungeonmaster__get-architecture');
 * // Returns branded McpPermission type
 */

import { z } from 'zod';

export const mcpPermissionContract = z.string().brand<'McpPermission'>();

export type McpPermission = z.infer<typeof mcpPermissionContract>;

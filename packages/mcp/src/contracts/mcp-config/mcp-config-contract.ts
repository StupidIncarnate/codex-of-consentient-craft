/**
 * PURPOSE: Zod schema for validating MCP configuration file structure
 *
 * USAGE:
 * const config = mcpConfigContract.parse({
 *   mcpServers: {
 *     dungeonmaster: {
 *       type: 'stdio',
 *       command: 'npx',
 *       args: ['tsx', 'node_modules/@dungeonmaster/mcp/src/index.ts']
 *     }
 *   }
 * });
 * // Returns typed McpConfig object
 */

import { z } from 'zod';

const mcpServerTypeContract = z.string().brand<'McpServerType'>();
const mcpCommandContract = z.string().brand<'McpCommand'>();
const mcpArgContract = z.string().brand<'McpArg'>();
const mcpServerNameContract = z.string().brand<'McpServerName'>();

const mcpServerConfigContract = z.object({
  type: mcpServerTypeContract,
  command: mcpCommandContract,
  args: z.array(mcpArgContract),
});

export const mcpConfigContract = z.object({
  mcpServers: z.record(mcpServerNameContract, mcpServerConfigContract).optional(),
});

export type McpConfig = z.infer<typeof mcpConfigContract>;
export type McpServerConfig = z.infer<typeof mcpServerConfigContract>;
export type McpServerType = z.infer<typeof mcpServerTypeContract>;
export type McpCommand = z.infer<typeof mcpCommandContract>;
export type McpArg = z.infer<typeof mcpArgContract>;
export type McpServerName = z.infer<typeof mcpServerNameContract>;

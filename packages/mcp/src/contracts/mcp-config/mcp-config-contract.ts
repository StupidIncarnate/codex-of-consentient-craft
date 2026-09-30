/**
 * PURPOSE: Zod schema for validating MCP configuration file structure
 *
 * USAGE:
 * const config = mcpConfigContract.parse({
 *   mcpServers: {
 *     dungeonmaster: {
 *       type: 'stdio',
 *       command: 'node',
 *       args: ['node_modules/@dungeonmaster/mcp/dist/src/index.js']
 *     }
 *   }
 * });
 * // Returns typed McpConfig object
 */

import { z } from '#gateway/npm/zod';

const mcpServerTypeContract = z.string().brand<'McpServerType'>();
const mcpCommandContract = z.string().brand<'McpCommand'>();
const mcpArgContract = z.string().brand<'McpArg'>();
const mcpServerNameContract = z.string().brand<'McpServerName'>();

const mcpServerConfigContract = z.object({
  type: mcpServerTypeContract,
  command: mcpCommandContract,
  args: z.array(mcpArgContract),
});

// `.loose()` and `.partial()`: .mcp.json belongs to the user. A server entry of another shape
// (`url`, `env`, no `type`) and any top-level key must survive the merge the install responder writes back.
export const mcpConfigContract = z
  .object({
    mcpServers: z
      .record(mcpServerNameContract, mcpServerConfigContract.partial().loose())
      .optional(),
  })
  .loose().brand<'McpConfig'>();

export type McpConfig = z.infer<typeof mcpConfigContract>;
export type McpServerConfig = z.infer<typeof mcpServerConfigContract>;
export type McpServerType = z.infer<typeof mcpServerTypeContract>;
export type McpCommand = z.infer<typeof mcpCommandContract>;
export type McpArg = z.infer<typeof mcpArgContract>;
export type McpServerName = z.infer<typeof mcpServerNameContract>;

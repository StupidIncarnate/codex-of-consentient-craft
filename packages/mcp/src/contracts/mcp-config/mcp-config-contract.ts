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

const mcpServerConfigContract = z
  .object({
    type: z.string().brand<'McpServerConfigType'>(),
    command: z.string().brand<'McpServerConfigCommand'>(),
    args: z.array(z.string().brand<'McpServerConfigArgs'>()),
  })
  .brand<'McpServerConfig'>();

// `.loose()` and `.partial()`: .mcp.json belongs to the user. A server entry of another shape
// (`url`, `env`, no `type`) and any top-level key must survive the merge the install responder writes back.
export const mcpConfigContract = z
  .object({
    mcpServers: z
      .record(z.string(), mcpServerConfigContract.partial().brand<'McpConfigMcpServers'>().loose())
      .optional(),
  })
  .loose()
  .brand<'McpConfig'>();

export type McpConfig = z.infer<typeof mcpConfigContract>;
export type McpServerConfig = z.infer<typeof mcpServerConfigContract>;

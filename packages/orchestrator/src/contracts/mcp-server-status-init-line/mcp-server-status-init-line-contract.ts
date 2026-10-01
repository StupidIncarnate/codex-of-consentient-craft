/**
 * PURPOSE: The MCP server list on a Claude CLI `system/init` stream line — one `{ name, status }` per
 * configured server. Reach for this over shared's `systemInitStreamLineContract`, which reads only
 * the session id: this one is what tells the spawn layer the dungeonmaster server never connected.
 *
 * USAGE:
 * mcpServerStatusInitLineContract.safeParse(JSON.parse(rawLine));
 * // Succeeds on an init line: { type: 'system', subtype: 'init', mcp_servers: [{ name: 'dungeonmaster', status: 'failed' }] }
 */

import { z } from '#gateway/npm/zod';

export const mcpServerStatusInitLineContract = z
  .object({
    type: z.literal('system'),
    subtype: z.literal('init'),
    mcp_servers: z.array(
      z
        .object({
          name: z.string().brand<'McpServerStatusInitLineMcpServersName'>(),
          status: z.string().brand<'McpServerStatusInitLineMcpServersStatus'>(),
        })
        .brand<'McpServerStatusInitLineMcpServers'>(),
    ),
  })
  .brand<'McpServerStatusInitLine'>();

export type McpServerStatusInitLine = z.infer<typeof mcpServerStatusInitLineContract>;

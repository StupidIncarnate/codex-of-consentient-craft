/**
 * PURPOSE: Validates the `.mcp.json` an install testbed reads back after `dungeonmaster init`, so a
 * test reads `mcpServers` off a checked shape rather than an `unknown`. Every other key passes through.
 *
 * USAGE:
 * mcpConfigContract.parse(JSON.parse(text));
 * // Returns the config with `mcpServers` keyed by server name
 */

import { z } from '#gateway/npm/zod';

export const mcpConfigContract = z
  .object({
    mcpServers: z.record(z.string().brand<'McpConfigMcpServersKey'>(), z.unknown()).optional(),
  })
  .loose().brand<'McpConfig'>();

export type McpConfig = z.infer<typeof mcpConfigContract>;

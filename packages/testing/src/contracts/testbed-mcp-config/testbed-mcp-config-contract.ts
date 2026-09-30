/**
 * PURPOSE: Validates the `.mcp.json` an install testbed reads back after `dungeonmaster init`, so a
 * test reads `mcpServers` off a checked shape rather than an `unknown`. Every other key passes through.
 *
 * USAGE:
 * testbedMcpConfigContract.parse(JSON.parse(text));
 * // Returns the config with `mcpServers` keyed by server name
 */

import { z } from '#gateway/npm/zod';

export const testbedMcpConfigContract = z
  .object({
    mcpServers: z.record(z.string(), z.json()).optional(),
  })
  .loose()
  .brand<'TestbedMcpConfig'>();

export type TestbedMcpConfig = z.infer<typeof testbedMcpConfigContract>;

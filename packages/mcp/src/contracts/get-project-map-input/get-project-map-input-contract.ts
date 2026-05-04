/**
 * PURPOSE: Defines the input schema for the MCP get-project-map tool
 *
 * USAGE:
 * const input: GetProjectMapInput = getProjectMapInputContract.parse({ packages: ['mcp', 'shared'] });
 * // Returns validated GetProjectMapInput with branded packageName values; min 1 entry, additional keys rejected
 */
import { z } from 'zod';
import { packageNameContract } from '@dungeonmaster/shared/contracts';

export const getProjectMapInputContract = z
  .object({
    packages: z
      .array(packageNameContract)
      .min(1)
      .describe('Names of packages to include in the project-map slice (one or more). Required.'),
  })
  .strict();

export type GetProjectMapInput = z.infer<typeof getProjectMapInputContract>;

/**
 * PURPOSE: Defines the input schema for the MCP get-project-map tool
 *
 * USAGE:
 * const input: GetProjectMapInput = getProjectMapInputContract.parse({ packages: ['mcp', 'shared'] });
 * // Returns validated GetProjectMapInput with branded packageName values; min 1 entry, additional keys rejected
 */
import { z } from '#gateway/npm/zod';

export const getProjectMapInputContract = z
  .object({
    packages: z
      .array(z.string().min(1).brand<'GetProjectMapInputPackages'>())
      .min(1)
      .describe('Names of packages to include in the project-map slice (one or more). Required.'),
  })
  .strict()
  .brand<'GetProjectMapInput'>();

export type GetProjectMapInput = z.infer<typeof getProjectMapInputContract>;

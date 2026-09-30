/**
 * PURPOSE: Defines the input schema for the MCP get-project-inventory tool
 *
 * USAGE:
 * const input: GetProjectInventoryInput = getProjectInventoryInputContract.parse({ packageName: 'web' });
 * // Returns validated GetProjectInventoryInput with branded packageName
 */
import { z } from '#gateway/npm/zod';

export const getProjectInventoryInputContract = z
  .object({
    packageName: z
      .string()
      .min(1)
      .brand<'GetProjectInventoryInputPackageName'>()
      .describe('Name of the package to return inventory for'),
  })
  .strict()
  .brand<'GetProjectInventoryInput'>();

export type GetProjectInventoryInput = z.infer<typeof getProjectInventoryInputContract>;

/**
 * PURPOSE: Defines the input schema for the MCP get-project-inventory tool
 *
 * USAGE:
 * const input: GetProjectInventoryInput = getProjectInventoryInputContract.parse({ packageName: 'web' });
 * // Returns validated GetProjectInventoryInput with branded packageName
 */
import { z } from 'zod';
import { packageNameContract } from '@dungeonmaster/shared/contracts';

export const getProjectInventoryInputContract = z
  .object({
    packageName: packageNameContract.describe('Name of the package to return inventory for'),
  })
  .strict();

export type GetProjectInventoryInput = z.infer<typeof getProjectInventoryInputContract>;

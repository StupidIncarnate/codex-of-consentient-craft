/**
 * PURPOSE: Validates the subset of package.json fields ward reads (name, workspaces)
 *
 * USAGE:
 * packageJsonContract.parse(JSON.parse(rawPackageJson));
 * // Returns: PackageJson validated object with optional name and workspaces
 */

import { z } from 'zod';

export const packageJsonContract = z
  .object({
    name: z.string().brand<'PackageJsonName'>().optional(),
    workspaces: z.array(z.string().brand<'PackageJsonWorkspace'>()).optional(),
  })
  .passthrough();

export type PackageJson = z.infer<typeof packageJsonContract>;

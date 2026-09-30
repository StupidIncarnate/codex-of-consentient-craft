/**
 * PURPOSE: Validates the structure of a package.json file for dependency extraction and npm-workspaces
 * detection
 *
 * USAGE:
 * const parsed = packageJsonContract.safeParse(rawJson);
 * // Returns a validated PackageJson shape with optional devDependencies map and workspaces list
 */

import { z } from '#gateway/npm/zod';

const packageJsonKeyContract = z.string().brand<'PackageJsonKey'>();

export const packageJsonContract = z
  .object({
    devDependencies: z
      .record(packageJsonKeyContract, z.string().brand<'PackageJsonDevDependencies'>())
      .optional(),
    workspaces: z.array(z.string().brand<'PackageJsonWorkspaces'>()).optional(),
  })
  .loose()
  .brand<'PackageJson'>();

export type PackageJson = z.infer<typeof packageJsonContract>;

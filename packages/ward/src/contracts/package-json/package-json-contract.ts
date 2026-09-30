/**
 * PURPOSE: Validates the subset of package.json fields ward reads (name, workspaces, scripts)
 *
 * USAGE:
 * packageJsonContract.parse(JSON.parse(rawPackageJson));
 * // Returns: PackageJson validated object with optional name, workspaces, and scripts
 */

import { z } from '#gateway/npm/zod';

export const packageJsonContract = z
  .object({
    name: z.string().brand<'PackageJsonName'>().optional(),
    workspaces: z.array(z.string().brand<'PackageJsonWorkspaces'>()).optional(),
    scripts: z.record(z.string().brand<'PackageJsonScriptsKey'>(), z.unknown()).optional(),
    dependencies: z
      .record(z.string().brand<'PackageJsonDependenciesKey'>(), z.string().brand<'PackageJsonDependencies'>())
      .optional(),
    devDependencies: z
      .record(z.string().brand<'PackageJsonDevDependenciesKey'>(), z.string().brand<'PackageJsonDevDependencies'>())
      .optional(),
    peerDependencies: z
      .record(z.string().brand<'PackageJsonPeerDependenciesKey'>(), z.string().brand<'PackageJsonPeerDependencies'>())
      .optional(),
  })
  .loose().brand<'PackageJson'>();

export type PackageJson = z.infer<typeof packageJsonContract>;

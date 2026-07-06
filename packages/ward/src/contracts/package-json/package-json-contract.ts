/**
 * PURPOSE: Validates the subset of package.json fields ward reads (name, workspaces, scripts)
 *
 * USAGE:
 * packageJsonContract.parse(JSON.parse(rawPackageJson));
 * // Returns: PackageJson validated object with optional name, workspaces, and scripts
 */

import { z } from 'zod';

export const packageJsonContract = z
  .object({
    name: z.string().brand<'PackageJsonName'>().optional(),
    workspaces: z.array(z.string().brand<'PackageJsonWorkspace'>()).optional(),
    scripts: z.record(z.string().brand<'ScriptName'>(), z.unknown()).optional(),
    dependencies: z
      .record(z.string().brand<'DepName'>(), z.string().brand<'DepVersion'>())
      .optional(),
    devDependencies: z
      .record(z.string().brand<'DepName'>(), z.string().brand<'DepVersion'>())
      .optional(),
    peerDependencies: z
      .record(z.string().brand<'DepName'>(), z.string().brand<'DepVersion'>())
      .optional(),
  })
  .passthrough();

export type PackageJson = z.infer<typeof packageJsonContract>;

/**
 * PURPOSE: Defines the typed shape of a package.json file: every field any package reads off one
 * (tech-type detection, dependency extraction, the installed version, npm-workspaces discovery, script wiring). Every field
 * is optional and unknown keys pass through, so any real package.json parses.
 *
 * USAGE:
 * packageJsonContract.parse(JSON.parse(rawJson));
 * // Returns a PackageJson object with typed name, bin, dependency maps, exports, workspaces and scripts
 */

import { z } from '#gateway/npm/zod';

export const packageJsonContract = z
  .object({
    name: z.string().brand<'PackageJsonName'>().optional(),
    version: z.string().brand<'PackageJsonVersion'>().optional(),
    description: z.string().brand<'PackageJsonDescription'>().optional(),
    bin: z
      .union([
        z.record(z.string(), z.string().brand<'PackageJsonBin'>()),
        z.string().brand<'PackageJsonBin'>(),
      ])
      .optional(),
    dependencies: z.record(z.string(), z.string().brand<'PackageJsonDependencies'>()).optional(),
    devDependencies: z
      .record(z.string(), z.string().brand<'PackageJsonDevDependencies'>())
      .optional(),
    peerDependencies: z
      .record(z.string(), z.string().brand<'PackageJsonPeerDependencies'>())
      .optional(),
    exports: z.record(z.string(), z.json()).optional(),
    workspaces: z.array(z.string().brand<'PackageJsonWorkspaces'>()).optional(),
    scripts: z.record(z.string(), z.string().brand<'PackageJsonScripts'>()).optional(),
  })
  .loose()
  .brand<'PackageJson'>();

export type PackageJson = z.infer<typeof packageJsonContract>;

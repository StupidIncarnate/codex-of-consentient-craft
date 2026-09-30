/**
 * PURPOSE: Defines the typed shape of a package.json file used for tech-type detection
 *
 * USAGE:
 * packageJsonContract.parse(JSON.parse(rawJson));
 * // Returns a PackageJson object with typed name, bin, dependencies, and exports fields
 */

import { z } from '#gateway/npm/zod';

export const packageJsonContract = z
  .object({
    name: z.string().brand<'PackageJsonName'>().optional(),
    description: z.string().brand<'PackageJsonDescription'>().optional(),
    bin: z
      .union([
        z.record(z.string(), z.string().brand<'PackageJsonBin'>()),
        z.string().brand<'PackageJsonBin'>(),
      ])
      .optional(),
    dependencies: z.record(z.string(), z.string().brand<'PackageJsonDependencies'>()).optional(),
    exports: z.record(z.string(), z.json()).optional(),
  })
  .loose()
  .brand<'PackageJson'>();

export type PackageJson = z.infer<typeof packageJsonContract>;

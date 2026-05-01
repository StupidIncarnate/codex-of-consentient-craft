/**
 * PURPOSE: Defines the typed shape of a package.json file used for tech-type detection
 *
 * USAGE:
 * packageJsonContract.parse(JSON.parse(rawJson));
 * // Returns a PackageJson object with typed name, bin, dependencies, and exports fields
 */

import { z } from 'zod';

export const packageJsonContract = z
  .object({
    name: z.string().brand<'PackageJsonName'>().optional(),
    bin: z
      .union([
        z.record(z.string().brand<'BinKey'>(), z.string().brand<'BinPath'>()),
        z.string().brand<'BinPath'>(),
      ])
      .optional(),
    dependencies: z
      .record(z.string().brand<'DepName'>(), z.string().brand<'DepVersion'>())
      .optional(),
    exports: z.record(z.string().brand<'ExportKey'>(), z.unknown()).optional(),
  })
  .passthrough();

export type PackageJson = z.infer<typeof packageJsonContract>;

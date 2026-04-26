/**
 * PURPOSE: Validates the structure of a package.json file for dependency extraction
 *
 * USAGE:
 * const parsed = packageJsonContract.safeParse(rawJson);
 * // Returns a validated PackageJson shape with optional devDependencies map
 */

import { z } from 'zod';

const packageJsonKeyContract = z.string().brand<'PackageJsonKey'>();

export const packageJsonContract = z
  .object({
    devDependencies: z.record(packageJsonKeyContract, z.unknown()).optional(),
  })
  .passthrough();

export type PackageJson = z.infer<typeof packageJsonContract>;

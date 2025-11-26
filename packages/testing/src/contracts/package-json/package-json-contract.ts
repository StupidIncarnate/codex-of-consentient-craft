/**
 * PURPOSE: Validates package.json structure for test projects
 *
 * USAGE:
 * packageJsonContract.parse({name: 'test-project', version: '1.0.0', scripts: {test: 'jest'}});
 * // Returns validated PackageJson with branded types
 */

import { z } from 'zod';

export const packageJsonContract = z
  .object({
    name: z.string().brand<'PackageName'>(),
    version: z.string().brand<'PackageVersion'>(),
    scripts: z.record(z.string().brand<'ScriptCommand'>()),
    devDependencies: z.record(z.string().brand<'DependencyVersion'>()).optional(),
    eslintConfig: z.unknown().optional(),
    jest: z.unknown().optional(),
  })
  .passthrough();

export type PackageJson = z.infer<typeof packageJsonContract>;

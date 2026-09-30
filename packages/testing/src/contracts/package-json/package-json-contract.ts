/**
 * PURPOSE: Validates package.json structure for test projects
 *
 * USAGE:
 * packageJsonContract.parse({name: 'test-project', version: '1.0.0', scripts: {test: 'jest'}});
 * // Returns validated PackageJson with branded types
 */

import { z } from '#gateway/npm/zod';


export const packageJsonContract = z
  .object({
    name: z.string().brand<'PackageJsonName'>(),
    version: z.string().brand<'PackageJsonVersion'>(),
    scripts: z.record(z.string(), z.string().brand<'PackageJsonScripts'>()),
    devDependencies: z
      .record(z.string(), z.string().brand<'PackageJsonDevDependencies'>())
      .optional(),
    eslintConfig: z.json().optional(),
    jest: z.json().optional(),
  })
  .loose().brand<'PackageJson'>();

export type PackageJson = z.infer<typeof packageJsonContract>;

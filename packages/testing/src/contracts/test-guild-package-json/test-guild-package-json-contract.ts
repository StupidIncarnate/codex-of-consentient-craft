/**
 * PURPOSE: Validates package.json structure for test projects
 *
 * USAGE:
 * testGuildPackageJsonContract.parse({name: 'test-project', version: '1.0.0', scripts: {test: 'jest'}});
 * // Returns validated TestGuildPackageJson with branded types
 */

import { z } from '#gateway/npm/zod';

export const testGuildPackageJsonContract = z
  .object({
    name: z.string().brand<'TestGuildPackageJsonName'>(),
    version: z.string().brand<'TestGuildPackageJsonVersion'>(),
    scripts: z.record(z.string(), z.string().brand<'TestGuildPackageJsonScripts'>()),
    devDependencies: z
      .record(z.string(), z.string().brand<'TestGuildPackageJsonDevDependencies'>())
      .optional(),
    eslintConfig: z.json().optional(),
    jest: z.json().optional(),
  })
  .loose()
  .brand<'TestGuildPackageJson'>();

export type TestGuildPackageJson = z.infer<typeof testGuildPackageJsonContract>;

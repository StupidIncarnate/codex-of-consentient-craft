/**
 * PURPOSE: One source file's dependency edges plus its own top-level exported names, the shape
 * `typescriptModuleShapeTransformer` reduces a parsed file to. `localExportNames` is what lets the
 * platform-crossing walk tell a real implementation file (declares names of its own) apart from a
 * pure re-export barrel (declares none), which decides whether a `star` dependency can be narrowed
 * to the specific names an ancestor import actually asked for.
 *
 * USAGE:
 * typescriptModuleShapeContract.parse({dependencies: [], localExportNames: ['userFetchBroker']});
 * // Returns: TypescriptModuleShape
 */

import { z } from '#gateway/npm/zod';
import { moduleDependencyContract } from '../module-dependency/module-dependency-contract';

export const typescriptModuleShapeContract = z
  .object({
    dependencies: z.array(moduleDependencyContract),
    localExportNames: z.array(z.string().min(1).brand<'TypescriptModuleShapeLocalExportNames'>()),
  })
  .brand<'TypescriptModuleShape'>();

export type TypescriptModuleShape = z.infer<typeof typescriptModuleShapeContract>;

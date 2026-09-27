/**
 * PURPOSE: Branded relative "source" path from one entry of a workspace package's own `exports`
 * map. Shared between workspacePackageJsonContract (parsing the raw JSON off disk) and
 * workspacePackageExportSourceTransformer (returning the matched entry's value), so both sides
 * brand the identical string the identical way.
 *
 * USAGE:
 * workspacePackageExportSourcePathContract.parse('./src/glob/glob.ts');
 */

import { z } from 'zod';

export const workspacePackageExportSourcePathContract = z
  .string()
  .brand<'WorkspacePackageExportSourcePath'>();

export type WorkspacePackageExportSourcePath = z.infer<
  typeof workspacePackageExportSourcePathContract
>;

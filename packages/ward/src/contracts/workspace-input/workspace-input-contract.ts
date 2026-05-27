/**
 * PURPOSE: Defines the input shape for a single workspace when deriving tsconfig project references
 *
 * USAGE:
 * workspaceInputContract.parse({ projectPath: '/repo/packages/shared', packageName: '@dm/shared', dependencyNames: [], isCompositeEligible: true });
 * // Returns: WorkspaceInput validated object
 */

import { z } from 'zod';

import { packageJsonContract } from '../package-json/package-json-contract';
import { projectFolderContract } from '../project-folder/project-folder-contract';

export const workspaceInputContract = z.object({
  projectPath: projectFolderContract.shape.path,
  packageName: packageJsonContract.shape.name,
  dependencyNames: z.array(packageJsonContract.shape.name.unwrap()).default([]),
  isCompositeEligible: z.boolean(),
});

export type WorkspaceInput = z.infer<typeof workspaceInputContract>;

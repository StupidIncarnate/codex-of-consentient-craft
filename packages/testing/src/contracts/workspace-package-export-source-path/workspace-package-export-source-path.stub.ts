/**
 * PURPOSE: Builds a valid WorkspacePackageExportSourcePath for tests, defaulting to the shape a
 * `./*` pattern export's own `source` field takes.
 *
 * USAGE:
 * WorkspacePackageExportSourcePathStub({ value: './testing.ts' });
 */

import { workspacePackageExportSourcePathContract } from './workspace-package-export-source-path-contract';
import type { WorkspacePackageExportSourcePath } from './workspace-package-export-source-path-contract';

export const WorkspacePackageExportSourcePathStub = (
  { value }: { value: string } = { value: './src/testing/index.ts' },
): WorkspacePackageExportSourcePath => workspacePackageExportSourcePathContract.parse(value);

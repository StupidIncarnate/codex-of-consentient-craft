/**
 * PURPOSE: Builds a valid WorkspacePackageJson for tests, defaulting to a sibling workspace
 * package's shape (`name` + `exports`) rather than the root's, since that is the shape
 * importPathResolverMiddleware reads far more often.
 *
 * USAGE:
 * WorkspacePackageJsonStub({ name: '@dungeonmaster/bin', exports: {...} });
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { workspacePackageJsonContract } from './workspace-package-json-contract';
import type { WorkspacePackageJson } from './workspace-package-json-contract';

export const WorkspacePackageJsonStub = ({
  ...props
}: StubArgument<WorkspacePackageJson> = {}): WorkspacePackageJson =>
  workspacePackageJsonContract.parse({
    name: '@dungeonmaster/bin',
    exports: {
      './testing': { source: './testing.ts' },
    },
    ...props,
  });

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { workspaceRootPackageJsonContract } from './workspace-root-package-json-contract';
import type { WorkspaceRootPackageJson } from './workspace-root-package-json-contract';

export const WorkspaceRootPackageJsonStub = ({
  ...props
}: StubArgument<WorkspaceRootPackageJson> = {}): WorkspaceRootPackageJson =>
  workspaceRootPackageJsonContract.parse({
    name: 'dungeonmaster',
    workspaces: ['packages/*'],
    ...props,
  });

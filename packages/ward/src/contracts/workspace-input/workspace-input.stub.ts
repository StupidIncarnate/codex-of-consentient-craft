import type { StubArgument } from '@dungeonmaster/shared/@types';
import { workspaceInputContract, type WorkspaceInput } from './workspace-input-contract';

export const WorkspaceInputStub = ({
  ...props
}: StubArgument<WorkspaceInput> = {}): WorkspaceInput =>
  workspaceInputContract.parse({
    projectPath: '/repo/packages/shared',
    packageName: '@dm/shared',
    dependencyNames: [],
    isCompositeEligible: true,
    ...props,
  });

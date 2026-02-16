import type { StubArgument } from '@dungeonmaster/shared/@types';
import { projectFolderContract, type ProjectFolder } from './project-folder-contract';

export const ProjectFolderStub = ({ ...props }: StubArgument<ProjectFolder> = {}): ProjectFolder =>
  projectFolderContract.parse({
    name: 'ward',
    path: '/home/user/project/packages/ward',
    ...props,
  });

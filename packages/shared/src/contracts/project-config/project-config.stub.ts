import type { StubArgument } from '@dungeonmaster/shared/@types';

import { projectConfigContract } from './project-config-contract';
import type { ProjectConfig } from './project-config-contract';

export const ProjectConfigStub = ({ ...props }: StubArgument<ProjectConfig> = {}): ProjectConfig =>
  projectConfigContract.parse({
    projects: [],
    ...props,
  });

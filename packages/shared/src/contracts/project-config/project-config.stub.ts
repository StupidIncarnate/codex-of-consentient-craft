import type { StubArgument } from '../../@types/stub-argument.type';

import { projectConfigContract } from './project-config-contract';
import type { ProjectConfig } from './project-config-contract';

export const ProjectConfigStub = ({ ...props }: StubArgument<ProjectConfig> = {}): ProjectConfig =>
  projectConfigContract.parse({
    ...props,
  });

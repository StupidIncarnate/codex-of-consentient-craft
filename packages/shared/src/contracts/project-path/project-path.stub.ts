import { projectPathContract } from './project-path-contract';
import type { ProjectPath } from './project-path-contract';

export const ProjectPathStub = (
  { value }: { value: string } = { value: '/home/user/my-project' },
): ProjectPath => projectPathContract.parse(value);

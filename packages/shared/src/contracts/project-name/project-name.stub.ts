import { projectNameContract } from './project-name-contract';
import type { ProjectName } from './project-name-contract';

export const ProjectNameStub = (
  { value }: { value: string } = { value: 'My Project' },
): ProjectName => projectNameContract.parse(value);

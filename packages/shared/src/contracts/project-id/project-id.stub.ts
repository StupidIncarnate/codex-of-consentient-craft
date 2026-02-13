import { projectIdContract } from './project-id-contract';
import type { ProjectId } from './project-id-contract';

export const ProjectIdStub = (
  { value }: { value: string } = { value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
): ProjectId => projectIdContract.parse(value);

import type { StubArgument } from '@dungeonmaster/shared/@types';

import { projectContract } from './project-contract';
import type { Project } from './project-contract';

export const ProjectStub = ({ ...props }: StubArgument<Project> = {}): Project =>
  projectContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'My Project',
    path: '/home/user/my-project',
    createdAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });

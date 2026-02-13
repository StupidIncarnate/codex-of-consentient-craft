import type { StubArgument } from '@dungeonmaster/shared/@types';

import { projectListItemContract } from './project-list-item-contract';
import type { ProjectListItem } from './project-list-item-contract';

export const ProjectListItemStub = ({
  ...props
}: StubArgument<ProjectListItem> = {}): ProjectListItem =>
  projectListItemContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'My Project',
    path: '/home/user/my-project',
    createdAt: '2024-01-15T10:00:00.000Z',
    valid: true,
    questCount: 0,
    ...props,
  });

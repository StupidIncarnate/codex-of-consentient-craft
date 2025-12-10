import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questTaskContract } from './quest-task-contract';
import type { QuestTask } from './quest-task-contract';

export const QuestTaskStub = ({ ...props }: StubArgument<QuestTask> = {}): QuestTask =>
  questTaskContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Create service',
    type: 'implementation',
    status: 'pending',
    ...props,
  });

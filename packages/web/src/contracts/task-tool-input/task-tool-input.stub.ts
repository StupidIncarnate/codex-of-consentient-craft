import type { StubArgument } from '@dungeonmaster/shared/@types';

import { taskToolInputContract } from './task-tool-input-contract';
import type { TaskToolInput } from './task-tool-input-contract';

export const TaskToolInputStub = ({ ...props }: StubArgument<TaskToolInput> = {}): TaskToolInput =>
  taskToolInputContract.parse({
    description: 'Run the test suite',
    ...props,
  });

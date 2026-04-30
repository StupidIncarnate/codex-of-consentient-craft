import type { StubArgument } from '@dungeonmaster/shared/@types';

import { taskAgentToolInputContract } from './task-agent-tool-input-contract';
import type { TaskAgentToolInput } from './task-agent-tool-input-contract';

export const TaskAgentToolInputStub = ({
  ...props
}: StubArgument<TaskAgentToolInput> = {}): TaskAgentToolInput =>
  taskAgentToolInputContract.parse({
    prompt: 'Research the auth system and report back with file paths and purposes.',
    ...props,
  });

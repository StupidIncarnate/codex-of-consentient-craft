import type { StubArgument } from '@dungeonmaster/shared/@types';

import { taskNotificationDataContract } from './task-notification-data-contract';
import type { TaskNotificationData } from './task-notification-data-contract';

export const TaskNotificationDataStub = ({
  ...props
}: StubArgument<TaskNotificationData> = {}): TaskNotificationData =>
  taskNotificationDataContract.parse({
    taskId: 'acfc7f06a8ac21baf',
    status: 'completed',
    summary: 'Agent "MCP calls test - background sub-agent" completed',
    result: 'Made both MCP calls successfully.',
    totalTokens: 28054,
    toolUses: 3,
    durationMs: 9033,
    ...props,
  });

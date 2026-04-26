import type { StubArgument } from '@dungeonmaster/shared/@types';

import { inflatedTaskNotificationContentContract } from './inflated-task-notification-content-contract';
import type { InflatedTaskNotificationContent } from './inflated-task-notification-content-contract';

/**
 * Default inflated content with a task-notification payload — matches what the XML
 * inflater emits for `<task-notification><task-id>t1</task-id></task-notification>`.
 */
export const InflatedTaskNotificationContentStub = ({
  ...props
}: StubArgument<InflatedTaskNotificationContent> = {}): InflatedTaskNotificationContent =>
  inflatedTaskNotificationContentContract.parse({
    taskNotification: { taskId: 't1', status: 'completed' },
    ...props,
  });

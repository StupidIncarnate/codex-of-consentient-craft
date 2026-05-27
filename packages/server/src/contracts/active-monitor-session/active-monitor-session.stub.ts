import type { StubArgument } from '@dungeonmaster/shared/@types';

import { activeMonitorSessionContract } from './active-monitor-session-contract';
import type { ActiveMonitorSession } from './active-monitor-session-contract';

export const ActiveMonitorSessionStub = ({
  ...props
}: StubArgument<ActiveMonitorSession> = {}): ActiveMonitorSession =>
  activeMonitorSessionContract.parse({
    parentSessionId: 'abc-123-def-456',
    projectDir: '/home/user/my-project',
    registeredAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });

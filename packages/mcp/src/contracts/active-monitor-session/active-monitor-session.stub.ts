import type { StubArgument } from '@dungeonmaster/shared/@types';

import { activeMonitorSessionContract } from './active-monitor-session-contract';
import type { ActiveMonitorSession } from './active-monitor-session-contract';

export const ActiveMonitorSessionStub = ({
  ...overrides
}: StubArgument<ActiveMonitorSession> = {}): ActiveMonitorSession =>
  activeMonitorSessionContract.parse({
    parentSessionId: 'parent-session-id',
    projectDir: '/home/user/project',
    registeredAt: '2026-05-14T00:00:00.000Z',
    ...overrides,
  });

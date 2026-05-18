import type { StubArgument } from '@dungeonmaster/shared/@types';

import { activeMonitorSessionContract } from './active-monitor-session-contract';
import type { ActiveMonitorSession } from './active-monitor-session-contract';

export const ActiveMonitorSessionStub = ({
  ...props
}: StubArgument<ActiveMonitorSession> = {}): ActiveMonitorSession =>
  activeMonitorSessionContract.parse({
    projectDir: '/home/user/.claude/projects/-home-user-proj',
    sessionFilePath: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
    registeredAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });

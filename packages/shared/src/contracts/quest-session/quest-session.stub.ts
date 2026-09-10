import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questSessionContract } from './quest-session-contract';
import type { QuestSession } from './quest-session-contract';

export const QuestSessionStub = ({ ...props }: StubArgument<QuestSession> = {}): QuestSession =>
  questSessionContract.parse({
    sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
    cwd: '/repo',
    role: 'codeweaver',
    startedAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });

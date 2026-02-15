import type { StubArgument } from '@dungeonmaster/shared/@types';

import { chatSessionContract } from './chat-session-contract';
import type { ChatSession } from './chat-session-contract';

export const ChatSessionStub = ({ ...props }: StubArgument<ChatSession> = {}): ChatSession =>
  chatSessionContract.parse({
    sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
    agentRole: 'PathSeeker',
    startedAt: '2024-01-15T10:00:00.000Z',
    active: false,
    ...props,
  });

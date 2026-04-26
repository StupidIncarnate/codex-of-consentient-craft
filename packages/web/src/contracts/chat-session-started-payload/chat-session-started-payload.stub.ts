import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ProcessIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { chatSessionStartedPayloadContract } from './chat-session-started-payload-contract';
import type { ChatSessionStartedPayload } from './chat-session-started-payload-contract';

export const ChatSessionStartedPayloadStub = ({
  ...props
}: StubArgument<ChatSessionStartedPayload> = {}): ChatSessionStartedPayload =>
  chatSessionStartedPayloadContract.parse({
    chatProcessId: ProcessIdStub(),
    sessionId: SessionIdStub(),
    ...props,
  });

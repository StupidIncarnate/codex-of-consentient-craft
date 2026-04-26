import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ProcessIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { chatOutputPayloadContract } from './chat-output-payload-contract';
import type { ChatOutputPayload } from './chat-output-payload-contract';

export const ChatOutputPayloadStub = ({
  ...props
}: StubArgument<ChatOutputPayload> = {}): ChatOutputPayload =>
  chatOutputPayloadContract.parse({
    chatProcessId: ProcessIdStub(),
    entries: [],
    sessionId: SessionIdStub(),
    ...props,
  });

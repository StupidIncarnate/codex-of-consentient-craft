import type { StubArgument } from '@dungeonmaster/shared/@types';

import { chatStreamEndedPayloadContract } from './chat-stream-ended-payload-contract';
import type { ChatStreamEndedPayload } from './chat-stream-ended-payload-contract';

export const ChatStreamEndedPayloadStub = ({
  ...props
}: StubArgument<ChatStreamEndedPayload> = {}): ChatStreamEndedPayload =>
  chatStreamEndedPayloadContract.parse({
    ...props,
  });

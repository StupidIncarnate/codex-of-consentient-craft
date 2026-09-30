import type { StubArgument } from '@dungeonmaster/shared/@types';

import { chatCompletePayloadContract } from './chat-complete-payload-contract';
import type { ChatCompletePayload } from './chat-complete-payload-contract';

export const ChatCompletePayloadStub = ({
  ...props
}: StubArgument<ChatCompletePayload> = {}): ChatCompletePayload =>
  chatCompletePayloadContract.parse({
    chatProcessId: 'proc-12345',
    ...props,
  });

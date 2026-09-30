import type { StubArgument } from '@dungeonmaster/shared/@types';

import { chatHistoryCompletePayloadContract } from './chat-history-complete-payload-contract';
import type { ChatHistoryCompletePayload } from './chat-history-complete-payload-contract';

export const ChatHistoryCompletePayloadStub = ({
  ...props
}: StubArgument<ChatHistoryCompletePayload> = {}): ChatHistoryCompletePayload =>
  chatHistoryCompletePayloadContract.parse({
    chatProcessId: 'proc-12345',
    ...props,
  });

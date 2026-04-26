import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { chatCompletePayloadContract } from './chat-complete-payload-contract';
import type { ChatCompletePayload } from './chat-complete-payload-contract';

export const ChatCompletePayloadStub = ({
  ...props
}: StubArgument<ChatCompletePayload> = {}): ChatCompletePayload =>
  chatCompletePayloadContract.parse({
    chatProcessId: ProcessIdStub(),
    ...props,
  });

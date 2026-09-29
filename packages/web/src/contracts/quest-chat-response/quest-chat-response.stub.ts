import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts/process-id/process-id.stub';

import { questChatResponseContract } from './quest-chat-response-contract';
import type { QuestChatResponse } from './quest-chat-response-contract';

export const QuestChatResponseStub = ({
  ...props
}: StubArgument<QuestChatResponse> = {}): QuestChatResponse =>
  questChatResponseContract.parse({
    chatProcessId: ProcessIdStub(),
    ...props,
  });

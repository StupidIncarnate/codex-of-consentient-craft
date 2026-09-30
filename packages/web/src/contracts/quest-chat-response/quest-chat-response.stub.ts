import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questChatResponseContract } from './quest-chat-response-contract';
import type { QuestChatResponse } from './quest-chat-response-contract';

export const QuestChatResponseStub = ({
  ...props
}: StubArgument<QuestChatResponse> = {}): QuestChatResponse =>
  questChatResponseContract.parse({
    chatProcessId: 'proc-12345',
    ...props,
  });

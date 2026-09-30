import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questChatResponseDataContract } from './quest-chat-response-data-contract';
import type { QuestChatResponseData } from './quest-chat-response-data-contract';

export const QuestChatResponseDataStub = ({
  ...props
}: StubArgument<QuestChatResponseData> = {}): QuestChatResponseData =>
  questChatResponseDataContract.parse({
    chatProcessId: 'chat-12345',
    ...props,
  });

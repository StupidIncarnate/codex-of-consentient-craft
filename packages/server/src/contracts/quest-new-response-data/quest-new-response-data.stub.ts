import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questNewResponseDataContract } from './quest-new-response-data-contract';
import type { QuestNewResponseData } from './quest-new-response-data-contract';

export const QuestNewResponseDataStub = ({
  ...props
}: StubArgument<QuestNewResponseData> = {}): QuestNewResponseData =>
  questNewResponseDataContract.parse({
    questId: 'add-auth',
    chatProcessId: 'chat-12345',
    ...props,
  });

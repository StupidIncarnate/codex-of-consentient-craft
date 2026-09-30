import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questClarifyResponseDataContract } from './quest-clarify-response-data-contract';
import type { QuestClarifyResponseData } from './quest-clarify-response-data-contract';

export const QuestClarifyResponseDataStub = ({
  ...props
}: StubArgument<QuestClarifyResponseData> = {}): QuestClarifyResponseData =>
  questClarifyResponseDataContract.parse({
    chatProcessId: 'chat-12345',
    ...props,
  });

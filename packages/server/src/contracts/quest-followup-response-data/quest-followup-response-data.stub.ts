import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questFollowupResponseDataContract } from './quest-followup-response-data-contract';
import type { QuestFollowupResponseData } from './quest-followup-response-data-contract';

export const QuestFollowupResponseDataStub = ({
  ...props
}: StubArgument<QuestFollowupResponseData> = {}): QuestFollowupResponseData =>
  questFollowupResponseDataContract.parse({
    chatProcessId: 'chat-12345',
    ...props,
  });

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questFollowupStopResponseDataContract } from './quest-followup-stop-response-data-contract';
import type { QuestFollowupStopResponseData } from './quest-followup-stop-response-data-contract';

export const QuestFollowupStopResponseDataStub = ({
  ...props
}: StubArgument<QuestFollowupStopResponseData> = {}): QuestFollowupStopResponseData =>
  questFollowupStopResponseDataContract.parse({
    stopped: true,
    ...props,
  });

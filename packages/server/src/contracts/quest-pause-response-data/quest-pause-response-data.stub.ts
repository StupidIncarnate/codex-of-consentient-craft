import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questPauseResponseDataContract } from './quest-pause-response-data-contract';
import type { QuestPauseResponseData } from './quest-pause-response-data-contract';

export const QuestPauseResponseDataStub = ({
  ...props
}: StubArgument<QuestPauseResponseData> = {}): QuestPauseResponseData =>
  questPauseResponseDataContract.parse({
    paused: true,
    ...props,
  });

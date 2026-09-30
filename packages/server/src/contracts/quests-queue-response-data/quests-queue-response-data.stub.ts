import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts/quest-queue-entry/quest-queue-entry.stub';
import { questsQueueResponseDataContract } from './quests-queue-response-data-contract';
import type { QuestsQueueResponseData } from './quests-queue-response-data-contract';

export const QuestsQueueResponseDataStub = ({
  ...props
}: StubArgument<QuestsQueueResponseData> = {}): QuestsQueueResponseData =>
  questsQueueResponseDataContract.parse({
    entries: [QuestQueueEntryStub()],
    ...props,
  });

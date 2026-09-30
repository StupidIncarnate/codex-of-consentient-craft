import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestListItemStub } from '@dungeonmaster/shared/contracts/quest-list-item/quest-list-item.stub';
import { questListResponseDataContract } from './quest-list-response-data-contract';
import type { QuestListResponseData } from './quest-list-response-data-contract';

export const QuestListResponseDataStub = ({
  ...props
}: StubArgument<QuestListResponseData> = {}): QuestListResponseData =>
  questListResponseDataContract.parse({
    quests: [QuestListItemStub()],
    skipped: [
      { questFolder: '002-broken', questFilePath: '002-broken/quest.json', reason: 'invalid json' },
    ],
    ...props,
  });

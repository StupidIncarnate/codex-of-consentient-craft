import { QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { questListResponseContract } from './quest-list-response-contract';
import type { QuestListResponse } from './quest-list-response-contract';

type QuestListItem = ReturnType<typeof QuestListItemStub>;

export const QuestListResponseStub = (
  { value }: { value: QuestListItem[] } = { value: [QuestListItemStub()] },
): QuestListResponse => questListResponseContract.parse(value);

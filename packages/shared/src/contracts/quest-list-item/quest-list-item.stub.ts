import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questListItemContract } from './quest-list-item-contract';
import type { QuestListItem } from './quest-list-item-contract';

export const QuestListItemStub = ({ ...props }: StubArgument<QuestListItem> = {}): QuestListItem =>
  questListItemContract.parse({
    id: 'add-auth',
    folder: '001-add-auth',
    title: 'Add Authentication',
    status: 'in_progress',
    createdAt: '2024-01-15T10:00:00.000Z',
    stepProgress: '2/5',
    ...props,
  });

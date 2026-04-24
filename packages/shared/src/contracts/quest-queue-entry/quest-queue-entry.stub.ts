import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questQueueEntryContract } from './quest-queue-entry-contract';
import type { QuestQueueEntry } from './quest-queue-entry-contract';

export const QuestQueueEntryStub = ({
  ...props
}: StubArgument<QuestQueueEntry> = {}): QuestQueueEntry =>
  questQueueEntryContract.parse({
    questId: 'add-auth',
    guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    guildSlug: 'my-guild',
    questTitle: 'Add Authentication',
    status: 'in_progress',
    enqueuedAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });

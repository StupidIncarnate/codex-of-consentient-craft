/**
 * PURPOSE: Builds a valid UseQuestQueueResult for tests
 *
 * USAGE:
 * UseQuestQueueResultStub();
 * // Returns a valid UseQuestQueueResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts/quest-queue-entry/quest-queue-entry.stub';

import { useQuestQueueResultContract } from './use-quest-queue-result-contract';
import type { UseQuestQueueResult } from './use-quest-queue-result-contract';

export const UseQuestQueueResultStub = ({
  ...props
}: StubArgument<UseQuestQueueResult> = {}): UseQuestQueueResult =>
  useQuestQueueResultContract.parse({
    activeEntry: QuestQueueEntryStub(),
    allEntries: [],
    errorEntry: QuestQueueEntryStub(),
    isLoading: false,
    ...props,
  });

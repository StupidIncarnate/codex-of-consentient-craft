/**
 * PURPOSE: Builds a valid QuestQueueResult for tests, defaulting to an empty queue.
 *
 * USAGE:
 * QuestQueueResultStub({ entries: [QuestQueueEntryStub()] });
 * // Returns { entries: [...] }
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questQueueResultContract } from './quest-queue-result-contract';
import type { QuestQueueResult } from './quest-queue-result-contract';

export const QuestQueueResultStub = ({
  ...props
}: StubArgument<QuestQueueResult> = {}): QuestQueueResult =>
  questQueueResultContract.parse({
    entries: [],
    ...props,
  });

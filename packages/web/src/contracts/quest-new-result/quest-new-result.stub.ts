/**
 * PURPOSE: Builds a valid QuestNewResult for tests
 *
 * USAGE:
 * QuestNewResultStub();
 * // Returns a valid QuestNewResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { questNewResultContract } from './quest-new-result-contract';
import type { QuestNewResult } from './quest-new-result-contract';

export const QuestNewResultStub = ({
  ...props
}: StubArgument<QuestNewResult> = {}): QuestNewResult =>
  questNewResultContract.parse({ questId: QuestStub().id, chatProcessId: 'sample', ...props });

/**
 * PURPOSE: Builds a valid UseQuestSummaryResult for tests
 *
 * USAGE:
 * UseQuestSummaryResultStub();
 * // Returns a valid UseQuestSummaryResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestSummaryStub } from '@dungeonmaster/shared/contracts/quest-summary/quest-summary.stub';

import { useQuestSummaryResultContract } from './use-quest-summary-result-contract';
import type { UseQuestSummaryResult } from './use-quest-summary-result-contract';

export const UseQuestSummaryResultStub = ({
  ...props
}: StubArgument<UseQuestSummaryResult> = {}): UseQuestSummaryResult =>
  useQuestSummaryResultContract.parse({
    data: QuestSummaryStub(),
    loading: false,
    error: new Error('sample'),
    ...props,
  });

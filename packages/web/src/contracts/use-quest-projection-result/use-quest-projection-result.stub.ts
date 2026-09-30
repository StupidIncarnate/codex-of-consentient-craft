/**
 * PURPOSE: Builds a valid UseQuestProjectionResult for tests
 *
 * USAGE:
 * UseQuestProjectionResultStub();
 * // Returns a valid UseQuestProjectionResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestProjectionStub } from '@dungeonmaster/shared/contracts/quest-projection/quest-projection.stub';

import { useQuestProjectionResultContract } from './use-quest-projection-result-contract';
import type { UseQuestProjectionResult } from './use-quest-projection-result-contract';

export const UseQuestProjectionResultStub = ({
  ...props
}: StubArgument<UseQuestProjectionResult> = {}): UseQuestProjectionResult =>
  useQuestProjectionResultContract.parse({
    data: QuestProjectionStub(),
    loading: false,
    error: new Error('sample'),
    ...props,
  });

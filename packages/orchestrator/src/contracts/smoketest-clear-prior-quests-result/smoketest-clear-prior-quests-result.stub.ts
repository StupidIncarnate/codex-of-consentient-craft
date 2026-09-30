/**
 * PURPOSE: Builds a valid SmoketestClearPriorQuestsResult for tests
 *
 * USAGE:
 * SmoketestClearPriorQuestsResultStub();
 * // Returns a valid SmoketestClearPriorQuestsResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { smoketestClearPriorQuestsResultContract } from './smoketest-clear-prior-quests-result-contract';
import type { SmoketestClearPriorQuestsResult } from './smoketest-clear-prior-quests-result-contract';

export const SmoketestClearPriorQuestsResultStub = ({
  ...props
}: StubArgument<SmoketestClearPriorQuestsResult> = {}): SmoketestClearPriorQuestsResult =>
  smoketestClearPriorQuestsResultContract.parse({ deletedCount: 0, ...props });

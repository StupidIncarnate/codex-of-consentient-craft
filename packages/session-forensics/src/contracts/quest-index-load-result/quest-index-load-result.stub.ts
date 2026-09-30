/**
 * PURPOSE: Builds a valid QuestIndexLoadResult for tests
 *
 * USAGE:
 * QuestIndexLoadResultStub();
 * // Returns a valid QuestIndexLoadResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questIndexLoadResultContract } from './quest-index-load-result-contract';
import type { QuestIndexLoadResult } from './quest-index-load-result-contract';

export const QuestIndexLoadResultStub = ({
  ...props
}: StubArgument<QuestIndexLoadResult> = {}): QuestIndexLoadResult =>
  questIndexLoadResultContract.parse({
    userRequest: 'sample',
    workItems: [],
    operations: [],
    wardResults: [],
    riftcarverResults: [],
    ...props,
  });

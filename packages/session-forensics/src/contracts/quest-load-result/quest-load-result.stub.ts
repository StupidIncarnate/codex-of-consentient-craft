/**
 * PURPOSE: Builds a valid QuestLoadResult for tests
 *
 * USAGE:
 * QuestLoadResultStub();
 * // Returns a valid QuestLoadResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questLoadResultContract } from './quest-load-result-contract';
import type { QuestLoadResult } from './quest-load-result-contract';

export const QuestLoadResultStub = ({
  ...props
}: StubArgument<QuestLoadResult> = {}): QuestLoadResult =>
  questLoadResultContract.parse({ flows: [], workItems: [], ...props });

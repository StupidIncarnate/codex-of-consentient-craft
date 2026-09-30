/**
 * PURPOSE: Builds a valid QuestFollowupResult for tests
 *
 * USAGE:
 * QuestFollowupResultStub();
 * // Returns a valid QuestFollowupResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questFollowupResultContract } from './quest-followup-result-contract';
import type { QuestFollowupResult } from './quest-followup-result-contract';

export const QuestFollowupResultStub = ({
  ...props
}: StubArgument<QuestFollowupResult> = {}): QuestFollowupResult =>
  questFollowupResultContract.parse({ chatProcessId: 'sample', ...props });

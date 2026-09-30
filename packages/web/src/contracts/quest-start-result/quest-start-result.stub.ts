/**
 * PURPOSE: Builds a valid QuestStartResult for tests
 *
 * USAGE:
 * QuestStartResultStub();
 * // Returns a valid QuestStartResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questStartResultContract } from './quest-start-result-contract';
import type { QuestStartResult } from './quest-start-result-contract';

export const QuestStartResultStub = ({
  ...props
}: StubArgument<QuestStartResult> = {}): QuestStartResult =>
  questStartResultContract.parse({ processId: 'sample', ...props });

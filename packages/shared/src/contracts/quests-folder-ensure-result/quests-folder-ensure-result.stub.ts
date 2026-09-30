/**
 * PURPOSE: Builds a valid QuestsFolderEnsureResult for tests
 *
 * USAGE:
 * QuestsFolderEnsureResultStub();
 * // Returns a valid QuestsFolderEnsureResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questsFolderEnsureResultContract } from './quests-folder-ensure-result-contract';
import type { QuestsFolderEnsureResult } from './quests-folder-ensure-result-contract';

export const QuestsFolderEnsureResultStub = ({
  ...props
}: StubArgument<QuestsFolderEnsureResult> = {}): QuestsFolderEnsureResult =>
  questsFolderEnsureResultContract.parse({ questsBasePath: 'sample', ...props });

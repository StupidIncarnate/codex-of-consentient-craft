/**
 * PURPOSE: Builds a valid QuestResolveQuestsPathResult for tests
 *
 * USAGE:
 * QuestResolveQuestsPathResultStub();
 * // Returns a valid QuestResolveQuestsPathResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questResolveQuestsPathResultContract } from './quest-resolve-quests-path-result-contract';
import type { QuestResolveQuestsPathResult } from './quest-resolve-quests-path-result-contract';

export const QuestResolveQuestsPathResultStub = ({
  ...props
}: StubArgument<QuestResolveQuestsPathResult> = {}): QuestResolveQuestsPathResult =>
  questResolveQuestsPathResultContract.parse({ questsPath: 'sample', ...props });

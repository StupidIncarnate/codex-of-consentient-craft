/**
 * PURPOSE: Builds a valid QuestFindQuestPathResult for tests
 *
 * USAGE:
 * QuestFindQuestPathResultStub();
 * // Returns a valid QuestFindQuestPathResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';

import { questFindQuestPathResultContract } from './quest-find-quest-path-result-contract';
import type { QuestFindQuestPathResult } from './quest-find-quest-path-result-contract';

export const QuestFindQuestPathResultStub = ({
  ...props
}: StubArgument<QuestFindQuestPathResult> = {}): QuestFindQuestPathResult =>
  questFindQuestPathResultContract.parse({
    questPath: 'sample',
    guildId: GuildStub().id,
    ...props,
  });

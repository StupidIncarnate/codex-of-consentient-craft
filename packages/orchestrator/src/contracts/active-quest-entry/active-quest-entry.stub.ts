import type { StubArgument } from '@dungeonmaster/shared/@types';
import { GuildIdStub, QuestStub, UrlSlugStub } from '@dungeonmaster/shared/contracts';

import { activeQuestEntryContract } from './active-quest-entry-contract';
import type { ActiveQuestEntry } from './active-quest-entry-contract';

export const ActiveQuestEntryStub = ({
  ...props
}: StubArgument<ActiveQuestEntry> = {}): ActiveQuestEntry =>
  activeQuestEntryContract.parse({
    quest: QuestStub(),
    guildId: GuildIdStub(),
    guildSlug: UrlSlugStub(),
    ...props,
  });

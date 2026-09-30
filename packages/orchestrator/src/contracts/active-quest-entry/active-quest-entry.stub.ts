import type { StubArgument } from '@dungeonmaster/shared/@types';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { activeQuestEntryContract } from './active-quest-entry-contract';
import type { ActiveQuestEntry } from './active-quest-entry-contract';

export const ActiveQuestEntryStub = ({
  ...props
}: StubArgument<ActiveQuestEntry> = {}): ActiveQuestEntry =>
  activeQuestEntryContract.parse({
    quest: QuestStub(),
    guildId: GuildIdStub(),
    guildSlug: 'my-guild',
    ...props,
  });

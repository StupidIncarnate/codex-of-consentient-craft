import {
  GuildListItemStub,
  QuestIdStub,
  QuestStub,
  UrlSlugStub,
} from '@dungeonmaster/shared/contracts';

import { questActiveQuestsBroker } from './quest-active-quests-broker';
import { questActiveQuestsBrokerProxy } from './quest-active-quests-broker.proxy';

describe('questActiveQuestsBroker', () => {
  it('EMPTY: {no guilds} => returns []', async () => {
    const proxy = questActiveQuestsBrokerProxy();
    proxy.setupNoGuilds();

    await expect(questActiveQuestsBroker()).resolves.toStrictEqual([]);
  });

  it('VALID: {one guild, in_progress + paused + spec} => includes in_progress and paused (queued), excludes spec, FIFO by createdAt', async () => {
    const proxy = questActiveQuestsBrokerProxy();
    const guildSlug = UrlSlugStub({ value: 'my-guild' });
    const guild = GuildListItemStub({ urlSlug: guildSlug });
    const running = QuestStub({
      id: QuestIdStub({ value: 'q-run' }),
      status: 'in_progress',
      createdAt: '2024-01-15T10:00:00.000Z',
    });
    const paused = QuestStub({
      id: QuestIdStub({ value: 'q-paused' }),
      status: 'paused',
      createdAt: '2024-01-15T09:30:00.000Z',
    });
    const spec = QuestStub({
      id: QuestIdStub({ value: 'q-spec' }),
      status: 'review_flows',
      createdAt: '2024-01-15T09:00:00.000Z',
    });
    proxy.setupGuildsAndQuests({
      guildItems: [guild],
      questsByGuildId: [{ guildId: guild.id, quests: [running, paused, spec] }],
    });

    await expect(questActiveQuestsBroker()).resolves.toStrictEqual([
      { quest: paused, guildId: guild.id, guildSlug },
      { quest: running, guildId: guild.id, guildSlug },
    ]);
  });

  it('VALID: {two guilds, in_progress quests} => returns them FIFO by createdAt (oldest head first)', async () => {
    const proxy = questActiveQuestsBrokerProxy();
    const slugA = UrlSlugStub({ value: 'guild-a' });
    const slugB = UrlSlugStub({ value: 'guild-b' });
    const guildA = GuildListItemStub({
      id: '11111111-1111-4111-8111-111111111111',
      urlSlug: slugA,
    });
    const guildB = GuildListItemStub({
      id: '22222222-2222-4222-8222-222222222222',
      urlSlug: slugB,
    });
    const newer = QuestStub({
      id: QuestIdStub({ value: 'q-newer' }),
      status: 'in_progress',
      createdAt: '2024-01-15T12:00:00.000Z',
    });
    const older = QuestStub({
      id: QuestIdStub({ value: 'q-older' }),
      status: 'in_progress',
      createdAt: '2024-01-15T08:00:00.000Z',
    });
    proxy.setupGuildsAndQuests({
      guildItems: [guildA, guildB],
      questsByGuildId: [
        { guildId: guildA.id, quests: [newer] },
        { guildId: guildB.id, quests: [older] },
      ],
    });

    await expect(questActiveQuestsBroker()).resolves.toStrictEqual([
      { quest: older, guildId: guildB.id, guildSlug: slugB },
      { quest: newer, guildId: guildA.id, guildSlug: slugA },
    ]);
  });
});

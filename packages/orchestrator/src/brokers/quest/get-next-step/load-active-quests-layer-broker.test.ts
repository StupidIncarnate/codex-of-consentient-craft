import {
  GuildIdStub,
  GuildListItemStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { loadActiveQuestsLayerBroker } from './load-active-quests-layer-broker';
import { loadActiveQuestsLayerBrokerProxy } from './load-active-quests-layer-broker.proxy';

describe('loadActiveQuestsLayerBroker', () => {
  it('EMPTY: {no guilds} => returns []', async () => {
    const proxy = loadActiveQuestsLayerBrokerProxy();
    proxy.setupNoGuilds();

    const result = await loadActiveQuestsLayerBroker();

    expect(result).toStrictEqual([]);
  });

  it('VALID: {one guild with in_progress quest} => returns that quest', async () => {
    const proxy = loadActiveQuestsLayerBrokerProxy();
    const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
    const guildItem = GuildListItemStub({ id: guildId, valid: true });
    const quest = QuestStub({
      id: QuestIdStub({ value: 'q-running' }),
      status: 'in_progress',
    });
    proxy.setupGuildsAndQuests({
      guildItems: [guildItem],
      questsByGuildId: [{ guildId, quests: [quest] }],
    });

    const result = await loadActiveQuestsLayerBroker();

    expect(result).toStrictEqual([quest]);
  });

  it('VALID: {one guild with approved (pre-execution) quest} => excluded, returns []', async () => {
    const proxy = loadActiveQuestsLayerBrokerProxy();
    const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
    const guildItem = GuildListItemStub({ id: guildId, valid: true });
    const quest = QuestStub({
      id: QuestIdStub({ value: 'q-spec' }),
      status: 'approved',
    });
    proxy.setupGuildsAndQuests({
      guildItems: [guildItem],
      questsByGuildId: [{ guildId, quests: [quest] }],
    });

    const result = await loadActiveQuestsLayerBroker();

    expect(result).toStrictEqual([]);
  });

  it('VALID: {invalid guild} => skipped, returns []', async () => {
    const proxy = loadActiveQuestsLayerBrokerProxy();
    const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
    const guildItem = GuildListItemStub({ id: guildId, valid: false });
    proxy.setupGuildsAndQuests({
      guildItems: [guildItem],
      questsByGuildId: [],
    });

    const result = await loadActiveQuestsLayerBroker();

    expect(result).toStrictEqual([]);
  });
});

import {
  GuildIdStub,
  GuildListItemStub,
  QuestIdStub,
  QuestStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { AgentIdStub } from '../../../contracts/agent-id/agent-id.stub';
import { refreshActiveAgentIdsLayerBroker } from './refresh-active-agent-ids-layer-broker';
import { refreshActiveAgentIdsLayerBrokerProxy } from './refresh-active-agent-ids-layer-broker.proxy';

type QuestId = ReturnType<typeof QuestIdStub>;
type AgentId = ReturnType<typeof AgentIdStub>;

describe('refreshActiveAgentIdsLayerBroker', () => {
  it('EMPTY: {no guilds} => map is unchanged, droppedQuestIds is empty', async () => {
    const proxy = refreshActiveAgentIdsLayerBrokerProxy();
    proxy.setupGuilds({ guilds: [] });

    const map = new Map<QuestId, Set<AgentId>>();
    const result = await refreshActiveAgentIdsLayerBroker({ activeAgentIdsByQuest: map });

    expect(result).toStrictEqual({ droppedQuestIds: [] });
    expect(map.size).toBe(0);
  });

  it('VALID: {one active quest with one in_progress agentId} => populates the map', async () => {
    const proxy = refreshActiveAgentIdsLayerBrokerProxy();
    const guildId = GuildIdStub({ value: '787093e7-1906-1194-8299-9ec402ef2c7e' });
    const questId = QuestIdStub({ value: 'q-active-1' });
    const agentId = AgentIdStub({ value: 'agent-1' });

    proxy.setupGuilds({ guilds: [GuildListItemStub({ id: guildId, valid: true })] });
    proxy.setupQuests({
      quests: [
        QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [WorkItemStub({ status: 'in_progress', agentId })],
        }),
      ],
    });

    const map = new Map<QuestId, Set<AgentId>>();
    await refreshActiveAgentIdsLayerBroker({ activeAgentIdsByQuest: map });

    expect(map.size).toBe(1);
    expect(map.get(questId)).toStrictEqual(new Set([agentId]));
  });

  it('VALID: {work item without agentId} => excluded from active set', async () => {
    const proxy = refreshActiveAgentIdsLayerBrokerProxy();
    const guildId = GuildIdStub({ value: '17b1ab22-4310-3fc0-b2cc-e513e3c7bfe3' });
    const questId = QuestIdStub({ value: 'q-no-agent' });

    proxy.setupGuilds({ guilds: [GuildListItemStub({ id: guildId, valid: true })] });
    proxy.setupQuests({
      quests: [
        QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [WorkItemStub({ status: 'in_progress' })],
        }),
      ],
    });

    const map = new Map<QuestId, Set<AgentId>>();
    await refreshActiveAgentIdsLayerBroker({ activeAgentIdsByQuest: map });

    expect(map.get(questId)).toStrictEqual(new Set());
  });

  it('VALID: {quest disappears between calls} => removed from map and reported in droppedQuestIds', async () => {
    const proxy = refreshActiveAgentIdsLayerBrokerProxy();
    const guildId = GuildIdStub({ value: '40ec4fe9-dc49-5d95-9a95-6c24b90dfb24' });
    const goneQuestId = QuestIdStub({ value: 'q-gone' });

    const map = new Map<QuestId, Set<AgentId>>();
    map.set(goneQuestId, new Set([AgentIdStub({ value: 'agent-stale' })]));

    proxy.setupGuilds({ guilds: [GuildListItemStub({ id: guildId, valid: true })] });
    proxy.setupQuests({ quests: [] });

    const result = await refreshActiveAgentIdsLayerBroker({ activeAgentIdsByQuest: map });

    expect(map.has(goneQuestId)).toBe(false);
    expect(result).toStrictEqual({ droppedQuestIds: [goneQuestId] });
  });

  it('VALID: {invalid guild} => skipped, no quests stamped', async () => {
    const proxy = refreshActiveAgentIdsLayerBrokerProxy();
    const guildId = GuildIdStub({ value: '05291b9a-ec64-2f2b-ac45-b7d3ee1cfaa5' });

    proxy.setupGuilds({ guilds: [GuildListItemStub({ id: guildId, valid: false })] });

    const map = new Map<QuestId, Set<AgentId>>();
    await refreshActiveAgentIdsLayerBroker({ activeAgentIdsByQuest: map });

    expect(map.size).toBe(0);
  });
});

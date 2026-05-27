import {
  GuildIdStub,
  GuildListItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { ActiveQuestFacadeStub } from '../../../contracts/active-quest-facade/active-quest-facade.stub';
import { scanOnceLayerBroker } from './scan-once-layer-broker';
import { scanOnceLayerBrokerProxy } from './scan-once-layer-broker.proxy';

describe('scanOnceLayerBroker', () => {
  it('EMPTY: {no guilds} => clears active quest and returns null', async () => {
    const proxy = scanOnceLayerBrokerProxy();
    proxy.setupNoGuilds();
    const clear = jest.fn();
    const activeQuest = ActiveQuestFacadeStub({ clear });

    const result = await scanOnceLayerBroker({ activeQuest });

    expect(result).toBe(null);
    expect(clear).toHaveBeenCalledWith();
  });

  it('VALID: {one in_progress quest with ready codeweaver} => sets active and returns spawn-agents', async () => {
    const proxy = scanOnceLayerBrokerProxy();
    const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
    const guildItem = GuildListItemStub({ id: guildId, valid: true });
    const questId = QuestIdStub({ value: 'q-scan-cw' });
    const cwId = QuestWorkItemIdStub({
      value: 'aaa11111-1111-4222-9333-444444444444',
    });
    const quest = QuestStub({
      id: questId,
      status: 'in_progress',
      workItems: [WorkItemStub({ id: cwId, role: 'codeweaver', status: 'pending' })],
    });
    proxy.setupGuildsAndQuests({
      guildItems: [guildItem],
      questsByGuildId: [{ guildId, quests: [quest] }],
    });
    const setActive = jest.fn();
    const activeQuest = ActiveQuestFacadeStub({ setActive });

    const result = await scanOnceLayerBroker({ activeQuest });

    expect(result).toStrictEqual({
      type: 'spawn-agents',
      agents: [
        {
          questId,
          role: 'codeweaver',
          workItemId: cwId,
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${cwId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${cwId}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
        },
      ],
    });
    expect(setActive).toHaveBeenCalledWith({ questId });
  });

  it('VALID: {one in_progress quest with all items complete} => clears active and returns null', async () => {
    const proxy = scanOnceLayerBrokerProxy();
    const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
    const guildItem = GuildListItemStub({ id: guildId, valid: true });
    const quest = QuestStub({
      id: QuestIdStub({ value: 'q-scan-done' }),
      status: 'in_progress',
      workItems: [WorkItemStub({ status: 'complete' })],
    });
    proxy.setupGuildsAndQuests({
      guildItems: [guildItem],
      questsByGuildId: [{ guildId, quests: [quest] }],
    });
    const clear = jest.fn();
    const activeQuest = ActiveQuestFacadeStub({ clear });

    const result = await scanOnceLayerBroker({ activeQuest });

    expect(result).toBe(null);
    expect(clear).toHaveBeenCalledWith();
  });
});

import {
  GuildIdStub,
  GuildListItemStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
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

  it('VALID: {only a paused quest with pending work} => not dispatchable, clears active and returns null', async () => {
    const proxy = scanOnceLayerBrokerProxy();
    const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
    const guildItem = GuildListItemStub({ id: guildId, valid: true });
    const quest = QuestStub({
      id: QuestIdStub({ value: 'q-scan-paused' }),
      status: 'paused',
      workItems: [WorkItemStub({ role: 'codeweaver', status: 'pending' })],
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
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${cwId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${cwId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
        },
      ],
    });
    expect(setActive).toHaveBeenCalledWith({ questId });
  });

  it('VALID: {orphaned in_progress item without sessionId blocking a pending dependent} => resets the orphan and returns a fresh spawn for it', async () => {
    const proxy = scanOnceLayerBrokerProxy();
    const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
    const guildItem = GuildListItemStub({ id: guildId, valid: true });
    const questId = QuestIdStub({ value: 'q-scan-orphan' });
    const orphanId = QuestWorkItemIdStub({
      value: 'aaa11111-1111-4222-9333-444444444444',
    });
    const dependentId = QuestWorkItemIdStub({
      value: 'bbb22222-1111-4222-9333-444444444444',
    });
    const quest = QuestStub({
      id: questId,
      status: 'in_progress',
      workItems: [
        WorkItemStub({ id: orphanId, role: 'pesteater', status: 'in_progress' }),
        WorkItemStub({
          id: dependentId,
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          dependsOn: [orphanId],
        }),
      ],
    });
    proxy.setupGuildsAndQuests({
      guildItems: [guildItem],
      questsByGuildId: [{ guildId, quests: [quest] }],
    });
    proxy.setupModifyForQuest({ quest });
    const setActive = jest.fn();
    const activeQuest = ActiveQuestFacadeStub({ setActive });

    const result = await scanOnceLayerBroker({ activeQuest });

    expect(result).toStrictEqual({
      type: 'spawn-agents',
      agents: [
        {
          questId,
          role: 'pesteater',
          workItemId: orphanId,
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "pesteater",\n  workItemId: "${orphanId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${orphanId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
        },
      ],
    });
    expect(setActive).toHaveBeenCalledWith({ questId });
  });

  it('VALID: {orphaned in_progress item WITH sessionId} => resumed spawn carries resumeSessionId and resumePrompt, taskPrompt stays fresh', async () => {
    const proxy = scanOnceLayerBrokerProxy();
    const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
    const guildItem = GuildListItemStub({ id: guildId, valid: true });
    const questId = QuestIdStub({ value: 'q-scan-resume' });
    const orphanId = QuestWorkItemIdStub({
      value: 'ccc33333-1111-4222-9333-444444444444',
    });
    const sessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });
    const quest = QuestStub({
      id: questId,
      status: 'in_progress',
      workItems: [
        WorkItemStub({ id: orphanId, role: 'codeweaver', status: 'in_progress', sessionId }),
      ],
    });
    proxy.setupGuildsAndQuests({
      guildItems: [guildItem],
      questsByGuildId: [{ guildId, quests: [quest] }],
    });
    proxy.setupModifyForQuest({ quest });
    const setActive = jest.fn();
    const activeQuest = ActiveQuestFacadeStub({ setActive });

    const result = await scanOnceLayerBroker({ activeQuest });

    expect(result).toStrictEqual({
      type: 'spawn-agents',
      agents: [
        {
          questId,
          role: 'codeweaver',
          workItemId: orphanId,
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${orphanId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${orphanId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
          resumeSessionId: sessionId,
          resumePrompt: `Your previous session for this work item was interrupted — you already have its context above. Verify what you completed (git status + recent commits), finish the remaining scope of your operation item, commit a prose handoff, then call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${orphanId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}). If you no longer have context, call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${orphanId}",\n  questId: "${questId}"\n}) and follow its instructions.`,
        },
      ],
    });
    expect(setActive).toHaveBeenCalledWith({ questId });
  });

  it('VALID: {one in_progress quest with all items complete and no operations} => clears active and returns null', async () => {
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

  it('VALID: {all work items terminal, one pending operation item} => advance self-heal creates the next work item and the step dispatches it', async () => {
    const proxy = scanOnceLayerBrokerProxy();
    const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
    const guildItem = GuildListItemStub({ id: guildId, valid: true });
    const questId = QuestIdStub({ value: 'q-scan-self-heal' });
    const doneId = QuestWorkItemIdStub({
      value: 'ddd44444-1111-4222-9333-444444444444',
    });
    const operationId = OperationItemIdStub({ value: 'cccc3333-58cc-4372-a567-0e02b2c3d479' });
    const staleQuest = QuestStub({
      id: questId,
      status: 'in_progress',
      operations: [OperationItemStub({ id: operationId, role: 'codeweaver', status: 'pending' })],
      workItems: [WorkItemStub({ id: doneId, role: 'codeweaver', status: 'complete' })],
    });
    const newId = QuestWorkItemIdStub({
      value: 'eee55555-1111-4222-9333-444444444444',
    });
    const refreshedQuest = QuestStub({
      id: questId,
      status: 'in_progress',
      operations: [
        OperationItemStub({ id: operationId, role: 'codeweaver', status: 'in_progress' }),
      ],
      workItems: [
        WorkItemStub({ id: doneId, role: 'codeweaver', status: 'complete' }),
        WorkItemStub({
          id: newId,
          role: 'codeweaver',
          status: 'pending',
          dependsOn: [doneId],
          relatedDataItems: [`operations/${operationId}` as never],
        }),
      ],
    });
    proxy.setupGuildsAndQuests({
      guildItems: [guildItem],
      questsByGuildId: [{ guildId, quests: [staleQuest] }],
    });
    proxy.setupSelfHeal({ staleQuest, refreshedQuest });
    const setActive = jest.fn();
    const activeQuest = ActiveQuestFacadeStub({ setActive });

    const result = await scanOnceLayerBroker({ activeQuest });

    const persisted = proxy.getLastPersistedQuest();

    expect({
      step: result,
      persistedWorkItems: persisted.workItems.map((item) => ({
        role: item.role,
        status: item.status,
        relatedDataItems: item.relatedDataItems,
      })),
      persistedOperationStatuses: persisted.operations.map((operation) => operation.status),
    }).toStrictEqual({
      step: {
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'codeweaver',
            workItemId: newId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${newId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${newId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
          },
        ],
      },
      persistedWorkItems: [
        { role: 'codeweaver', status: 'complete', relatedDataItems: [] },
        {
          role: 'codeweaver',
          status: 'pending',
          relatedDataItems: [`operations/${operationId}`],
        },
      ],
      persistedOperationStatuses: ['in_progress'],
    });
    expect(setActive).toHaveBeenCalledWith({ questId });
  });
});

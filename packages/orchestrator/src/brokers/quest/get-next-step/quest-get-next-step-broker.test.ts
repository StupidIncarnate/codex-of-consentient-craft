import {
  GuildIdStub,
  GuildListItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { ActiveQuestFacadeStub } from '../../../contracts/active-quest-facade/active-quest-facade.stub';
import { questGetNextStepBroker } from './quest-get-next-step-broker';
import { questGetNextStepBrokerProxy } from './quest-get-next-step-broker.proxy';

describe('questGetNextStepBroker', () => {
  describe('idle paths', () => {
    it('VALID: {no guilds at all, deadline already passed} => returns idle and clears active quest', async () => {
      const proxy = questGetNextStepBrokerProxy();
      proxy.setupNoGuilds();
      const setActive = jest.fn();
      const clear = jest.fn();
      const activeQuest = ActiveQuestFacadeStub({ setActive, clear });

      const result = await questGetNextStepBroker({
        activeQuest,
        longPollTotalMs: 0,
      });

      expect(result).toStrictEqual({ type: 'idle' });
      expect(clear).toHaveBeenCalledWith();
      expect(setActive).toHaveBeenCalledTimes(0);
    });

    it('VALID: {one quest, all work items complete} => returns idle and clears active quest', async () => {
      const proxy = questGetNextStepBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'quest-finished' }),
        status: 'in_progress',
        workItems: [WorkItemStub({ status: 'complete' })],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      const setActive = jest.fn();
      const clear = jest.fn();
      const activeQuest = ActiveQuestFacadeStub({ setActive, clear });

      const result = await questGetNextStepBroker({
        activeQuest,
        longPollTotalMs: 0,
      });

      expect(result).toStrictEqual({ type: 'idle' });
      expect(clear).toHaveBeenCalledWith();
    });

    it('VALID: {pre-execution quest (approved status)} => skipped, returns idle', async () => {
      const proxy = questGetNextStepBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'quest-spec' }),
        status: 'approved',
        workItems: [WorkItemStub({ status: 'pending' })],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      const setActive = jest.fn();
      const clear = jest.fn();
      const activeQuest = ActiveQuestFacadeStub({ setActive, clear });

      const result = await questGetNextStepBroker({
        activeQuest,
        longPollTotalMs: 0,
      });

      expect(result).toStrictEqual({ type: 'idle' });
      expect(clear).toHaveBeenCalledWith();
    });
  });

  describe('single-agent spawn-agents', () => {
    it('VALID: {one in_progress quest with single ready codeweaver} => spawn-agents with one codeweaver instruction', async () => {
      const proxy = questGetNextStepBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'quest-codeweaver' });
      const workItemId = QuestWorkItemIdStub({
        value: 'bbbbbbbb-1111-4222-9333-444444444444',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [WorkItemStub({ id: workItemId, role: 'codeweaver', status: 'pending' })],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      const setActive = jest.fn();
      const activeQuest = ActiveQuestFacadeStub({ setActive });

      const result = await questGetNextStepBroker({
        activeQuest,
        longPollTotalMs: 0,
      });

      expect(result).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'codeweaver',
            workItemId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
          },
        ],
      });
      expect(setActive).toHaveBeenCalledWith({ questId });
    });

    it('VALID: {ready codeweaver + ready lawbringer with no deps} => returns only the first one (single agent rule)', async () => {
      const proxy = questGetNextStepBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'quest-mixed' });
      const cwId = QuestWorkItemIdStub({ value: 'cccccccc-1111-4222-9333-444444444444' });
      const lbId = QuestWorkItemIdStub({ value: 'dddddddd-1111-4222-9333-444444444444' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: cwId, role: 'codeweaver', status: 'pending' }),
          WorkItemStub({ id: lbId, role: 'lawbringer', status: 'pending' }),
        ],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      const activeQuest = ActiveQuestFacadeStub();

      const result = await questGetNextStepBroker({
        activeQuest,
        longPollTotalMs: 0,
      });

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
    });

    it('VALID: {ready pathseeker} => single spawn-agents (current pathseeker role is not in the special batch list)', async () => {
      const proxy = questGetNextStepBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'quest-ps' });
      const psAId = QuestWorkItemIdStub({ value: 'eeeeeeee-1111-4222-9333-444444444444' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [WorkItemStub({ id: psAId, role: 'pathseeker', status: 'pending' })],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      const activeQuest = ActiveQuestFacadeStub();

      const result = await questGetNextStepBroker({
        activeQuest,
        longPollTotalMs: 0,
      });

      expect(result).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'pathseeker',
            workItemId: psAId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "pathseeker",\n  workItemId: "${psAId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${psAId}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
          },
        ],
      });
    });
  });

  describe('run-ward path', () => {
    it('VALID: {ready ward work item with mode: full} => run-ward with mode: full', async () => {
      const proxy = questGetNextStepBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'quest-ward' });
      const wardId = QuestWorkItemIdStub({
        value: '99999999-1111-4222-9333-444444444444',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: wardId,
            role: 'ward',
            status: 'pending',
            spawnerType: 'command',
            wardMode: 'full',
          }),
        ],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      const setActive = jest.fn();
      const activeQuest = ActiveQuestFacadeStub({ setActive });

      const result = await questGetNextStepBroker({
        activeQuest,
        longPollTotalMs: 0,
      });

      expect(result).toStrictEqual({
        type: 'run-ward',
        questId,
        workItemId: wardId,
        mode: 'full',
      });
      expect(setActive).toHaveBeenCalledWith({ questId });
    });

    it('VALID: {ready ward work item with no wardMode set} => defaults to changed', async () => {
      const proxy = questGetNextStepBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'quest-ward-default' });
      const wardId = QuestWorkItemIdStub({
        value: '88888888-1111-4222-9333-444444444444',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: wardId,
            role: 'ward',
            status: 'pending',
            spawnerType: 'command',
          }),
        ],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      const activeQuest = ActiveQuestFacadeStub();

      const result = await questGetNextStepBroker({
        activeQuest,
        longPollTotalMs: 0,
      });

      expect(result).toStrictEqual({
        type: 'run-ward',
        questId,
        workItemId: wardId,
        mode: 'changed',
      });
    });
  });

  describe('FIFO ordering across multiple quests', () => {
    it('VALID: {two in_progress quests, older has incomplete work} => returns work from older quest', async () => {
      const proxy = questGetNextStepBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const olderQuestId = QuestIdStub({ value: 'quest-older' });
      const newerQuestId = QuestIdStub({ value: 'quest-newer' });
      const olderWorkItemId = QuestWorkItemIdStub({
        value: 'aaa11111-1111-4222-9333-444444444444',
      });
      const newerWorkItemId = QuestWorkItemIdStub({
        value: 'bbb22222-1111-4222-9333-444444444444',
      });
      const olderQuest = QuestStub({
        id: olderQuestId,
        status: 'in_progress',
        createdAt: '2024-01-01T00:00:00.000Z' as never,
        workItems: [
          WorkItemStub({
            id: olderWorkItemId,
            role: 'codeweaver',
            status: 'pending',
          }),
        ],
      });
      const newerQuest = QuestStub({
        id: newerQuestId,
        status: 'in_progress',
        createdAt: '2024-06-01T00:00:00.000Z' as never,
        workItems: [
          WorkItemStub({
            id: newerWorkItemId,
            role: 'codeweaver',
            status: 'pending',
          }),
        ],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [newerQuest, olderQuest] }],
      });
      const setActive = jest.fn();
      const activeQuest = ActiveQuestFacadeStub({ setActive });

      const result = await questGetNextStepBroker({
        activeQuest,
        longPollTotalMs: 0,
      });

      expect(result).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId: olderQuestId,
            role: 'codeweaver',
            workItemId: olderWorkItemId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${olderWorkItemId}",\n  questId: "${olderQuestId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${olderQuestId}",\n  workItemId: "${olderWorkItemId}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
          },
        ],
      });
      expect(setActive).toHaveBeenCalledWith({ questId: olderQuestId });
    });

    it('VALID: {two in_progress quests, older is fully complete} => returns work from newer quest', async () => {
      const proxy = questGetNextStepBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const olderQuestId = QuestIdStub({ value: 'quest-older-done' });
      const newerQuestId = QuestIdStub({ value: 'quest-newer-running' });
      const newerWorkItemId = QuestWorkItemIdStub({
        value: 'ccc33333-1111-4222-9333-444444444444',
      });
      const olderQuest = QuestStub({
        id: olderQuestId,
        status: 'in_progress',
        createdAt: '2024-01-01T00:00:00.000Z' as never,
        workItems: [WorkItemStub({ status: 'complete' })],
      });
      const newerQuest = QuestStub({
        id: newerQuestId,
        status: 'in_progress',
        createdAt: '2024-06-01T00:00:00.000Z' as never,
        workItems: [
          WorkItemStub({
            id: newerWorkItemId,
            role: 'codeweaver',
            status: 'pending',
          }),
        ],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [olderQuest, newerQuest] }],
      });
      const setActive = jest.fn();
      const activeQuest = ActiveQuestFacadeStub({ setActive });

      const result = await questGetNextStepBroker({
        activeQuest,
        longPollTotalMs: 0,
      });

      expect(result).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId: newerQuestId,
            role: 'codeweaver',
            workItemId: newerWorkItemId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${newerWorkItemId}",\n  questId: "${newerQuestId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${newerQuestId}",\n  workItemId: "${newerWorkItemId}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
          },
        ],
      });
      expect(setActive).toHaveBeenCalledWith({ questId: newerQuestId });
    });
  });

  describe('dependency gating', () => {
    it('VALID: {ready item with unsatisfied dep} => skipped, returns idle but keeps quest active', async () => {
      const proxy = questGetNextStepBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'quest-blocked-by-dep' });
      const blockingId = QuestWorkItemIdStub({
        value: 'aaa44444-1111-4222-9333-444444444444',
      });
      const blockedId = QuestWorkItemIdStub({
        value: 'bbb55555-1111-4222-9333-444444444444',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: blockingId, role: 'codeweaver', status: 'in_progress' }),
          WorkItemStub({
            id: blockedId,
            role: 'lawbringer',
            status: 'pending',
            dependsOn: [blockingId],
          }),
        ],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      const setActive = jest.fn();
      const activeQuest = ActiveQuestFacadeStub({ setActive });

      const result = await questGetNextStepBroker({
        activeQuest,
        longPollTotalMs: 0,
      });

      expect(result).toStrictEqual({ type: 'idle' });
      expect(setActive).toHaveBeenCalledWith({ questId });
    });

    it('VALID: {ready item with satisfied dep (complete)} => returns the dependent in spawn-agents', async () => {
      const proxy = questGetNextStepBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'quest-chain' });
      const doneId = QuestWorkItemIdStub({
        value: 'aaa66666-1111-4222-9333-444444444444',
      });
      const readyId = QuestWorkItemIdStub({
        value: 'bbb77777-1111-4222-9333-444444444444',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: doneId, role: 'codeweaver', status: 'complete' }),
          WorkItemStub({
            id: readyId,
            role: 'lawbringer',
            status: 'pending',
            dependsOn: [doneId],
          }),
        ],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      const activeQuest = ActiveQuestFacadeStub();

      const result = await questGetNextStepBroker({
        activeQuest,
        longPollTotalMs: 0,
      });

      expect(result).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'lawbringer',
            workItemId: readyId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "lawbringer",\n  workItemId: "${readyId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${readyId}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
          },
        ],
      });
    });
  });

  describe('long-poll', () => {
    it('VALID: {scan returns nothing, then quest appears} => returns the quest on the retry', async () => {
      const proxy = questGetNextStepBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'quest-late' });
      const workItemId = QuestWorkItemIdStub({
        value: 'aaa55556-1111-4222-9333-444444444444',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [WorkItemStub({ id: workItemId, role: 'codeweaver', status: 'pending' })],
      });
      // First scan: no guilds — broker will sleep + retry.
      proxy.setupNoGuilds();
      // Second scan: the late quest appears.
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      const activeQuest = ActiveQuestFacadeStub();

      const result = await questGetNextStepBroker({
        activeQuest,
        longPollTotalMs: 5_000,
        longPollIntervalMs: 10,
      });

      expect(result).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'codeweaver',
            workItemId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
          },
        ],
      });
      expect(proxy.getRegisteredTimeoutMs()).toBe(10);
    });
  });
});

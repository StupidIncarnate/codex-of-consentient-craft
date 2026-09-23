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
            model: 'opus',
            workItemId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
          },
        ],
      });
      expect(setActive).toHaveBeenCalledWith({ questId });
    });

    // The batch is selected on the HEAD item's role AND step, so the selector's mixed-role throw is
    // not reachable from ordinary traffic: the spiritmender item waits for a scan of its own.
    it('VALID: {ready codeweaver + ready spiritmender with no deps} => dispatches the head role ALONE', async () => {
      const proxy = questGetNextStepBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'quest-mixed' });
      const cwId = QuestWorkItemIdStub({ value: 'cccccccc-1111-4222-9333-444444444444' });
      const bwId = QuestWorkItemIdStub({ value: 'dddddddd-1111-4222-9333-444444444444' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: cwId, role: 'codeweaver', status: 'pending' }),
          WorkItemStub({ id: bwId, role: 'spiritmender', status: 'pending' }),
        ],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      const activeQuest = ActiveQuestFacadeStub();

      const result = await questGetNextStepBroker({ activeQuest, longPollTotalMs: 0 });

      expect(result).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'codeweaver',
            model: 'opus',
            workItemId: cwId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${cwId}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cwId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cwId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${cwId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
          },
        ],
      });
    });

    it('VALID: {ready spiritmender} => single spawn-agents', async () => {
      const proxy = questGetNextStepBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'quest-bw' });
      const bwId = QuestWorkItemIdStub({ value: 'eeeeeeee-1111-4222-9333-444444444444' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [WorkItemStub({ id: bwId, role: 'spiritmender', status: 'pending' })],
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
            role: 'spiritmender',
            model: 'sonnet',
            workItemId: bwId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "spiritmender",\n  workItemId: "${bwId}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${bwId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${bwId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${bwId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
          },
        ],
      });
    });
  });

  describe('run-ward path', () => {
    it('VALID: {ready ward work item} => run-ward naming only questId and workItemId', async () => {
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
      });
      expect(setActive).toHaveBeenCalledWith({ questId });
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
            model: 'opus',
            workItemId: olderWorkItemId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${olderWorkItemId}",\n  questId: "${olderQuestId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${olderQuestId}",\n  workItemId: "${olderWorkItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${olderQuestId}",\n  workItemId: "${olderWorkItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${olderQuestId}",\n  workItemId: "${olderWorkItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
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
            model: 'opus',
            workItemId: newerWorkItemId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${newerWorkItemId}",\n  questId: "${newerQuestId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${newerQuestId}",\n  workItemId: "${newerWorkItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${newerQuestId}",\n  workItemId: "${newerWorkItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${newerQuestId}",\n  workItemId: "${newerWorkItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
          },
        ],
      });
      expect(setActive).toHaveBeenCalledWith({ questId: newerQuestId });
    });
  });

  describe('dependency gating', () => {
    it('VALID: {orphaned in_progress item blocking a pending dependent} => resets the orphan and re-dispatches it, leaving the dependent gated', async () => {
      const proxy = questGetNextStepBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'quest-blocked-by-dep' });
      const orphanId = QuestWorkItemIdStub({
        value: 'aaa44444-1111-4222-9333-444444444444',
      });
      const blockedId = QuestWorkItemIdStub({
        value: 'bbb55555-1111-4222-9333-444444444444',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: orphanId, role: 'codeweaver', status: 'in_progress' }),
          WorkItemStub({
            id: blockedId,
            role: 'spiritmender',
            status: 'pending',
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
            model: 'opus',
            workItemId: orphanId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${orphanId}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${orphanId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${orphanId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${orphanId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
          },
        ],
      });
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
            role: 'spiritmender',
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
            role: 'spiritmender',
            model: 'sonnet',
            workItemId: readyId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "spiritmender",\n  workItemId: "${readyId}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${readyId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${readyId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${readyId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
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
            model: 'opus',
            workItemId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
          },
        ],
      });
      expect(proxy.getRegisteredTimeoutMs()).toBe(10);
    });

    // The scan MUTATES: orphan recovery flips an in_progress work item back to pending, and the
    // advance self-heal mints the next ledger scope's work item. A poll that keeps scanning after
    // the dispatcher was paused writes to quests the user just stopped it for.
    it('VALID: {shouldKeepPolling flips false during the wait} => stops scanning and returns idle even though a quest appeared', async () => {
      const proxy = questGetNextStepBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'quest-after-pause' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [WorkItemStub({ role: 'codeweaver', status: 'pending' })],
      });
      // First scan: no guilds — the broker sleeps and would retry.
      proxy.setupNoGuilds();
      // What the retry WOULD have found, had the poll been allowed to keep going.
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      const setActive = jest.fn();
      const activeQuest = ActiveQuestFacadeStub({ setActive });

      const result = await questGetNextStepBroker({
        activeQuest,
        longPollTotalMs: 5_000,
        longPollIntervalMs: 10,
        shouldKeepPolling: (): boolean => false,
      });

      expect(result).toStrictEqual({ type: 'idle' });
      expect(setActive).toHaveBeenCalledTimes(0);
    });
  });
});

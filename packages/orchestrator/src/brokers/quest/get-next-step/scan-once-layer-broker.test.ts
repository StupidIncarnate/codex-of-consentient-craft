import {
  AbsoluteFilePathStub,
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
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
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

  it('VALID: {orphan at the reset budget with a pending operation item behind it} => blocks and returns null WITHOUT advancing the ledger or dispatching', async () => {
    const proxy = scanOnceLayerBrokerProxy();
    const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
    const guildItem = GuildListItemStub({ id: guildId, valid: true });
    const questId = QuestIdStub({ value: 'q-scan-orphan-exhausted' });
    const orphanId = QuestWorkItemIdStub({ value: 'ccc33333-1111-4222-9333-444444444444' });
    const doneOperationId = OperationItemIdStub({ value: '11111111-1111-4222-9333-444444444444' });
    const nextOperationId = OperationItemIdStub({ value: '22222222-1111-4222-9333-444444444444' });
    const quest = QuestStub({
      id: questId,
      status: 'in_progress',
      operations: [
        OperationItemStub({ id: doneOperationId, role: 'codeweaver', status: 'in_progress' }),
        // The next scope on the ledger. Before the block short-circuit, advance would mint a work
        // item for it and this scan would dispatch an agent against an already-halted quest.
        OperationItemStub({ id: nextOperationId, role: 'blightwarden', status: 'pending' }),
      ],
      workItems: [
        WorkItemStub({
          id: orphanId,
          role: 'codeweaver',
          status: 'in_progress',
          retryCount: slotManagerStatics.orphanRecovery.maxResets,
          relatedDataItems: [`operations/${doneOperationId}`],
        }),
      ],
    });
    proxy.setupGuildsAndQuests({
      guildItems: [guildItem],
      questsByGuildId: [{ guildId, quests: [quest] }],
    });
    proxy.setupModifyForQuest({ quest });
    const clear = jest.fn();
    const setActive = jest.fn();
    const activeQuest = ActiveQuestFacadeStub({ clear, setActive });

    const result = await scanOnceLayerBroker({ activeQuest });

    expect(result).toBe(null);
    expect(proxy.getBlockCalls()).toStrictEqual([{ questId, failedWorkItemId: orphanId }]);
    expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    expect(clear).toHaveBeenCalledWith();
    expect(setActive).toHaveBeenCalledTimes(0);
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
          resumePrompt: `You were CUT OFF mid-work on this item — your session was killed, not paused cleanly. The context above therefore stops abruptly and your LAST ACTION MAY NEVER HAVE COMPLETED: an edit may not have been written, a command may have died mid-run, a commit may not exist. Do not treat your own context as a record of what landed.\n\nRE-ESTABLISH THE CURRENT STATE FIRST, before doing any new work:\n1. Run \`git status\` and \`git log --oneline -5\` — what is actually committed, and what is still uncommitted?\n2. Re-read the files you believe you edited, and confirm the change is really on disk.\n3. Re-run whatever you were in the middle of verifying (a test, a ward run, a browser step) instead of trusting the remembered result.\n\nOnly once you know the real state: finish the remaining scope of your operation item, commit a prose handoff, then call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${orphanId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).\n\nIf you have no usable context above, call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${orphanId}",\n  questId: "${questId}"\n}) and follow its instructions from the top.`,
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

  it('VALID: {quest whose recorded worktree is missing} => returns null, blocks the quest naming the path, and dispatches nothing', async () => {
    const proxy = scanOnceLayerBrokerProxy();
    const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
    const guildItem = GuildListItemStub({ id: guildId, valid: true });
    const questId = QuestIdStub({ value: 'q-scan-missing-worktree' });
    const pendingId = QuestWorkItemIdStub({ value: 'ddd66666-1111-4222-9333-444444444444' });
    const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-missing' });
    const quest = QuestStub({
      id: questId,
      status: 'in_progress',
      worktreePath,
      workItems: [WorkItemStub({ id: pendingId, role: 'codeweaver', status: 'pending' })],
    });
    proxy.setupGuildsAndQuests({
      guildItems: [guildItem],
      questsByGuildId: [{ guildId, quests: [quest] }],
    });
    proxy.setupWorktreeMissing({ quest, worktreePath });
    const clear = jest.fn();
    const setActive = jest.fn();
    const activeQuest = ActiveQuestFacadeStub({ clear, setActive });

    const result = await scanOnceLayerBroker({ activeQuest });

    expect({
      result,
      blockCalls: proxy.getBlockCalls(),
      clearCallCount: clear.mock.calls.length,
      setActiveCallCount: setActive.mock.calls.length,
    }).toStrictEqual({
      result: null,
      blockCalls: [
        {
          questId,
          failedWorkItemId: pendingId,
          reason: `Worktree not found: ${worktreePath}`,
        },
      ],
      clearCallCount: 1,
      setActiveCallCount: 0,
    });
  });

  it('VALID: {quest with no recorded worktreePath (legacy)} => the scan proceeds and returns its normal step', async () => {
    const proxy = scanOnceLayerBrokerProxy();
    const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
    const guildItem = GuildListItemStub({ id: guildId, valid: true });
    const questId = QuestIdStub({ value: 'q-scan-legacy' });
    const cwId = QuestWorkItemIdStub({
      value: 'eee77777-1111-4222-9333-444444444444',
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

    expect({ result, setActiveCalls: setActive.mock.calls }).toStrictEqual({
      result: {
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'codeweaver',
            workItemId: cwId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${cwId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${cwId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
          },
        ],
      },
      setActiveCalls: [[{ questId }]],
    });
  });
});

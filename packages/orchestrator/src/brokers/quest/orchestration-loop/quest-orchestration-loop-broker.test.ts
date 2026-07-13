import {
  FilePathStub,
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { nextReadyWorkItemsTransformer } from '../../../transformers/next-ready-work-items/next-ready-work-items-transformer';
import { orchestrationLoopSummaryTransformer } from '../../../transformers/orchestration-loop-summary/orchestration-loop-summary-transformer';
import { questOrchestrationLoopBroker } from './quest-orchestration-loop-broker';
import { questOrchestrationLoopBrokerProxy } from './quest-orchestration-loop-broker.proxy';

// The orchestration loop dispatches only chat roles (chaoswhisperer / glyphsmith); every
// execution role is dispatched through `quest-get-next-step-broker`. The coverage below
// exercises the state-mutation behaviour the loop owns: terminal/blocked transitions and
// the abort / no-ready / execution-role-defer short-circuits.

describe('questOrchestrationLoopBroker', () => {
  describe('terminal states', () => {
    it('VALID: {all work items complete} => quest status set to complete', async () => {
      const proxy = questOrchestrationLoopBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
            role: 'chaoswhisperer',
            status: 'complete',
          }),
        ],
      });
      proxy.setupQuestTerminal({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-1' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toStrictEqual({ success: true });

      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.status).toBe('complete');
    });
  });

  describe('aborted', () => {
    it('VALID: {abortSignal already aborted} => returns success immediately, no quest reads', async () => {
      questOrchestrationLoopBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const controller = new AbortController();
      controller.abort();

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-1' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
          onAgentEntry: jest.fn(),
          abortSignal: controller.signal,
        }),
      ).resolves.toStrictEqual({ success: true });
    });
  });

  describe('execution-role work items', () => {
    it('VALID: {ready codeweaver items} => left pending, loop persists nothing', async () => {
      const proxy = questOrchestrationLoopBrokerProxy();
      const questId = QuestIdStub({ value: 'add-guild' });
      const chatId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const cwOneId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const cwTwoId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: chatId, role: 'chaoswhisperer', status: 'complete' }),
          WorkItemStub({
            id: cwOneId,
            role: 'codeweaver',
            status: 'pending',
            dependsOn: [chatId],
          }),
          WorkItemStub({
            id: cwTwoId,
            role: 'codeweaver',
            status: 'pending',
            dependsOn: [chatId],
          }),
        ],
      });
      proxy.setupQuestReady({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-1' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toStrictEqual({ success: true });

      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {quest missing} => throws not-found error', async () => {
      const proxy = questOrchestrationLoopBrokerProxy();
      const questId = QuestIdStub({ value: 'missing-quest' });
      proxy.setupQuestNotFound();

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-1' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });

  describe('orchestration-loop logging', () => {
    it('VALID: {all items terminal} => writes snapshot then terminal decision', async () => {
      const proxy = questOrchestrationLoopBrokerProxy();
      const questId = QuestIdStub({ value: 'log-terminal' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
            role: 'chaoswhisperer',
            status: 'complete',
          }),
        ],
      });
      proxy.setupQuestTerminal({ quest });

      await questOrchestrationLoopBroker({
        processId: ProcessIdStub({ value: 'proc-test-1' }),
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const chatRoles = [
        WorkItemStub({ role: 'chaoswhisperer' }).role,
        WorkItemStub({ role: 'glyphsmith' }).role,
      ];
      const { ready } = nextReadyWorkItemsTransformer({ workItems: quest.workItems });
      const expectedSnapshot = orchestrationLoopSummaryTransformer({
        questId,
        questStatus: quest.status,
        workItems: quest.workItems,
        ready,
        chatRoles,
      });
      const loopWrites = proxy
        .getStderrWrites()
        .filter((write) => String(write).startsWith('[orchestration-loop]'));

      expect(loopWrites).toStrictEqual([
        `${expectedSnapshot}\n`,
        '[orchestration-loop] quest=log-terminal decision: all work items terminal -> quest status complete\n',
      ]);
    });

    it('VALID: {ready execution-role items} => writes snapshot then exec-defer decision', async () => {
      const proxy = questOrchestrationLoopBrokerProxy();
      const questId = QuestIdStub({ value: 'log-exec' });
      const chatId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const cwOneId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const cwTwoId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: chatId, role: 'chaoswhisperer', status: 'complete' }),
          WorkItemStub({
            id: cwOneId,
            role: 'codeweaver',
            status: 'pending',
            dependsOn: [chatId],
          }),
          WorkItemStub({
            id: cwTwoId,
            role: 'codeweaver',
            status: 'pending',
            dependsOn: [chatId],
          }),
        ],
      });
      proxy.setupQuestReady({ quest });

      await questOrchestrationLoopBroker({
        processId: ProcessIdStub({ value: 'proc-test-1' }),
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const chatRoles = [
        WorkItemStub({ role: 'chaoswhisperer' }).role,
        WorkItemStub({ role: 'glyphsmith' }).role,
      ];
      const { ready } = nextReadyWorkItemsTransformer({ workItems: quest.workItems });
      const expectedSnapshot = orchestrationLoopSummaryTransformer({
        questId,
        questStatus: quest.status,
        workItems: quest.workItems,
        ready,
        chatRoles,
      });
      const loopWrites = proxy
        .getStderrWrites()
        .filter((write) => String(write).startsWith('[orchestration-loop]'));

      expect(loopWrites).toStrictEqual([
        `${expectedSnapshot}\n`,
        '[orchestration-loop] quest=log-exec decision: 2 ready, 0 chat-role -> execution roles dispatch via the dispatch loop; chat loop idle\n',
      ]);
    });

    it('VALID: {no ready items, one in flight} => writes snapshot then waiting decision', async () => {
      const proxy = questOrchestrationLoopBrokerProxy();
      const questId = QuestIdStub({ value: 'log-noready' });
      const chatId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const cwId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: chatId, role: 'chaoswhisperer', status: 'complete' }),
          WorkItemStub({
            id: cwId,
            role: 'codeweaver',
            status: 'in_progress',
            dependsOn: [chatId],
          }),
        ],
      });
      proxy.setupNoReadyItems({ quest });

      await questOrchestrationLoopBroker({
        processId: ProcessIdStub({ value: 'proc-test-1' }),
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const chatRoles = [
        WorkItemStub({ role: 'chaoswhisperer' }).role,
        WorkItemStub({ role: 'glyphsmith' }).role,
      ];
      const { ready } = nextReadyWorkItemsTransformer({ workItems: quest.workItems });
      const expectedSnapshot = orchestrationLoopSummaryTransformer({
        questId,
        questStatus: quest.status,
        workItems: quest.workItems,
        ready,
        chatRoles,
      });
      const loopWrites = proxy
        .getStderrWrites()
        .filter((write) => String(write).startsWith('[orchestration-loop]'));

      expect(loopWrites).toStrictEqual([
        `${expectedSnapshot}\n`,
        '[orchestration-loop] quest=log-noready decision: 0 ready, 1 in flight -> waiting for active agents\n',
      ]);
    });

    it('VALID: {pending item blocked on skipped dep} => writes snapshot then blocking decision', async () => {
      const proxy = questOrchestrationLoopBrokerProxy();
      const questId = QuestIdStub({ value: 'log-blocked' });
      const skippedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const pendingId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: skippedId, role: 'codeweaver', status: 'skipped' }),
          WorkItemStub({
            id: pendingId,
            role: 'ward',
            status: 'pending',
            dependsOn: [skippedId],
          }),
        ],
      });
      proxy.setupQuestBlocked({ quest });

      await questOrchestrationLoopBroker({
        processId: ProcessIdStub({ value: 'proc-test-1' }),
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const chatRoles = [
        WorkItemStub({ role: 'chaoswhisperer' }).role,
        WorkItemStub({ role: 'glyphsmith' }).role,
      ];
      const { ready } = nextReadyWorkItemsTransformer({ workItems: quest.workItems });
      const expectedSnapshot = orchestrationLoopSummaryTransformer({
        questId,
        questStatus: quest.status,
        workItems: quest.workItems,
        ready,
        chatRoles,
      });
      const loopWrites = proxy
        .getStderrWrites()
        .filter((write) => String(write).startsWith('[orchestration-loop]'));

      expect(loopWrites).toStrictEqual([
        `${expectedSnapshot}\n`,
        '[orchestration-loop] quest=log-blocked decision: no ready items and none in flight -> blocking quest\n',
      ]);
    });
  });
});

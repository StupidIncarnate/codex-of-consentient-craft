import {
  FilePathStub,
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questOrchestrationLoopBroker } from './quest-orchestration-loop-broker';
import { questOrchestrationLoopBrokerProxy } from './quest-orchestration-loop-broker.proxy';

// Step 16 (piped-dancing-boole): the orchestration loop no longer spawns any layer
// brokers — dispatch lives in `quest-get-next-step-broker` under the `/dumpster-launch`
// model. The minimal coverage below exercises the surviving state-mutation behaviour
// (terminal/blocked transitions, abort/no-ready short-circuits). The previous 8000+ line
// dispatch-shape test suite is sidelined to `tmp/step16-sideline/orchestration-loop/`.

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
    it('VALID: {ready pathseeker-surface items} => left pending, loop persists nothing', async () => {
      const proxy = questOrchestrationLoopBrokerProxy();
      const questId = QuestIdStub({ value: 'add-guild' });
      const chatId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const surfaceOneId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const surfaceTwoId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: chatId, role: 'chaoswhisperer', status: 'complete' }),
          WorkItemStub({
            id: surfaceOneId,
            role: 'pathseeker-surface',
            status: 'pending',
            dependsOn: [chatId],
          }),
          WorkItemStub({
            id: surfaceTwoId,
            role: 'pathseeker-surface',
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
});

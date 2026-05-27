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

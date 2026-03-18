import {
  FilePathStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  UserInputStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { runChatLayerBroker } from './run-chat-layer-broker';
import { runChatLayerBrokerProxy } from './run-chat-layer-broker.proxy';

describe('runChatLayerBroker', () => {
  describe('basic spawn', () => {
    it('VALID: {chaoswhisperer work item} => spawns agent and completes work item', async () => {
      const proxy = runChatLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'chaoswhisperer',
        status: 'in_progress',
      });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', workItems: [workItem] });
      proxy.setupQuestFound({ quest });

      await expect(
        runChatLayerBroker({
          questId,
          workItem,
          startPath: FilePathStub({ value: '/project/src' }),
          userMessage: UserInputStub({ value: 'Help me build auth' }),
        }),
      ).resolves.toBeUndefined();
    });

    it('VALID: {glyphsmith work item} => spawns agent and completes work item', async () => {
      const proxy = runChatLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'glyphsmith',
        status: 'in_progress',
      });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', workItems: [workItem] });
      proxy.setupQuestFound({ quest });

      await expect(
        runChatLayerBroker({
          questId,
          workItem,
          startPath: FilePathStub({ value: '/project/src' }),
          userMessage: UserInputStub({ value: 'Design the login page' }),
        }),
      ).resolves.toBeUndefined();
    });

    it('VALID: {work item with existing sessionId} => passes resumeSessionId to spawn and sends raw message', async () => {
      const proxy = runChatLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const existingSessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'chaoswhisperer',
        status: 'in_progress',
        sessionId: existingSessionId,
      });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', workItems: [workItem] });
      proxy.setupQuestFound({ quest });

      const userMessage = UserInputStub({ value: 'Continue building auth' });

      await runChatLayerBroker({
        questId,
        workItem,
        startPath: FilePathStub({ value: '/project/src' }),
        userMessage,
      });

      const spawnedArgs = proxy.getSpawnedArgs();

      // resumeSessionId forwarded to spawn via --resume flag; raw message sent (no template)
      expect(spawnedArgs).toStrictEqual([
        '-p',
        String(userMessage),
        '--output-format',
        'stream-json',
        '--verbose',
        '--resume',
        existingSessionId,
      ]);
    });
  });
});

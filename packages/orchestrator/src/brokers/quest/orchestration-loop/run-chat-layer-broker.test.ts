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

const SESSION_ID_VALUE = '9c4d8f1c-3e38-48c9-bdec-22b61883b473';
const SESSION_ID_LINE = JSON.stringify({ type: 'system', session_id: SESSION_ID_VALUE });

describe('runChatLayerBroker', () => {
  describe('chaoswhisperer success with sessionId', () => {
    it('VALID: {spawn emits session_id line} => writes sessionId to work item and marks complete', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'chaoswhisperer',
        status: 'in_progress',
      });
      const quest = QuestStub({
        id: questId,
        folder: '001-add-auth',
        workItems: [workItem],
      });

      const proxy = runChatLayerBrokerProxy();
      proxy.setupSpawnSuccessWithSessionId({ quest, lines: [SESSION_ID_LINE] });

      await runChatLayerBroker({
        questId,
        workItem,
        startPath: FilePathStub({ value: '/project/src' }),
        userMessage: UserInputStub({ value: 'Help me build auth' }),
      });

      const persisted = proxy.getModifyContents();

      // First persist: sessionId written to work item
      expect(persisted).toHaveLength(2);

      const firstQuest = persisted[0] as ReturnType<typeof QuestStub>;
      const sessionItem = firstQuest.workItems.find((w) => w.id === workItemId);

      expect(sessionItem?.sessionId).toBe(SESSION_ID_VALUE);

      // Second persist: status complete
      const lastQuest = persisted[1] as ReturnType<typeof QuestStub>;
      const completedItem = lastQuest.workItems.find((w) => w.id === workItemId);

      expect(completedItem?.status).toBe('complete');
      expect(completedItem?.completedAt).toBeDefined();
    });
  });

  describe('chaoswhisperer success without sessionId', () => {
    it('VALID: {spawn emits no session_id} => marks complete without sessionId write', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'chaoswhisperer',
        status: 'in_progress',
      });
      const quest = QuestStub({
        id: questId,
        folder: '001-add-auth',
        workItems: [workItem],
      });

      const proxy = runChatLayerBrokerProxy();
      proxy.setupSpawnSuccess({ quest, lines: [] });

      await runChatLayerBroker({
        questId,
        workItem,
        startPath: FilePathStub({ value: '/project/src' }),
        userMessage: UserInputStub({ value: 'Help me build auth' }),
      });

      const persisted = proxy.getModifyContents();

      // Should only have one persist (complete), no sessionId write
      expect(persisted).toHaveLength(1);

      const lastQuest = persisted[0] as ReturnType<typeof QuestStub>;
      const completedItem = lastQuest.workItems.find((w) => w.id === workItemId);

      expect(completedItem?.status).toBe('complete');
      expect(completedItem?.completedAt).toBeDefined();
    });
  });

  describe('chaoswhisperer with existing sessionId (resume)', () => {
    it('VALID: {workItem has sessionId} => passes resumeSessionId and sends raw message', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const existingSessionId = SessionIdStub({ value: SESSION_ID_VALUE });
      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'chaoswhisperer',
        status: 'in_progress',
        sessionId: existingSessionId,
      });
      const quest = QuestStub({
        id: questId,
        folder: '001-add-auth',
        workItems: [workItem],
      });

      const proxy = runChatLayerBrokerProxy();
      proxy.setupSpawnSuccessWithSessionId({
        quest,
        lines: [SESSION_ID_LINE],
      });

      await runChatLayerBroker({
        questId,
        workItem,
        startPath: FilePathStub({ value: '/project/src' }),
        userMessage: UserInputStub({ value: 'Continue from where we left off' }),
      });

      const persisted = proxy.getModifyContents();
      const lastQuest = persisted[persisted.length - 1] as ReturnType<typeof QuestStub>;
      const completedItem = lastQuest.workItems.find((w) => w.id === workItemId);

      expect(completedItem?.status).toBe('complete');
    });
  });

  describe('glyphsmith success', () => {
    it('VALID: {glyphsmith work item, spawn emits session_id} => marks complete with sessionId', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'glyphsmith',
        status: 'in_progress',
      });
      const quest = QuestStub({
        id: questId,
        folder: '001-add-auth',
        workItems: [workItem],
      });

      const proxy = runChatLayerBrokerProxy();
      proxy.setupSpawnSuccessWithSessionId({ quest, lines: [SESSION_ID_LINE] });

      await runChatLayerBroker({
        questId,
        workItem,
        startPath: FilePathStub({ value: '/project/src' }),
        userMessage: UserInputStub({ value: 'Design the login page' }),
      });

      const persisted = proxy.getModifyContents();

      // First persist: sessionId written
      expect(persisted).toHaveLength(2);

      const firstQuest = persisted[0] as ReturnType<typeof QuestStub>;
      const sessionItem = firstQuest.workItems.find((w) => w.id === workItemId);

      expect(sessionItem?.sessionId).toBe(SESSION_ID_VALUE);

      // Second persist: complete
      const lastQuest = persisted[1] as ReturnType<typeof QuestStub>;
      const completedItem = lastQuest.workItems.find((w) => w.id === workItemId);

      expect(completedItem?.status).toBe('complete');
      expect(completedItem?.completedAt).toBeDefined();
    });
  });

  describe('spawn failure', () => {
    it('ERROR: {spawn throws} => marks work item failed and re-throws', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'chaoswhisperer',
        status: 'in_progress',
      });
      const quest = QuestStub({
        id: questId,
        folder: '001-add-auth',
        workItems: [workItem],
      });

      const proxy = runChatLayerBrokerProxy();
      proxy.setupSpawnFailure({ quest, error: new Error('Spawn failed') });

      await expect(
        runChatLayerBroker({
          questId,
          workItem,
          startPath: FilePathStub({ value: '/project/src' }),
          userMessage: UserInputStub({ value: 'Help me' }),
        }),
      ).rejects.toThrow(/Spawn failed/u);

      const persisted = proxy.getModifyContents();
      const lastQuest = persisted[persisted.length - 1] as ReturnType<typeof QuestStub>;
      const failedItem = lastQuest.workItems.find((w) => w.id === workItemId);

      expect(failedItem?.status).toBe('failed');
      expect(failedItem?.errorMessage).toBe('Spawn failed');
    });
  });

  describe('non-zero exit code (X1 fix)', () => {
    it('ERROR: {spawn exits with code 1} => marks work item failed with error message', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'chaoswhisperer',
        status: 'in_progress',
      });
      const quest = QuestStub({
        id: questId,
        folder: '001-add-auth',
        workItems: [workItem],
      });

      const proxy = runChatLayerBrokerProxy();
      proxy.setupSpawnWithExitCode({ quest, lines: [], exitCode: 1 });

      await expect(
        runChatLayerBroker({
          questId,
          workItem,
          startPath: FilePathStub({ value: '/project/src' }),
          userMessage: UserInputStub({ value: 'Help me' }),
        }),
      ).rejects.toThrow(/Chat agent exited with code 1/u);

      const persisted = proxy.getModifyContents();
      const lastQuest = persisted[persisted.length - 1] as ReturnType<typeof QuestStub>;
      const failedItem = lastQuest.workItems.find((w) => w.id === workItemId);

      expect(failedItem?.status).toBe('failed');
      expect(failedItem?.errorMessage).toBe('Chat agent exited with code 1');
    });
  });
});

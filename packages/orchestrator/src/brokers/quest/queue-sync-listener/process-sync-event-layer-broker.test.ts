import {
  QuestIdStub,
  QuestStub,
  QuestStatusStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { processSyncEventLayerBroker } from './process-sync-event-layer-broker';
import { processSyncEventLayerBrokerProxy } from './process-sync-event-layer-broker.proxy';

describe('processSyncEventLayerBroker', () => {
  describe('delete case — quest not found', () => {
    it('VALID: {loadQuest resolves undefined} => removeByQuestId fires, updateEntryStatus does NOT fire', async () => {
      const proxy = processSyncEventLayerBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'q-deleted' });
      const loadQuest = jest.fn().mockResolvedValue(undefined);
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();

      const result = await processSyncEventLayerBroker({
        questId,
        loadQuest,
        removeByQuestId,
        updateEntryStatus,
      });

      expect(result).toStrictEqual({ success: true });
      expect(removeByQuestId.mock.calls).toStrictEqual([[{ questId }]]);
      expect(updateEntryStatus.mock.calls).toStrictEqual([]);
    });
  });

  describe('terminal quest status — abandoned', () => {
    it('VALID: {quest.status = abandoned} => updateEntryStatus AND removeByQuestId both fire', async () => {
      const proxy = processSyncEventLayerBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'q-abandoned' });
      const status = QuestStatusStub({ value: 'abandoned' });
      const quest = QuestStub({ id: questId, status });
      const loadQuest = jest.fn().mockResolvedValue(quest);
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();

      await processSyncEventLayerBroker({
        questId,
        loadQuest,
        removeByQuestId,
        updateEntryStatus,
      });

      expect(updateEntryStatus.mock.calls).toStrictEqual([[{ questId, status }]]);
      expect(removeByQuestId.mock.calls).toStrictEqual([[{ questId }]]);
    });
  });

  describe('terminal quest status — complete', () => {
    it('VALID: {quest.status = complete} => updateEntryStatus AND removeByQuestId both fire', async () => {
      const proxy = processSyncEventLayerBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'q-complete' });
      const status = QuestStatusStub({ value: 'complete' });
      const quest = QuestStub({ id: questId, status });
      const loadQuest = jest.fn().mockResolvedValue(quest);
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();

      await processSyncEventLayerBroker({
        questId,
        loadQuest,
        removeByQuestId,
        updateEntryStatus,
      });

      expect(updateEntryStatus.mock.calls).toStrictEqual([[{ questId, status }]]);
      expect(removeByQuestId.mock.calls).toStrictEqual([[{ questId }]]);
    });
  });

  describe('terminal quest status — blocked', () => {
    it('VALID: {quest.status = blocked} => updateEntryStatus AND removeByQuestId both fire (blocked is queue-terminal)', async () => {
      const proxy = processSyncEventLayerBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'q-blocked' });
      const status = QuestStatusStub({ value: 'blocked' });
      const quest = QuestStub({ id: questId, status });
      const loadQuest = jest.fn().mockResolvedValue(quest);
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();

      await processSyncEventLayerBroker({
        questId,
        loadQuest,
        removeByQuestId,
        updateEntryStatus,
      });

      expect(updateEntryStatus.mock.calls).toStrictEqual([[{ questId, status }]]);
      expect(removeByQuestId.mock.calls).toStrictEqual([[{ questId }]]);
    });
  });

  describe('non-terminal quest status, no workItems — in_progress', () => {
    it('VALID: {quest.status = in_progress, workItems empty} => neither fires', async () => {
      const proxy = processSyncEventLayerBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'q-running-empty' });
      const status = QuestStatusStub({ value: 'in_progress' });
      const quest = QuestStub({ id: questId, status, workItems: [] });
      const loadQuest = jest.fn().mockResolvedValue(quest);
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();

      await processSyncEventLayerBroker({
        questId,
        loadQuest,
        removeByQuestId,
        updateEntryStatus,
      });

      expect(updateEntryStatus.mock.calls).toStrictEqual([]);
      expect(removeByQuestId.mock.calls).toStrictEqual([]);
    });
  });

  describe('non-terminal quest status, pending work — seek_scope', () => {
    it('VALID: {quest.status = seek_scope, workItems has a pending item} => neither fires', async () => {
      const proxy = processSyncEventLayerBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'q-seek' });
      const status = QuestStatusStub({ value: 'seek_scope' });
      const pending = WorkItemStub({ status: 'pending' });
      const quest = QuestStub({ id: questId, status, workItems: [pending] });
      const loadQuest = jest.fn().mockResolvedValue(quest);
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();

      await processSyncEventLayerBroker({
        questId,
        loadQuest,
        removeByQuestId,
        updateEntryStatus,
      });

      expect(updateEntryStatus.mock.calls).toStrictEqual([]);
      expect(removeByQuestId.mock.calls).toStrictEqual([]);
    });
  });

  describe('workItems-all-terminal fallback', () => {
    it('VALID: {quest.status = in_progress, every workItem terminal (failed/skipped)} => updateEntryStatus AND removeByQuestId fire (drained fallback)', async () => {
      const proxy = processSyncEventLayerBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'q-drained' });
      const status = QuestStatusStub({ value: 'in_progress' });
      const failed = WorkItemStub({ status: 'failed' });
      const skipped = WorkItemStub({ status: 'skipped' });
      const quest = QuestStub({ id: questId, status, workItems: [failed, skipped] });
      const loadQuest = jest.fn().mockResolvedValue(quest);
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();

      await processSyncEventLayerBroker({
        questId,
        loadQuest,
        removeByQuestId,
        updateEntryStatus,
      });

      expect(updateEntryStatus.mock.calls).toStrictEqual([[{ questId, status }]]);
      expect(removeByQuestId.mock.calls).toStrictEqual([[{ questId }]]);
    });
  });
});

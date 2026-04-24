import { QuestIdStub, QuestStatusStub } from '@dungeonmaster/shared/contracts';

import { processSyncEventLayerBroker } from './process-sync-event-layer-broker';
import { processSyncEventLayerBrokerProxy } from './process-sync-event-layer-broker.proxy';

describe('processSyncEventLayerBroker', () => {
  describe('delete case — quest not found', () => {
    it('VALID: {loadQuestStatus resolves undefined} => removeByQuestId fires, updateEntryStatus does NOT fire', async () => {
      const proxy = processSyncEventLayerBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'q-deleted' });
      const loadQuestStatus = jest.fn().mockResolvedValue(undefined);
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();

      const result = await processSyncEventLayerBroker({
        questId,
        loadQuestStatus,
        removeByQuestId,
        updateEntryStatus,
      });

      expect(result).toStrictEqual({ success: true });
      expect(removeByQuestId.mock.calls).toStrictEqual([[{ questId }]]);
      expect(updateEntryStatus.mock.calls).toStrictEqual([]);
    });
  });

  describe('terminal status — abandoned', () => {
    it('VALID: {status: abandoned} => updateEntryStatus AND removeByQuestId both fire with correct args', async () => {
      const proxy = processSyncEventLayerBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'q-abandoned' });
      const status = QuestStatusStub({ value: 'abandoned' });
      const loadQuestStatus = jest.fn().mockResolvedValue(status);
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();

      await processSyncEventLayerBroker({
        questId,
        loadQuestStatus,
        removeByQuestId,
        updateEntryStatus,
      });

      expect(updateEntryStatus.mock.calls).toStrictEqual([[{ questId, status }]]);
      expect(removeByQuestId.mock.calls).toStrictEqual([[{ questId }]]);
    });
  });

  describe('terminal status — complete', () => {
    it('VALID: {status: complete} => updateEntryStatus AND removeByQuestId both fire', async () => {
      const proxy = processSyncEventLayerBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'q-complete' });
      const status = QuestStatusStub({ value: 'complete' });
      const loadQuestStatus = jest.fn().mockResolvedValue(status);
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();

      await processSyncEventLayerBroker({
        questId,
        loadQuestStatus,
        removeByQuestId,
        updateEntryStatus,
      });

      expect(updateEntryStatus.mock.calls).toStrictEqual([[{ questId, status }]]);
      expect(removeByQuestId.mock.calls).toStrictEqual([[{ questId }]]);
    });
  });

  describe('non-terminal status — in_progress', () => {
    it('VALID: {status: in_progress} => neither updateEntryStatus nor removeByQuestId fires', async () => {
      const proxy = processSyncEventLayerBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'q-running' });
      const status = QuestStatusStub({ value: 'in_progress' });
      const loadQuestStatus = jest.fn().mockResolvedValue(status);
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();

      await processSyncEventLayerBroker({
        questId,
        loadQuestStatus,
        removeByQuestId,
        updateEntryStatus,
      });

      expect(updateEntryStatus.mock.calls).toStrictEqual([]);
      expect(removeByQuestId.mock.calls).toStrictEqual([]);
    });
  });

  describe('non-terminal status — blocked', () => {
    it('VALID: {status: blocked} => neither updateEntryStatus nor removeByQuestId fires (blocked is non-terminal)', async () => {
      const proxy = processSyncEventLayerBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'q-blocked' });
      const status = QuestStatusStub({ value: 'blocked' });
      const loadQuestStatus = jest.fn().mockResolvedValue(status);
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();

      await processSyncEventLayerBroker({
        questId,
        loadQuestStatus,
        removeByQuestId,
        updateEntryStatus,
      });

      expect(updateEntryStatus.mock.calls).toStrictEqual([]);
      expect(removeByQuestId.mock.calls).toStrictEqual([]);
    });
  });
});

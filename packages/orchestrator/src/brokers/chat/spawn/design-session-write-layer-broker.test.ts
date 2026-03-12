import {
  SessionIdStub,
  QuestStub,
  QuestIdStub,
  FileContentsStub,
} from '@dungeonmaster/shared/contracts';

import { designSessionWriteLayerBroker } from './design-session-write-layer-broker';
import { designSessionWriteLayerBrokerProxy } from './design-session-write-layer-broker.proxy';

describe('designSessionWriteLayerBroker', () => {
  describe('write design session to quest', () => {
    it('VALID: {questId + sessionId} => writes design session ID to quest JSON', async () => {
      const proxy = designSessionWriteLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'test-quest' });
      const sessionId = SessionIdStub({ value: 'session-design-123' });
      const quest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'explore_design',
      });
      const questContents = JSON.stringify(quest);

      proxy.setupQuestWrite({ questId: 'test-quest', questContents });

      await designSessionWriteLayerBroker({ questId, sessionId });

      const written = proxy.getWrittenContent();
      const parsed: unknown = JSON.parse(FileContentsStub({ value: written as never }));

      expect(typeof parsed).toBe('object');
      expect(parsed).not.toBeNull();
      expect(Reflect.get(parsed as object, 'designSessionBy')).toBe('session-design-123');
    });
  });

  describe('error cases', () => {
    it('ERROR: {quest file not found} => throws error', async () => {
      const proxy = designSessionWriteLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'missing-quest' });
      const sessionId = SessionIdStub({ value: 'session-design-123' });

      proxy.setupReadFailure({
        questId: 'missing-quest',
        error: new Error('ENOENT: no such file or directory'),
      });

      await expect(designSessionWriteLayerBroker({ questId, sessionId })).rejects.toThrow(
        /^Failed to read file at /u,
      );
    });
  });
});

import {
  SessionIdStub,
  QuestStub,
  QuestIdStub,
  FileContentsStub,
} from '@dungeonmaster/shared/contracts';

import { questSessionWriteLayerBroker } from './quest-session-write-layer-broker';
import { questSessionWriteLayerBrokerProxy } from './quest-session-write-layer-broker.proxy';

describe('questSessionWriteLayerBroker', () => {
  describe('write session to quest', () => {
    it('VALID: {questId + sessionId} => writes session ID to quest JSON', async () => {
      const proxy = questSessionWriteLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'test-quest' });
      const sessionId = SessionIdStub({ value: 'session-abc-123' });
      const quest = QuestStub({ id: 'test-quest', folder: '001-test-quest', status: 'created' });
      const questContents = JSON.stringify(quest);

      proxy.setupQuestWrite({ questId: 'test-quest', questContents });

      await questSessionWriteLayerBroker({ questId, sessionId });

      const written = proxy.getWrittenContent();
      const parsed: unknown = JSON.parse(FileContentsStub({ value: written as never }));

      expect(typeof parsed).toBe('object');
      expect(parsed).not.toBeNull();
      expect(Reflect.get(parsed as object, 'questCreatedSessionBy')).toBe('session-abc-123');
    });
  });

  describe('error cases', () => {
    it('ERROR: {quest file not found} => throws error', async () => {
      const proxy = questSessionWriteLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'missing-quest' });
      const sessionId = SessionIdStub({ value: 'session-abc-123' });

      proxy.setupReadFailure({
        questId: 'missing-quest',
        error: new Error('ENOENT: no such file or directory'),
      });

      await expect(questSessionWriteLayerBroker({ questId, sessionId })).rejects.toThrow(
        /^Failed to read file at /u,
      );
    });

    it('ERROR: {invalid JSON in quest file} => throws error', async () => {
      const proxy = questSessionWriteLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'bad-json-quest' });
      const sessionId = SessionIdStub({ value: 'session-abc-123' });

      proxy.setupInvalidJson({ questId: 'bad-json-quest' });

      let thrownError: Error | null = null;

      try {
        await questSessionWriteLayerBroker({ questId, sessionId });
      } catch (error: unknown) {
        thrownError = error as Error;
      }

      expect(thrownError instanceof Error).toBe(true);
    });
  });
});

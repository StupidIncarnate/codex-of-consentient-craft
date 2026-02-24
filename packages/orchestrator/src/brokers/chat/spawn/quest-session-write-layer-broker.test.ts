import { SessionIdStub, QuestStub, FileContentsStub } from '@dungeonmaster/shared/contracts';

import { questSessionWriteLayerBroker } from './quest-session-write-layer-broker';
import { questSessionWriteLayerBrokerProxy } from './quest-session-write-layer-broker.proxy';

describe('questSessionWriteLayerBroker', () => {
  describe('write session to quest', () => {
    it('VALID: {questId + sessionId} => writes session ID to quest JSON', async () => {
      const proxy = questSessionWriteLayerBrokerProxy();
      const sessionId = SessionIdStub({ value: 'session-abc-123' });
      const quest = QuestStub({ id: 'test-quest', folder: '001-test-quest', status: 'created' });
      const questContents = JSON.stringify(quest);

      proxy.setupQuestWrite({ questId: 'test-quest', questContents });

      await questSessionWriteLayerBroker({ questId: 'test-quest', sessionId });

      const written = proxy.getWrittenContent();
      const parsed: unknown = JSON.parse(FileContentsStub({ value: written as never }));

      expect(typeof parsed).toBe('object');
      expect(parsed).not.toBeNull();
      expect(Reflect.get(parsed as object, 'questCreatedSessionBy')).toBe('session-abc-123');
    });
  });
});

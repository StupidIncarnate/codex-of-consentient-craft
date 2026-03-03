import { FilePathStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questOutboxAppendBroker } from './quest-outbox-append-broker';
import { questOutboxAppendBrokerProxy } from './quest-outbox-append-broker.proxy';

describe('questOutboxAppendBroker', () => {
  describe('successful append', () => {
    it('VALID: {questId} => appends JSON line to outbox file', async () => {
      const proxy = questOutboxAppendBrokerProxy();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const outboxFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/event-outbox.jsonl',
      });
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupOutboxAppend({ homePath, outboxFilePath });

      await questOutboxAppendBroker({ questId });

      expect(proxy.getAppendedContent()).toBe(
        '{"questId":"add-auth","timestamp":"2024-01-15T10:00:00.000Z"}\n',
      );
    });

    it('VALID: {questId} => writes to correct outbox file path', async () => {
      const proxy = questOutboxAppendBrokerProxy();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const outboxFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/event-outbox.jsonl',
      });
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupOutboxAppend({ homePath, outboxFilePath });

      await questOutboxAppendBroker({ questId });

      expect(proxy.getAppendedPath()).toBe('/home/testuser/.dungeonmaster/event-outbox.jsonl');
    });

    it('VALID: {different questId} => appends line with different quest id', async () => {
      const proxy = questOutboxAppendBrokerProxy();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const outboxFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/event-outbox.jsonl',
      });
      const questId = QuestIdStub({ value: 'fix-login-bug' });

      proxy.setupOutboxAppend({ homePath, outboxFilePath });

      await questOutboxAppendBroker({ questId });

      expect(proxy.getAppendedContent()).toBe(
        '{"questId":"fix-login-bug","timestamp":"2024-01-15T10:00:00.000Z"}\n',
      );
    });
  });

  describe('error cases', () => {
    it('ERROR: {append fails} => throws error', async () => {
      const proxy = questOutboxAppendBrokerProxy();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const outboxFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/event-outbox.jsonl',
      });
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupAppendFailure({
        homePath,
        outboxFilePath,
        error: new Error('Permission denied'),
      });

      await expect(questOutboxAppendBroker({ questId })).rejects.toThrow(/Permission denied/u);
    });
  });
});

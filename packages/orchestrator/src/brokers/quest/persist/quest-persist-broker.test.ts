import { FileContentsStub, FilePathStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questPersistBroker } from './quest-persist-broker';
import { questPersistBrokerProxy } from './quest-persist-broker.proxy';

describe('questPersistBroker', () => {
  describe('successful persist', () => {
    it('VALID: {questFilePath, contents, questId} => writes contents to tmp file', async () => {
      const proxy = questPersistBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const contents = FileContentsStub({ value: '{"name":"add-auth"}' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const outboxFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/event-outbox.jsonl',
      });

      proxy.setupPersist({ questFilePath, homePath, outboxFilePath });

      await questPersistBroker({ questFilePath, contents, questId });

      expect(proxy.getWrittenContent({ questFilePath })).toBe('{"name":"add-auth"}');
    });

    it('VALID: {questFilePath, contents, questId} => writes to tmp path (atomic write pattern)', async () => {
      const proxy = questPersistBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/fix-bug/quest.json' });
      const contents = FileContentsStub({ value: '{"name":"fix-bug"}' });
      const questId = QuestIdStub({ value: 'fix-bug' });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const outboxFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/event-outbox.jsonl',
      });

      proxy.setupPersist({ questFilePath, homePath, outboxFilePath });

      await questPersistBroker({ questFilePath, contents, questId });

      expect(proxy.getWrittenPath({ questFilePath })).toBe('/quests/fix-bug/quest.json.tmp');
    });

    it('VALID: {questFilePath, contents, questId} => renames tmp to final after write', async () => {
      const proxy = questPersistBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const contents = FileContentsStub({ value: '{"name":"add-auth"}' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const outboxFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/event-outbox.jsonl',
      });

      proxy.setupPersist({ questFilePath, homePath, outboxFilePath });

      await questPersistBroker({ questFilePath, contents, questId });

      expect(proxy.getAllRenames()).toStrictEqual([
        {
          from: '/quests/add-auth/quest.json.tmp',
          to: '/quests/add-auth/quest.json',
        },
      ]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {write fails} => throws write error', async () => {
      const proxy = questPersistBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const contents = FileContentsStub({ value: '{"name":"add-auth"}' });
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupWriteFailure({
        questFilePath,
        error: new Error('ENOENT: no such file or directory'),
      });

      await expect(questPersistBroker({ questFilePath, contents, questId })).rejects.toThrow(
        /ENOENT: no such file or directory/u,
      );
    });

    it('ERROR: {rename fails} => throws rename error (outbox not appended)', async () => {
      const proxy = questPersistBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const contents = FileContentsStub({ value: '{"name":"add-auth"}' });
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupRenameFailure({
        questFilePath,
        error: new Error('EXDEV: cross-device link not permitted'),
      });

      await expect(questPersistBroker({ questFilePath, contents, questId })).rejects.toThrow(
        /EXDEV/u,
      );
    });

    // Simulates a process kill landing between the tmp write and the rename (the STRESS
    // POINT this pins: killing the API server mid-persist). The broker never calls the
    // underlying fs write with the real questFilePath — only with its `.tmp` derivative — so
    // a kill at any point before rename resolves leaves the real path's on-disk bytes exactly
    // as they were before this call started. Combined with `fsRenameAdapter`'s own PURPOSE
    // comment ("POSIX-atomic on same filesystem"), quest.json can only ever be read back in
    // the pre-persist state (rename never landed) or the post-persist state (rename landed
    // whole) — never a half-written blend of the two.
    it('ERROR: {rename fails, simulating a kill before rename lands} => the real questFilePath is never a write target — only the tmp path is', async () => {
      const proxy = questPersistBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/kill-mid-persist/quest.json' });
      const contents = FileContentsStub({ value: '{"status":"paused"}' });
      const questId = QuestIdStub({ value: 'kill-mid-persist' });

      proxy.setupRenameFailure({
        questFilePath,
        error: new Error('EPERM: process killed before rename'),
      });

      await expect(questPersistBroker({ questFilePath, contents, questId })).rejects.toThrow(
        /EPERM: process killed before rename/u,
      );

      expect(proxy.getAllWrittenFiles()).toStrictEqual([
        { path: '/quests/kill-mid-persist/quest.json.tmp', content: '{"status":"paused"}' },
      ]);
    });

    it('ERROR: {outbox append fails} => throws outbox error', async () => {
      const proxy = questPersistBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const contents = FileContentsStub({ value: '{"name":"add-auth"}' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const outboxFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/event-outbox.jsonl',
      });

      proxy.setupOutboxFailure({
        questFilePath,
        homePath,
        outboxFilePath,
        error: new Error('Permission denied'),
      });

      await expect(questPersistBroker({ questFilePath, contents, questId })).rejects.toThrow(
        /Permission denied/u,
      );
    });

    // The outbox append is the one step in this broker that feeds a downstream notification
    // (a separate watcher tails event-outbox.jsonl and broadcasts quest-modified over the
    // websocket, entirely out of process from this call). Nothing that sends over that socket
    // is ever invoked from inside questPersistBroker itself, so the outbox append — mocked to
    // reject here — is the closest real dependency standing in for "the broadcast never lands."
    // The write + rename run strictly BEFORE it, so this proves the on-disk quest file is
    // already correct — the temp write landed and the atomic rename onto the real path already
    // happened — before that later step is even attempted, regardless of whether it succeeds.
    it('ERROR: {outbox append rejects} => quest file is already written+renamed on disk before the notification failure surfaces', async () => {
      const proxy = questPersistBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/pause-disconnect/quest.json' });
      const contents = FileContentsStub({ value: '{"status":"paused"}' });
      const questId = QuestIdStub({ value: 'pause-disconnect' });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const outboxFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/event-outbox.jsonl',
      });

      proxy.setupOutboxFailure({
        questFilePath,
        homePath,
        outboxFilePath,
        error: new Error('websocket broadcast unreachable'),
      });

      await expect(questPersistBroker({ questFilePath, contents, questId })).rejects.toThrow(
        /websocket broadcast unreachable/u,
      );

      expect(proxy.getWrittenContent({ questFilePath })).toBe('{"status":"paused"}');
      expect(proxy.getAllRenames()).toStrictEqual([
        {
          from: '/quests/pause-disconnect/quest.json.tmp',
          to: '/quests/pause-disconnect/quest.json',
        },
      ]);
    });
  });
});

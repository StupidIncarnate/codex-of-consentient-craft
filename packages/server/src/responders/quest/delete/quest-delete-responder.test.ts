import { GuildIdStub, QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { QuestDeleteResponderProxy } from './quest-delete-responder.proxy';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

const QUEST_DELETE_ALLOWED_STATUSES: readonly StatusKey[] = STATUSES.filter((status) => {
  const meta = questStatusMetadataStatics.statuses[status];
  return meta.isTerminal || meta.isUserPaused || meta.isPreExecution;
});

const QUEST_DELETE_ALLOWED_SET: ReadonlySet<StatusKey> = new Set(QUEST_DELETE_ALLOWED_STATUSES);

const QUEST_DELETE_REJECTED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => !QUEST_DELETE_ALLOWED_SET.has(status),
);

const QUEST_DELETE_REJECTED_ERROR =
  'Quest must be in a terminal, paused, or pre-execution status to delete. Pause or abandon the quest first.';

describe('QuestDeleteResponder', () => {
  describe('allowed statuses', () => {
    it.each(QUEST_DELETE_ALLOWED_STATUSES)(
      'VALID: {status: %s} => returns 200 with deleted true',
      async (status) => {
        const proxy = QuestDeleteResponderProxy();
        const questId = QuestIdStub({ value: `delete-${status}` });
        const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
        const quest = QuestStub({ status: status as never });
        proxy.setupQuest({ quest });
        proxy.setupDeleteQuest({ deleted: true });

        const result = await proxy.callResponder({
          params: { questId },
          query: { guildId },
        });

        expect(result).toStrictEqual({
          status: 200,
          data: { deleted: true },
        });
      },
    );
  });

  describe('rejected statuses', () => {
    it.each(QUEST_DELETE_REJECTED_STATUSES)(
      'INVALID: {status: %s} => returns 400 with error',
      async (status) => {
        const proxy = QuestDeleteResponderProxy();
        const questId = QuestIdStub({ value: `delete-reject-${status}` });
        const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
        const quest = QuestStub({ status: status as never });
        proxy.setupQuest({ quest });

        const result = await proxy.callResponder({
          params: { questId },
          query: { guildId },
        });

        expect(result).toStrictEqual({
          status: 400,
          data: { error: QUEST_DELETE_REJECTED_ERROR },
        });
      },
    );
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400 with error', async () => {
      const proxy = QuestDeleteResponderProxy();

      const result = await proxy.callResponder({ params: null, query: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400 with error', async () => {
      const proxy = QuestDeleteResponderProxy();

      const result = await proxy.callResponder({ params: {}, query: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {null query} => returns 400 with error', async () => {
      const proxy = QuestDeleteResponderProxy();
      const questId = QuestIdStub({ value: 'test-quest' });

      const result = await proxy.callResponder({ params: { questId }, query: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid query' },
      });
    });

    it('INVALID: {missing guildId} => returns 400 with error', async () => {
      const proxy = QuestDeleteResponderProxy();
      const questId = QuestIdStub({ value: 'test-quest' });

      const result = await proxy.callResponder({ params: { questId }, query: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId query parameter is required' },
      });
    });

    it('INVALID: {quest not found} => returns 400 with error', async () => {
      const proxy = QuestDeleteResponderProxy();
      const questId = QuestIdStub({ value: 'missing' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      proxy.setupQuestNotFound();

      const result = await proxy.callResponder({
        params: { questId },
        query: { guildId },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Quest not found' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = QuestDeleteResponderProxy();
      const questId = QuestIdStub({ value: 'fail-quest' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const quest = QuestStub({ status: 'complete' as never });
      proxy.setupQuest({ quest });
      proxy.setupDeleteQuestError({ message: 'Delete failed' });

      const result = await proxy.callResponder({
        params: { questId },
        query: { guildId },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Delete failed' },
      });
    });
  });
});

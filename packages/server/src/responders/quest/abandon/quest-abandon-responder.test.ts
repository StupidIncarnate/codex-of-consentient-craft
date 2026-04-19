import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
import { QuestAbandonResponderProxy } from './quest-abandon-responder.proxy';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

const QUEST_ABANDON_ALLOWED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => questStatusMetadataStatics.statuses[status].isAbandonable,
);

const QUEST_ABANDON_ALLOWED_SET: ReadonlySet<StatusKey> = new Set(QUEST_ABANDON_ALLOWED_STATUSES);

const QUEST_ABANDON_REJECTED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => !QUEST_ABANDON_ALLOWED_SET.has(status),
);

const QUEST_ABANDON_REJECTED_ERROR =
  'Quest is already in a terminal status and cannot be abandoned';

describe('QuestAbandonResponder', () => {
  describe('allowed statuses', () => {
    it.each(QUEST_ABANDON_ALLOWED_STATUSES)(
      'VALID: {status: %s} => returns 200 with abandoned true',
      async (status) => {
        const proxy = QuestAbandonResponderProxy();
        const questId = QuestIdStub();
        const quest = QuestStub({ status: status as never });
        proxy.setupQuest({ quest });
        proxy.setupAbandonQuest({ abandoned: true });

        const result = await proxy.callResponder({ params: { questId } });

        expect(result).toStrictEqual({
          status: 200,
          data: { abandoned: true },
        });
      },
    );
  });

  describe('rejected statuses', () => {
    it.each(QUEST_ABANDON_REJECTED_STATUSES)(
      'INVALID: {status: %s} => returns 400 with error',
      async (status) => {
        const proxy = QuestAbandonResponderProxy();
        const questId = QuestIdStub();
        const quest = QuestStub({ status: status as never });
        proxy.setupQuest({ quest });

        const result = await proxy.callResponder({ params: { questId } });

        expect(result).toStrictEqual({
          status: 400,
          data: { error: QUEST_ABANDON_REJECTED_ERROR },
        });
      },
    );
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400 with error', async () => {
      const proxy = QuestAbandonResponderProxy();

      const result = await proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400 with error', async () => {
      const proxy = QuestAbandonResponderProxy();

      const result = await proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = QuestAbandonResponderProxy();
      const quest = QuestStub({ status: 'in_progress' as never });
      proxy.setupQuest({ quest });
      proxy.setupAbandonQuestError({ message: 'Quest abandon failed' });

      const result = await proxy.callResponder({ params: { questId: 'test-quest' } });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest abandon failed' },
      });
    });
  });
});

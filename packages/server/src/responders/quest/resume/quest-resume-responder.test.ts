import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
import { QuestResumeResponderProxy } from './quest-resume-responder.proxy';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

const QUEST_RESUME_ALLOWED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => questStatusMetadataStatics.statuses[status].isResumable,
);

const QUEST_RESUME_ALLOWED_SET: ReadonlySet<StatusKey> = new Set(QUEST_RESUME_ALLOWED_STATUSES);

const QUEST_RESUME_REJECTED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => !QUEST_RESUME_ALLOWED_SET.has(status),
);

const QUEST_RESUME_REJECTED_ERROR =
  'Quest must be in a resumable status (paused or blocked) to resume';

describe('QuestResumeResponder', () => {
  describe('allowed statuses', () => {
    it.each(QUEST_RESUME_ALLOWED_STATUSES)(
      'VALID: {status: %s} => returns 200 with resumed true and restoredStatus',
      async (status) => {
        const proxy = QuestResumeResponderProxy();
        const questId = QuestIdStub();
        const quest = QuestStub({ status: status as never, pausedAtStatus: 'seek_scope' });
        proxy.setupQuest({ quest });
        proxy.setupResumeQuest({ resumed: true, restoredStatus: 'seek_scope' });

        const result = await proxy.callResponder({ params: { questId } });

        expect(result).toStrictEqual({
          status: 200,
          data: { resumed: true, restoredStatus: 'seek_scope' },
        });
      },
    );
  });

  describe('rejected statuses', () => {
    it.each(QUEST_RESUME_REJECTED_STATUSES)(
      'INVALID: {status: %s} => returns 400 with error',
      async (status) => {
        const proxy = QuestResumeResponderProxy();
        const questId = QuestIdStub();
        const quest = QuestStub({ status: status as never });
        proxy.setupQuest({ quest });

        const result = await proxy.callResponder({ params: { questId } });

        expect(result).toStrictEqual({
          status: 400,
          data: { error: QUEST_RESUME_REJECTED_ERROR },
        });
      },
    );
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400 with error', async () => {
      const proxy = QuestResumeResponderProxy();

      const result = await proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400 with error', async () => {
      const proxy = QuestResumeResponderProxy();

      const result = await proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = QuestResumeResponderProxy();
      const quest = QuestStub({ status: 'paused' as never, pausedAtStatus: 'seek_scope' });
      proxy.setupQuest({ quest });
      proxy.setupResumeQuestError({ message: 'Quest resume failed' });

      const result = await proxy.callResponder({ params: { questId: 'test-quest' } });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest resume failed' },
      });
    });
  });
});

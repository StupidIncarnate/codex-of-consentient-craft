import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
import { QuestPauseResponderProxy } from './quest-pause-responder.proxy';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

const QUEST_PAUSE_ALLOWED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => questStatusMetadataStatics.statuses[status].isPauseable,
);

const QUEST_PAUSE_ALLOWED_SET: ReadonlySet<StatusKey> = new Set(QUEST_PAUSE_ALLOWED_STATUSES);

const QUEST_PAUSE_REJECTED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => !QUEST_PAUSE_ALLOWED_SET.has(status),
);

const QUEST_PAUSE_REJECTED_ERROR =
  'Quest must be in a pauseable status (in_progress, seek_scope, seek_synth, or seek_walk) to pause';

describe('QuestPauseResponder', () => {
  describe('allowed statuses', () => {
    it.each(QUEST_PAUSE_ALLOWED_STATUSES)(
      'VALID: {status: %s} => returns 200 with paused true',
      async (status) => {
        const proxy = QuestPauseResponderProxy();
        const questId = QuestIdStub();
        const quest = QuestStub({ status: status as never });
        proxy.setupQuest({ quest });
        proxy.setupPauseQuest({ paused: true });

        const result = await proxy.callResponder({ params: { questId } });

        expect(result).toStrictEqual({
          status: 200,
          data: { paused: true },
        });
      },
    );
  });

  describe('rejected statuses', () => {
    it.each(QUEST_PAUSE_REJECTED_STATUSES)(
      'INVALID: {status: %s} => returns 400 with error',
      async (status) => {
        const proxy = QuestPauseResponderProxy();
        const questId = QuestIdStub();
        const quest = QuestStub({ status: status as never });
        proxy.setupQuest({ quest });

        const result = await proxy.callResponder({ params: { questId } });

        expect(result).toStrictEqual({
          status: 400,
          data: { error: QUEST_PAUSE_REJECTED_ERROR },
        });
      },
    );
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400 with error', async () => {
      const proxy = QuestPauseResponderProxy();

      const result = await proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400 with error', async () => {
      const proxy = QuestPauseResponderProxy();

      const result = await proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = QuestPauseResponderProxy();
      const quest = QuestStub({ status: 'in_progress' as never });
      proxy.setupQuest({ quest });
      proxy.setupPauseQuestError({ message: 'Quest pause failed' });

      const result = await proxy.callResponder({ params: { questId: 'test-quest' } });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest pause failed' },
      });
    });
  });
});

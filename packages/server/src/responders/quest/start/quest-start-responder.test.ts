import { ProcessIdStub, QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
import { QuestStartResponderProxy } from './quest-start-responder.proxy';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

const QUEST_START_ALLOWED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => questStatusMetadataStatics.statuses[status].isStartable,
);

const QUEST_START_ALLOWED_SET: ReadonlySet<StatusKey> = new Set(QUEST_START_ALLOWED_STATUSES);

const QUEST_START_REJECTED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => !QUEST_START_ALLOWED_SET.has(status),
);

const QUEST_START_REJECTED_ERROR =
  'Quest must be in a startable status (approved or design_approved) to start execution';

describe('QuestStartResponder', () => {
  describe('allowed statuses', () => {
    it.each(QUEST_START_ALLOWED_STATUSES)(
      'VALID: {status: %s} => returns 200 with processId and a played dispatch',
      async (status) => {
        const proxy = QuestStartResponderProxy();
        const questId = QuestIdStub();
        const processId = ProcessIdStub();
        const quest = QuestStub({ id: questId, status: status as never });
        proxy.setupQuest({ quest });
        proxy.setupStartQuest({ questId, processId });
        proxy.setupDispatchPlays();

        const result = await proxy.callResponder({ params: { questId } });

        expect(result).toStrictEqual({
          status: 200,
          data: { processId, dispatch: { started: true } },
        });
      },
    );
  });

  // Starting a quest only enqueues it; the Node dispatcher is a separate switch that boots
  // `paused`. Without this call the quest sits at `in_progress` and nothing picks it up, which is
  // the whole Begin-Quest-does-nothing failure. Asserting the CALL, not just the response field:
  // a responder that reported `started: true` without ever playing would pass a response-only check.
  describe('dispatch is played', () => {
    it.each(QUEST_START_ALLOWED_STATUSES)(
      'VALID: {status: %s} => plays dispatch exactly once with no force',
      async (status) => {
        const proxy = QuestStartResponderProxy();
        const questId = QuestIdStub();
        const processId = ProcessIdStub();
        const quest = QuestStub({ id: questId, status: status as never });
        proxy.setupQuest({ quest });
        proxy.setupStartQuest({ questId, processId });
        proxy.setupDispatchPlays();

        await proxy.callResponder({ params: { questId } });

        expect(proxy.getDispatchPlayCalls()).toStrictEqual([{}]);
      },
    );

    it.each(QUEST_START_REJECTED_STATUSES)(
      'INVALID: {status: %s} => rejected start never plays dispatch',
      async (status) => {
        const proxy = QuestStartResponderProxy();
        const questId = QuestIdStub();
        const quest = QuestStub({ id: questId, status: status as never });
        proxy.setupQuest({ quest });
        proxy.setupDispatchPlays();

        await proxy.callResponder({ params: { questId } });

        expect(proxy.getDispatchPlayCalls()).toStrictEqual([]);
      },
    );
  });

  describe('dispatch refusals never fail the start', () => {
    it('VALID: {exclusivity gate refuses} => returns 200 carrying the refusal reason', async () => {
      const proxy = QuestStartResponderProxy();
      const questId = QuestIdStub();
      const processId = ProcessIdStub();
      const quest = QuestStub({ id: questId, status: 'approved' as never });
      proxy.setupQuest({ quest });
      proxy.setupStartQuest({ questId, processId });
      proxy.setupDispatchRefused({ reason: 'a dumpster-launch loop owns the queue' });

      const result = await proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({
        status: 200,
        data: {
          processId,
          dispatch: { started: false, reason: 'a dumpster-launch loop owns the queue' },
        },
      });
    });

    it('ERROR: {playDispatch throws} => returns 200 with the error as the dispatch reason', async () => {
      const proxy = QuestStartResponderProxy();
      const questId = QuestIdStub();
      const processId = ProcessIdStub();
      const quest = QuestStub({ id: questId, status: 'approved' as never });
      proxy.setupQuest({ quest });
      proxy.setupStartQuest({ questId, processId });
      proxy.setupDispatchError({ message: 'dispatch state write failed' });

      const result = await proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({
        status: 200,
        data: { processId, dispatch: { started: false, reason: 'dispatch state write failed' } },
      });
    });
  });

  describe('rejected statuses', () => {
    it.each(QUEST_START_REJECTED_STATUSES)(
      'INVALID: {status: %s} => returns 400 with error',
      async (status) => {
        const proxy = QuestStartResponderProxy();
        const questId = QuestIdStub();
        const quest = QuestStub({ id: questId, status: status as never });
        proxy.setupQuest({ quest });

        const result = await proxy.callResponder({ params: { questId } });

        expect(result).toStrictEqual({
          status: 400,
          data: { error: QUEST_START_REJECTED_ERROR },
        });
      },
    );
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400 with error', async () => {
      const proxy = QuestStartResponderProxy();

      const result = await proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {non-object params} => returns 400 with error', async () => {
      const proxy = QuestStartResponderProxy();

      const result = await proxy.callResponder({ params: 'not-an-object' });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400 with error', async () => {
      const proxy = QuestStartResponderProxy();

      const result = await proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {questId is number} => returns 400 with error', async () => {
      const proxy = QuestStartResponderProxy();

      const result = await proxy.callResponder({ params: { questId: 123 } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = QuestStartResponderProxy();
      const questId = QuestIdStub({ value: 'test-quest' });
      const quest = QuestStub({ id: questId, status: 'approved' as never });
      proxy.setupQuest({ quest });
      proxy.setupStartQuestError({ questId, message: 'Quest start failed' });

      const result = await proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest start failed' },
      });
    });
  });
});

import {
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
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

const DISPATCHER_SCANNED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => questStatusMetadataStatics.statuses[status].isAnyAgentRunning,
);

describe('QuestResumeResponder', () => {
  describe('allowed statuses', () => {
    it.each(QUEST_RESUME_ALLOWED_STATUSES)(
      'VALID: {status: %s} => returns 200 with resumed true, restoredStatus, and the queue started',
      async (status) => {
        const proxy = QuestResumeResponderProxy();
        const questId = QuestIdStub();
        const quest = QuestStub({
          id: questId,
          status: status as never,
          pausedAtStatus: 'in_progress',
          workItems: [WorkItemStub({ status: 'pending' })],
        });
        proxy.setupQuest({ quest });
        proxy.setupResumeQuest({ questId, resumed: true, restoredStatus: 'in_progress' });
        proxy.setupDispatchPlays();

        const result = await proxy.callResponder({ params: { questId } });

        expect(result).toStrictEqual({
          status: 200,
          data: {
            resumed: true,
            restoredStatus: 'in_progress',
            dispatch: { started: true },
          },
        });
      },
    );
  });

  // Resuming flips quest status only; the Node dispatcher is a separate switch that normalizes to
  // `paused` on every server boot. Without this, a resumed quest sits at `in_progress` with a ready
  // work item and nothing picks it up.
  describe('resume starts the dispatcher', () => {
    it('VALID: {paused quest} => plays dispatch exactly once, with no force', async () => {
      const proxy = QuestResumeResponderProxy();
      const questId = QuestIdStub();
      const quest = QuestStub({
        id: questId,
        status: 'paused' as never,
        pausedAtStatus: 'in_progress',
        workItems: [WorkItemStub({ status: 'pending' })],
      });
      proxy.setupQuest({ quest });
      proxy.setupResumeQuest({ questId, resumed: true, restoredStatus: 'in_progress' });
      proxy.setupDispatchPlays();

      await proxy.callResponder({ params: { questId } });

      expect(proxy.getDispatchPlayCalls()).toStrictEqual([{}]);
    });

    it('VALID: {launch loop owns the queue} => still resumes, reports the gate refusal instead of failing', async () => {
      const proxy = QuestResumeResponderProxy();
      const questId = QuestIdStub();
      const quest = QuestStub({
        id: questId,
        status: 'paused' as never,
        pausedAtStatus: 'in_progress',
        workItems: [WorkItemStub({ status: 'pending' })],
      });
      proxy.setupQuest({ quest });
      proxy.setupResumeQuest({ questId, resumed: true, restoredStatus: 'in_progress' });
      proxy.setupDispatchRefused({ reason: 'a /dumpster-launch loop is driving the queue' });

      const result = await proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({
        status: 200,
        data: {
          resumed: true,
          restoredStatus: 'in_progress',
          dispatch: {
            started: false,
            reason: 'a /dumpster-launch loop is driving the queue',
          },
        },
      });
    });

    it('ERROR: {play throws} => the resume still succeeds and the play failure rides back on the response', async () => {
      const proxy = QuestResumeResponderProxy();
      const questId = QuestIdStub();
      const quest = QuestStub({
        id: questId,
        status: 'paused' as never,
        pausedAtStatus: 'in_progress',
        workItems: [WorkItemStub({ status: 'pending' })],
      });
      proxy.setupQuest({ quest });
      proxy.setupResumeQuest({ questId, resumed: true, restoredStatus: 'in_progress' });
      proxy.setupDispatchError({ message: 'dispatch-state.json is unwritable' });

      const result = await proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({
        status: 200,
        data: {
          resumed: true,
          restoredStatus: 'in_progress',
          dispatch: { started: false, reason: 'dispatch-state.json is unwritable' },
        },
      });
    });

    it('ERROR: {resume itself fails} => dispatch is never played', async () => {
      const proxy = QuestResumeResponderProxy();
      const questId = QuestIdStub();
      const quest = QuestStub({
        id: questId,
        status: 'paused' as never,
        pausedAtStatus: 'in_progress',
        workItems: [WorkItemStub({ status: 'pending' })],
      });
      proxy.setupQuest({ quest });
      proxy.setupResumeQuestError({ questId, message: 'Quest resume failed' });

      await proxy.callResponder({ params: { questId } });

      expect(proxy.getDispatchPlayCalls()).toStrictEqual([]);
    });

    // The dispatcher is global. Starting it for a quest whose ledger is already drained does
    // nothing for that quest and reaches across every other one.
    it('VALID: {drained ledger, every work item terminal} => never touches the global dispatcher', async () => {
      const proxy = QuestResumeResponderProxy();
      const questId = QuestIdStub();
      const quest = QuestStub({
        id: questId,
        status: 'paused' as never,
        pausedAtStatus: 'in_progress',
        workItems: [WorkItemStub({ status: 'complete' })],
        operations: [OperationItemStub({ status: 'complete' })],
      });
      proxy.setupQuest({ quest });
      proxy.setupResumeQuest({ questId, resumed: true, restoredStatus: 'in_progress' });

      const result = await proxy.callResponder({ params: { questId } });

      expect({ result, playCalls: proxy.getDispatchPlayCalls() }).toStrictEqual({
        result: {
          status: 200,
          data: {
            resumed: true,
            restoredStatus: 'in_progress',
            dispatch: { started: false, reason: 'quest has no dispatchable work' },
          },
        },
        playCalls: [],
      });
    });

    it('VALID: {restored to approved with a seeded ledger} => never touches the global dispatcher, which only scans executing quests', async () => {
      const proxy = QuestResumeResponderProxy();
      const questId = QuestIdStub();
      const quest = QuestStub({
        id: questId,
        status: 'paused' as never,
        pausedAtStatus: 'approved',
        operations: [OperationItemStub({ role: 'codeweaver', status: 'pending' })],
      });
      proxy.setupQuest({ quest });
      proxy.setupResumeQuest({ questId, resumed: true, restoredStatus: 'approved' });

      const result = await proxy.callResponder({ params: { questId } });

      expect({ result, playCalls: proxy.getDispatchPlayCalls() }).toStrictEqual({
        result: {
          status: 200,
          data: {
            resumed: true,
            restoredStatus: 'approved',
            dispatch: { started: false, reason: 'quest has no dispatchable work' },
          },
        },
        playCalls: [],
      });
    });

    it('EMPTY: {bare quest, no work items and no operations} => never touches the global dispatcher', async () => {
      const proxy = QuestResumeResponderProxy();
      const questId = QuestIdStub();
      const quest = QuestStub({
        id: questId,
        status: 'paused' as never,
        pausedAtStatus: 'in_progress',
      });
      proxy.setupQuest({ quest });
      proxy.setupResumeQuest({ questId, resumed: true, restoredStatus: 'in_progress' });

      const result = await proxy.callResponder({ params: { questId } });

      expect({ result, playCalls: proxy.getDispatchPlayCalls() }).toStrictEqual({
        result: {
          status: 200,
          data: {
            resumed: true,
            restoredStatus: 'in_progress',
            dispatch: { started: false, reason: 'quest has no dispatchable work' },
          },
        },
        playCalls: [],
      });
    });
  });

  // The dispatcher's own scan (scan-once-layer-broker) selects quests with isAnyAgentRunning,
  // which is in_progress AND merging. Resume decides whether to start the queue with its own
  // predicate, so the two have to agree on the same set: a narrower one here leaves a resumed
  // merge sitting at `merging` with a re-armed warpgate item and nothing to pick it up, which is
  // the exact "pressed resume and watched nothing happen" case this route exists to prevent.
  describe('resume starts the queue for every status the dispatcher scans', () => {
    it.each(DISPATCHER_SCANNED_STATUSES)(
      'VALID: {restoredStatus: %s, incomplete work} => plays dispatch',
      async (restoredStatus) => {
        const proxy = QuestResumeResponderProxy();
        const questId = QuestIdStub();
        const quest = QuestStub({
          id: questId,
          status: 'paused' as never,
          pausedAtStatus: restoredStatus as never,
          workItems: [WorkItemStub({ status: 'pending' })],
        });
        proxy.setupQuest({ quest });
        proxy.setupResumeQuest({ questId, resumed: true, restoredStatus: restoredStatus as never });
        proxy.setupDispatchPlays();

        const result = await proxy.callResponder({ params: { questId } });

        expect(result).toStrictEqual({
          status: 200,
          data: { resumed: true, restoredStatus, dispatch: { started: true } },
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
        const quest = QuestStub({ id: questId, status: status as never });
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
      const questId = QuestIdStub({ value: 'test-quest' });
      const quest = QuestStub({
        id: questId,
        status: 'paused' as never,
        pausedAtStatus: 'in_progress',
      });
      proxy.setupQuest({ quest });
      proxy.setupResumeQuestError({ questId, message: 'Quest resume failed' });

      const result = await proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest resume failed' },
      });
    });
  });
});

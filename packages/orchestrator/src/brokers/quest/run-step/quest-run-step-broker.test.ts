import { OperationItemStub, QuestStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { RunStepStub } from '../../../contracts/run-step/run-step.stub';
import { StepHandlerResultStub } from '../../../contracts/step-handler-result/step-handler-result.stub';
import { questRunStepBroker } from './quest-run-step-broker';
import { questRunStepBrokerProxy } from './quest-run-step-broker.proxy';

const OPERATION_ITEM_ID = 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479';
const WORK_ITEM_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

const COMMIT_QUEST = QuestStub({
  operations: [
    OperationItemStub({
      id: OPERATION_ITEM_ID,
      role: 'codeweaver',
      status: 'in_progress',
      flowIds: ['send-flow'],
      packageNames: ['web'],
    }),
  ],
  workItems: [
    WorkItemStub({
      id: WORK_ITEM_ID,
      role: 'codeweaver',
      status: 'pending',
      step: 'commit',
      relatedDataItems: [`operations/${OPERATION_ITEM_ID}`],
    }),
  ],
});

const COMMIT_STEP = RunStepStub({
  type: 'run-step',
  questId: COMMIT_QUEST.id,
  workItemId: WORK_ITEM_ID,
  handler: 'commit',
  args: [],
});

const WARD_STEP = RunStepStub({
  type: 'run-step',
  questId: COMMIT_QUEST.id,
  workItemId: WORK_ITEM_ID,
  handler: 'ward',
  args: ['--committed', '--uncommitted'],
});

describe('questRunStepBroker', () => {
  describe('a handler that reports a word', () => {
    it('VALID: {handler returns done} => the work item goes complete carrying `done` and the handler detail', async () => {
      const proxy = questRunStepBrokerProxy();
      proxy.setupQuest({ quest: COMMIT_QUEST });
      proxy.handlerReturns({
        result: StepHandlerResultStub({ outcome: 'done', detail: 'codeweaver/commit: web slice' }),
      });

      const result = await questRunStepBroker({ step: COMMIT_STEP, onLine: () => undefined });

      const recorded = proxy.getPersistedQuest().workItems;

      expect({
        result,
        statuses: recorded.map((item) => item.status),
        words: recorded.map((item) => item.declaredWord),
        reasons: recorded.map((item) => String(item.declaredReason)),
        errors: recorded.map((item) => String(item.errorMessage)),
      }).toStrictEqual({
        result: { outcome: 'done', detail: 'codeweaver/commit: web slice' },
        statuses: ['complete'],
        words: ['done'],
        reasons: ['codeweaver/commit: web slice'],
        errors: ['undefined'],
      });
    });

    it('VALID: {the same run} => the item is stamped in_progress BEFORE the handler and terminal after it', async () => {
      const proxy = questRunStepBrokerProxy();
      proxy.setupQuest({ quest: COMMIT_QUEST });
      proxy.handlerReturns({ result: StepHandlerResultStub({ outcome: 'empty' }) });

      await questRunStepBroker({ step: COMMIT_STEP, onLine: () => undefined });

      expect(
        proxy
          .getAllPersistedQuests()
          .map((quest) => quest.workItems.map((item) => item.status).join(',')),
      ).toStrictEqual(['in_progress', 'complete']);
    });
  });

  describe('the handler hits a wall', () => {
    it('ERROR: {handler returns wall} => the work item is `failed` carrying the detail as its errorMessage', async () => {
      const proxy = questRunStepBrokerProxy();
      proxy.setupQuest({ quest: COMMIT_QUEST });
      proxy.handlerReturns({
        result: StepHandlerResultStub({ outcome: 'wall', detail: 'worktree not found: /gone' }),
      });

      await questRunStepBroker({ step: COMMIT_STEP, onLine: () => undefined });

      const recorded = proxy.getPersistedQuest().workItems;

      expect({
        statuses: recorded.map((item) => item.status),
        words: recorded.map((item) => item.declaredWord),
        errors: recorded.map((item) => String(item.errorMessage)),
      }).toStrictEqual({
        statuses: ['failed'],
        words: ['wall'],
        errors: ['worktree not found: /gone'],
      });
    });
  });

  describe('the step’s own args', () => {
    it('VALID: {a ward step declaring two args} => they reach the handler verbatim, with the handler name', async () => {
      const proxy = questRunStepBrokerProxy();
      proxy.setupQuest({ quest: COMMIT_QUEST });
      proxy.handlerReturns({ result: StepHandlerResultStub({ outcome: 'done' }) });

      await questRunStepBroker({ step: WARD_STEP, onLine: () => undefined });

      expect(
        proxy.getHandlerCalls().map((call) => ({
          handler: call.handler,
          args: call.args.map(String),
          workItemId: String(call.workItemId),
        })),
      ).toStrictEqual([
        {
          handler: 'ward',
          args: ['--committed', '--uncommitted'],
          workItemId: WORK_ITEM_ID,
        },
      ]);
    });
  });
});

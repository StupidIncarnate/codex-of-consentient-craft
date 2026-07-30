import {
  OperationItemIdStub,
  OperationItemStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questResumeRearmWorkItemsTransformer } from './quest-resume-rearm-work-items-transformer';

const OPEN_OPERATION_ID = OperationItemIdStub({ value: '11111111-1111-4222-9333-444444444444' });
const DONE_OPERATION_ID = OperationItemIdStub({ value: '22222222-1111-4222-9333-444444444444' });
const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
const SESSION_ID = SessionIdStub({ value: 'a219be5c-ef0f-4987-abea-ed45fb509bbc' });

const OPERATIONS = [
  OperationItemStub({ id: OPEN_OPERATION_ID, role: 'siegemaster', status: 'in_progress' }),
  OperationItemStub({ id: DONE_OPERATION_ID, role: 'ward', status: 'complete' }),
];

describe('questResumeRearmWorkItemsTransformer', () => {
  describe('reviving the halt wreckage', () => {
    it('VALID: {failed item at the reset budget, operation still in_progress, sessionId retained} => pending + retryCount 0 + resume marker', () => {
      const workItems = [
        WorkItemStub({
          id: WORK_ITEM_ID,
          role: 'siegemaster',
          status: 'failed',
          retryCount: 3,
          resume: true,
          sessionId: SESSION_ID,
          relatedDataItems: [`operations/${OPEN_OPERATION_ID}`],
        }),
      ];

      const result = questResumeRearmWorkItemsTransformer({ workItems, operations: OPERATIONS });

      expect(result).toStrictEqual([
        { id: WORK_ITEM_ID, status: 'pending', retryCount: 0, resume: true },
      ]);
    });

    it('VALID: {failed item with NO sessionId} => pending + retryCount 0 without the resume marker (fresh spawn)', () => {
      const workItems = [
        WorkItemStub({
          id: WORK_ITEM_ID,
          role: 'siegemaster',
          status: 'failed',
          retryCount: 3,
          relatedDataItems: [`operations/${OPEN_OPERATION_ID}`],
        }),
      ];

      const result = questResumeRearmWorkItemsTransformer({ workItems, operations: OPERATIONS });

      expect(result).toStrictEqual([{ id: WORK_ITEM_ID, status: 'pending', retryCount: 0 }]);
    });

    it('VALID: {skipped item drained by the block, operation still pending} => revived to pending', () => {
      const pendingOperationId = OperationItemIdStub({
        value: '33333333-1111-4222-9333-444444444444',
      });
      const workItems = [
        WorkItemStub({
          id: WORK_ITEM_ID,
          role: 'flowrider',
          status: 'skipped',
          relatedDataItems: [`operations/${pendingOperationId}`],
        }),
      ];
      const operations = [
        OperationItemStub({ id: pendingOperationId, role: 'flowrider', status: 'pending' }),
      ];

      const result = questResumeRearmWorkItemsTransformer({ workItems, operations });

      expect(result).toStrictEqual([{ id: WORK_ITEM_ID, status: 'pending', retryCount: 0 }]);
    });

    it('VALID: {in_progress orphan with a sessionId} => pending + retryCount 0 + resume marker', () => {
      const workItems = [
        WorkItemStub({
          id: WORK_ITEM_ID,
          role: 'flowrider',
          status: 'in_progress',
          sessionId: SESSION_ID,
          relatedDataItems: [`operations/${OPEN_OPERATION_ID}`],
        }),
      ];

      const result = questResumeRearmWorkItemsTransformer({ workItems, operations: OPERATIONS });

      expect(result).toStrictEqual([
        { id: WORK_ITEM_ID, status: 'pending', retryCount: 0, resume: true },
      ]);
    });

    it('VALID: {queued item} => reset like an in_progress orphan', () => {
      const workItems = [
        WorkItemStub({
          id: WORK_ITEM_ID,
          role: 'lawbringer',
          status: 'queued',
          relatedDataItems: [`operations/${OPEN_OPERATION_ID}`],
        }),
      ];

      const result = questResumeRearmWorkItemsTransformer({ workItems, operations: OPERATIONS });

      expect(result).toStrictEqual([{ id: WORK_ITEM_ID, status: 'pending', retryCount: 0 }]);
    });
  });

  describe('leaving settled work alone', () => {
    it('VALID: {complete item} => no patch', () => {
      const workItems = [
        WorkItemStub({
          id: WORK_ITEM_ID,
          role: 'codeweaver',
          status: 'complete',
          relatedDataItems: [`operations/${DONE_OPERATION_ID}`],
        }),
      ];

      const result = questResumeRearmWorkItemsTransformer({ workItems, operations: OPERATIONS });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {failed ward whose operation item already completed} => no patch (a spiritmender superseded it)', () => {
      const workItems = [
        WorkItemStub({
          id: WORK_ITEM_ID,
          role: 'ward',
          status: 'failed',
          spawnerType: 'command',
          relatedDataItems: [`operations/${DONE_OPERATION_ID}`],
        }),
      ];

      const result = questResumeRearmWorkItemsTransformer({ workItems, operations: OPERATIONS });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {failed item with no operations ref at all} => no patch (owns no resumable scope)', () => {
      const workItems = [
        WorkItemStub({
          id: WORK_ITEM_ID,
          role: 'codeweaver',
          status: 'failed',
          relatedDataItems: [],
        }),
      ];

      const result = questResumeRearmWorkItemsTransformer({ workItems, operations: OPERATIONS });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {pending item with retryCount 0} => no patch (nothing to give back)', () => {
      const workItems = [
        WorkItemStub({
          id: WORK_ITEM_ID,
          role: 'codeweaver',
          status: 'pending',
          retryCount: 0,
          relatedDataItems: [`operations/${OPEN_OPERATION_ID}`],
        }),
      ];

      const result = questResumeRearmWorkItemsTransformer({ workItems, operations: OPERATIONS });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {pending item that spent recovery resets} => retryCount cleared, status untouched', () => {
      const workItems = [
        WorkItemStub({
          id: WORK_ITEM_ID,
          role: 'codeweaver',
          status: 'pending',
          retryCount: 2,
          relatedDataItems: [`operations/${OPEN_OPERATION_ID}`],
        }),
      ];

      const result = questResumeRearmWorkItemsTransformer({ workItems, operations: OPERATIONS });

      expect(result).toStrictEqual([{ id: WORK_ITEM_ID, retryCount: 0 }]);
    });
  });

  describe('the real 529 halt shape', () => {
    it('VALID: {failed siegemaster at budget + in_progress flowrider, both operations open} => both revived with their sessions', () => {
      const siegeId = QuestWorkItemIdStub({ value: 'f3054db6-5f14-4c79-a44e-b4ee375416e2' });
      const flowId = QuestWorkItemIdStub({ value: 'b46e8c87-0593-4cd3-ad33-098d5923e40c' });
      const siegeOperationId = OperationItemIdStub({
        value: '3c08dd53-c172-4edb-a5e9-c305fc377544',
      });
      const flowOperationId = OperationItemIdStub({
        value: '554c0888-74fc-4349-9846-eb352660e9cf',
      });
      const siegeSession = SessionIdStub({ value: 'a219be5c-ef0f-4987-abea-ed45fb509bbc' });
      const flowSession = SessionIdStub({ value: 'a63f16ea-363b-45fb-8324-4645017d1d20' });
      const workItems = [
        WorkItemStub({
          id: siegeId,
          role: 'siegemaster',
          status: 'failed',
          retryCount: 3,
          resume: true,
          sessionId: siegeSession,
          relatedDataItems: [`operations/${siegeOperationId}`],
        }),
        WorkItemStub({
          id: flowId,
          role: 'flowrider',
          status: 'in_progress',
          sessionId: flowSession,
          relatedDataItems: [`operations/${flowOperationId}`],
        }),
      ];
      const operations = [
        OperationItemStub({ id: siegeOperationId, role: 'siegemaster', status: 'in_progress' }),
        OperationItemStub({ id: flowOperationId, role: 'flowrider', status: 'in_progress' }),
      ];

      const result = questResumeRearmWorkItemsTransformer({ workItems, operations });

      expect(result).toStrictEqual([
        { id: siegeId, status: 'pending', retryCount: 0, resume: true },
        { id: flowId, status: 'pending', retryCount: 0, resume: true },
      ]);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {no work items} => returns an empty patch list', () => {
      const result = questResumeRearmWorkItemsTransformer({
        workItems: [],
        operations: OPERATIONS,
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {no operations} => failed items own no unfinished scope, so no patches', () => {
      const workItems = [
        WorkItemStub({
          id: WORK_ITEM_ID,
          role: 'codeweaver',
          status: 'failed',
          relatedDataItems: [`operations/${OPEN_OPERATION_ID}`],
        }),
      ];

      const result = questResumeRearmWorkItemsTransformer({ workItems, operations: [] });

      expect(result).toStrictEqual([]);
    });
  });
});

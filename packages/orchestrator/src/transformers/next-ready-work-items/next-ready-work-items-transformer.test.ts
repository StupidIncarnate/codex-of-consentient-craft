import { QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { nextReadyWorkItemsTransformer } from './next-ready-work-items-transformer';

describe('nextReadyWorkItemsTransformer', () => {
  describe('terminal states', () => {
    it('EMPTY: {workItems: []} => questTerminal true', () => {
      const result = nextReadyWorkItemsTransformer({ workItems: [] });

      expect(result).toStrictEqual({
        ready: [],
        questTerminal: true,
        questBlocked: false,
      });
    });

    it('VALID: {all items complete} => questTerminal true', () => {
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'complete',
      });

      const result = nextReadyWorkItemsTransformer({ workItems: [item] });

      expect(result).toStrictEqual({
        ready: [],
        questTerminal: true,
        questBlocked: false,
      });
    });

    it('VALID: {all items failed} => questTerminal true', () => {
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'failed',
      });

      const result = nextReadyWorkItemsTransformer({ workItems: [item] });

      expect(result).toStrictEqual({
        ready: [],
        questTerminal: true,
        questBlocked: false,
      });
    });
  });

  describe('ready items', () => {
    it('VALID: {single pending item with no deps} => ready', () => {
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'pending',
        dependsOn: [],
      });

      const result = nextReadyWorkItemsTransformer({ workItems: [item] });

      expect(result).toStrictEqual({
        ready: [item],
        questTerminal: false,
        questBlocked: false,
      });
    });

    it('VALID: {item with completed dep} => ready', () => {
      const depId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const dep = WorkItemStub({ id: depId, status: 'complete' });
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '03a9d8d8-7d74-4041-981c-977812e6dc45' }),
        status: 'pending',
        dependsOn: [depId],
      });

      const result = nextReadyWorkItemsTransformer({ workItems: [dep, item] });

      expect(result).toStrictEqual({
        ready: [item],
        questTerminal: false,
        questBlocked: false,
      });
    });

    it('VALID: {multiple ready items} => all returned', () => {
      const item1 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'pending',
        dependsOn: [],
      });
      const item2 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '03a9d8d8-7d74-4041-981c-977812e6dc45' }),
        status: 'pending',
        dependsOn: [],
      });

      const result = nextReadyWorkItemsTransformer({ workItems: [item1, item2] });

      expect(result).toStrictEqual({
        ready: [item1, item2],
        questTerminal: false,
        questBlocked: false,
      });
    });
  });

  describe('blocked state', () => {
    it('VALID: {pending item with failed dep} => ready (failed satisfies dependsOn)', () => {
      const depId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const dep = WorkItemStub({ id: depId, status: 'failed' });
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '03a9d8d8-7d74-4041-981c-977812e6dc45' }),
        status: 'pending',
        dependsOn: [depId],
      });

      const result = nextReadyWorkItemsTransformer({ workItems: [dep, item] });

      expect(result).toStrictEqual({
        ready: [item],
        questTerminal: false,
        questBlocked: false,
      });
    });

    it('VALID: {pending item with skipped dep} => blocked', () => {
      const depId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const dep = WorkItemStub({ id: depId, status: 'skipped' });
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '03a9d8d8-7d74-4041-981c-977812e6dc45' }),
        status: 'pending',
        dependsOn: [depId],
      });

      const result = nextReadyWorkItemsTransformer({ workItems: [dep, item] });

      expect(result).toStrictEqual({
        ready: [],
        questTerminal: false,
        questBlocked: true,
      });
    });
  });

  describe('skipped states', () => {
    it('VALID: {all items skipped} => questTerminal true', () => {
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'skipped',
      });

      const result = nextReadyWorkItemsTransformer({ workItems: [item] });

      expect(result).toStrictEqual({
        ready: [],
        questTerminal: true,
        questBlocked: false,
      });
    });

    it('VALID: {mix of complete, failed, and skipped} => questTerminal true', () => {
      const item1 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'complete',
      });
      const item2 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '03a9d8d8-7d74-4041-981c-977812e6dc45' }),
        status: 'failed',
      });
      const item3 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '2063553f-9f1c-6c33-8d24-05ca15a4f935' }),
        status: 'skipped',
      });

      const result = nextReadyWorkItemsTransformer({ workItems: [item1, item2, item3] });

      expect(result).toStrictEqual({
        ready: [],
        questTerminal: true,
        questBlocked: false,
      });
    });
  });

  describe('mixed dependency states', () => {
    it('VALID: {depends on complete + failed} => ready (both satisfy dependsOn)', () => {
      const completeId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const failedId = QuestWorkItemIdStub({ value: '03a9d8d8-7d74-4041-981c-977812e6dc45' });
      const completeDep = WorkItemStub({ id: completeId, status: 'complete' });
      const failedDep = WorkItemStub({ id: failedId, status: 'failed' });
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '2063553f-9f1c-6c33-8d24-05ca15a4f935' }),
        status: 'pending',
        dependsOn: [completeId, failedId],
      });

      const result = nextReadyWorkItemsTransformer({
        workItems: [completeDep, failedDep, item],
      });

      expect(result).toStrictEqual({
        ready: [item],
        questTerminal: false,
        questBlocked: false,
      });
    });

    it('VALID: {depends on complete + pending} => NOT ready (pending does not satisfy)', () => {
      const completeId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const pendingId = QuestWorkItemIdStub({ value: '03a9d8d8-7d74-4041-981c-977812e6dc45' });
      const completeDep = WorkItemStub({ id: completeId, status: 'complete' });
      const pendingDep = WorkItemStub({
        id: pendingId,
        status: 'pending',
        dependsOn: [],
      });
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '2063553f-9f1c-6c33-8d24-05ca15a4f935' }),
        status: 'pending',
        dependsOn: [completeId, pendingId],
      });

      const result = nextReadyWorkItemsTransformer({
        workItems: [completeDep, pendingDep, item],
      });

      expect(result).toStrictEqual({
        ready: [pendingDep],
        questTerminal: false,
        questBlocked: false,
      });
    });
  });

  describe('in progress items', () => {
    it('VALID: {item with in_progress dep} => not ready, not blocked', () => {
      const depId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const dep = WorkItemStub({ id: depId, status: 'in_progress' });
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '03a9d8d8-7d74-4041-981c-977812e6dc45' }),
        status: 'pending',
        dependsOn: [depId],
      });

      const result = nextReadyWorkItemsTransformer({ workItems: [dep, item] });

      expect(result).toStrictEqual({
        ready: [],
        questTerminal: false,
        questBlocked: false,
      });
    });
  });
});

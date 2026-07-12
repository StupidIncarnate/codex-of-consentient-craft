import { QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { hasFailedInsertedByAncestorGuard } from './has-failed-inserted-by-ancestor-guard';

type WorkItem = ReturnType<typeof WorkItemStub>;

const buildItemMap = (items: readonly WorkItem[]): Map<WorkItem['id'], WorkItem> => {
  const map = new Map<WorkItem['id'], WorkItem>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return map;
};

describe('hasFailedInsertedByAncestorGuard', () => {
  it('VALID: {insertedBy points directly at a failed item} => true', () => {
    const failedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
    const failed = WorkItemStub({ id: failedId, role: 'blightwarden', status: 'failed' });
    const replan = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' }),
      role: 'pathseeker',
      status: 'pending',
      insertedBy: failedId,
    });
    const itemMap = buildItemMap([failed, replan]);

    expect(hasFailedInsertedByAncestorGuard({ workItem: replan, itemMap })).toBe(true);
  });

  it('VALID: {two-hop insertedBy chain reaching a failed item} => true', () => {
    const failedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
    const midId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });
    const failed = WorkItemStub({ id: failedId, role: 'blightwarden', status: 'failed' });
    const mid = WorkItemStub({
      id: midId,
      role: 'pathseeker',
      status: 'complete',
      insertedBy: failedId,
    });
    const leaf = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c1d-9e2f-3a4b5c6d7e8f' }),
      role: 'codeweaver',
      status: 'pending',
      insertedBy: midId,
    });
    const itemMap = buildItemMap([failed, mid, leaf]);

    expect(hasFailedInsertedByAncestorGuard({ workItem: leaf, itemMap })).toBe(true);
  });

  it('EMPTY: {no insertedBy} => false', () => {
    const item = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
      role: 'pathseeker',
      status: 'pending',
    });
    const itemMap = buildItemMap([item]);

    expect(hasFailedInsertedByAncestorGuard({ workItem: item, itemMap })).toBe(false);
  });

  it('VALID: {insertedBy points at a complete (non-failed) item} => false', () => {
    const parentId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
    const parent = WorkItemStub({ id: parentId, role: 'pathseeker', status: 'complete' });
    const child = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' }),
      role: 'codeweaver',
      status: 'pending',
      insertedBy: parentId,
    });
    const itemMap = buildItemMap([parent, child]);

    expect(hasFailedInsertedByAncestorGuard({ workItem: child, itemMap })).toBe(false);
  });

  it('EDGE: {insertedBy references a missing parent} => false', () => {
    const item = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
      role: 'pathseeker',
      status: 'pending',
      insertedBy: QuestWorkItemIdStub({ value: 'ffffffff-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
    });
    const itemMap = buildItemMap([item]);

    expect(hasFailedInsertedByAncestorGuard({ workItem: item, itemMap })).toBe(false);
  });

  it('EDGE: {insertedBy cycle with no failed member} => false (cycle-safe)', () => {
    const aId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
    const bId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });
    const a = WorkItemStub({ id: aId, role: 'codeweaver', status: 'pending', insertedBy: bId });
    const b = WorkItemStub({ id: bId, role: 'codeweaver', status: 'pending', insertedBy: aId });
    const itemMap = buildItemMap([a, b]);

    expect(hasFailedInsertedByAncestorGuard({ workItem: a, itemMap })).toBe(false);
  });

  it('EMPTY: {no workItem} => false', () => {
    const itemMap = buildItemMap([]);

    expect(hasFailedInsertedByAncestorGuard({ itemMap })).toBe(false);
  });
});

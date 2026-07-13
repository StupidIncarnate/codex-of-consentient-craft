import { QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { workItemsInDispatchOrderTransformer } from './work-items-in-dispatch-order-transformer';

describe('workItemsInDispatchOrderTransformer', () => {
  it('EMPTY: {workItems: []} => returns []', () => {
    expect(workItemsInDispatchOrderTransformer({ workItems: [] })).toStrictEqual([]);
  });

  it('VALID: {floor-3 item placed before its floor-2 siblings in input} => floor-3 sorts LAST (topological depth wins)', () => {
    const rootId = QuestWorkItemIdStub({ value: '8c858ffd-0000-4000-8000-000000000000' });
    const floor2aId = QuestWorkItemIdStub({ value: '7aa7b49b-0000-4000-8000-000000000000' });
    const floor2bId = QuestWorkItemIdStub({ value: '42cd11cd-0000-4000-8000-000000000000' });
    const floor3Id = QuestWorkItemIdStub({ value: '68b54d56-0000-4000-8000-000000000000' });

    const root = WorkItemStub({
      id: rootId,
      role: 'chaoswhisperer',
      status: 'complete',
      dependsOn: [],
    });
    const floor2a = WorkItemStub({ id: floor2aId, role: 'codeweaver', dependsOn: [rootId] });
    const floor2b = WorkItemStub({ id: floor2bId, role: 'codeweaver', dependsOn: [rootId] });
    // Depends on ONE floor-2 item only — depth 2, even though unrelated to the other floor-2 work.
    const floor3 = WorkItemStub({
      id: floor3Id,
      role: 'codeweaver',
      dependsOn: [rootId, floor2aId],
    });

    // floor3 deliberately placed before the floor-2 items — the array position that let it jump ahead.
    const ordered = workItemsInDispatchOrderTransformer({
      workItems: [root, floor3, floor2a, floor2b],
    });

    expect(ordered.map((item) => item.id)).toStrictEqual([rootId, floor2aId, floor2bId, floor3Id]);
  });

  it('VALID: {same depth, different roles} => orders by floor-config position (codeweaver before flowrider)', () => {
    const rootId = QuestWorkItemIdStub({ value: 'aaaaaaaa-0000-4000-8000-000000000000' });
    const flowriderId = QuestWorkItemIdStub({ value: 'bbbbbbbb-0000-4000-8000-000000000000' });
    const codeweaverId = QuestWorkItemIdStub({ value: 'cccccccc-0000-4000-8000-000000000000' });

    const root = WorkItemStub({
      id: rootId,
      role: 'chaoswhisperer',
      status: 'complete',
      dependsOn: [],
    });
    const flowrider = WorkItemStub({ id: flowriderId, role: 'flowrider', dependsOn: [rootId] });
    const codeweaver = WorkItemStub({ id: codeweaverId, role: 'codeweaver', dependsOn: [rootId] });

    const ordered = workItemsInDispatchOrderTransformer({
      workItems: [root, flowrider, codeweaver],
    });

    expect(ordered.map((item) => item.id)).toStrictEqual([rootId, codeweaverId, flowriderId]);
  });

  it('VALID: {same depth and role} => orders by createdAt ascending', () => {
    const rootId = QuestWorkItemIdStub({ value: 'dddddddd-0000-4000-8000-000000000000' });
    const laterId = QuestWorkItemIdStub({ value: 'eeeeeeee-0000-4000-8000-000000000000' });
    const earlierId = QuestWorkItemIdStub({ value: 'ffffffff-0000-4000-8000-000000000000' });

    const root = WorkItemStub({
      id: rootId,
      role: 'chaoswhisperer',
      status: 'complete',
      dependsOn: [],
    });
    const later = WorkItemStub({
      id: laterId,
      role: 'codeweaver',
      dependsOn: [rootId],
      createdAt: '2024-01-15T12:00:00.000Z',
    });
    const earlier = WorkItemStub({
      id: earlierId,
      role: 'codeweaver',
      dependsOn: [rootId],
      createdAt: '2024-01-15T10:00:00.000Z',
    });

    const ordered = workItemsInDispatchOrderTransformer({
      workItems: [root, later, earlier],
    });

    expect(ordered.map((item) => item.id)).toStrictEqual([rootId, earlierId, laterId]);
  });
});

import { QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { computeReadyWorkItemsLayerBroker } from './compute-ready-work-items-layer-broker';
import { computeReadyWorkItemsLayerBrokerProxy } from './compute-ready-work-items-layer-broker.proxy';

describe('computeReadyWorkItemsLayerBroker', () => {
  it('EMPTY: {workItems: []} => returns []', () => {
    computeReadyWorkItemsLayerBrokerProxy();

    const result = computeReadyWorkItemsLayerBroker({ workItems: [] });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {single pending item with no deps} => returns that item', () => {
    computeReadyWorkItemsLayerBrokerProxy();
    const item = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'aaa11111-1111-4222-9333-444444444444' }),
      role: 'codeweaver',
      status: 'pending',
    });

    const result = computeReadyWorkItemsLayerBroker({ workItems: [item] });

    expect(result).toStrictEqual([item]);
  });

  it('VALID: {pending item with satisfied complete dep} => returns the dependent', () => {
    computeReadyWorkItemsLayerBrokerProxy();
    const doneId = QuestWorkItemIdStub({ value: 'aaa22222-1111-4222-9333-444444444444' });
    const readyId = QuestWorkItemIdStub({ value: 'aaa33333-1111-4222-9333-444444444444' });
    const done = WorkItemStub({ id: doneId, role: 'codeweaver', status: 'complete' });
    const ready = WorkItemStub({
      id: readyId,
      role: 'lawbringer',
      status: 'pending',
      dependsOn: [doneId],
    });

    const result = computeReadyWorkItemsLayerBroker({ workItems: [done, ready] });

    expect(result).toStrictEqual([ready]);
  });

  it('VALID: {pending item with unsatisfied in_progress dep} => excluded', () => {
    computeReadyWorkItemsLayerBrokerProxy();
    const blockingId = QuestWorkItemIdStub({
      value: 'aaa44444-1111-4222-9333-444444444444',
    });
    const blockedId = QuestWorkItemIdStub({
      value: 'aaa55555-1111-4222-9333-444444444444',
    });
    const blocking = WorkItemStub({
      id: blockingId,
      role: 'codeweaver',
      status: 'in_progress',
    });
    const blocked = WorkItemStub({
      id: blockedId,
      role: 'lawbringer',
      status: 'pending',
      dependsOn: [blockingId],
    });

    const result = computeReadyWorkItemsLayerBroker({ workItems: [blocking, blocked] });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {floor-3 codeweaver ready alongside floor-2 codeweavers} => floor-2 items come FIRST, floor-3 LAST (dispatch order = floor order)', () => {
    computeReadyWorkItemsLayerBrokerProxy();
    const rootId = QuestWorkItemIdStub({ value: '8c858ffd-e132-4cf6-8d2c-defbeec99810' });
    const floor2DoneId = QuestWorkItemIdStub({ value: '7aa7b49b-0000-4000-8000-000000000000' });
    const floor2aId = QuestWorkItemIdStub({ value: '42cd11cd-0000-4000-8000-000000000000' });
    const floor2bId = QuestWorkItemIdStub({ value: 'c2b07031-0000-4000-8000-000000000000' });
    const floor3Id = QuestWorkItemIdStub({ value: '68b54d56-0000-4000-8000-000000000000' });

    const root = WorkItemStub({ id: rootId, role: 'pesteater', status: 'complete' });
    const floor2Done = WorkItemStub({
      id: floor2DoneId,
      role: 'codeweaver',
      status: 'complete',
      dependsOn: [rootId],
    });
    // Floor-3: depends on ONE floor-2 item (now complete) — ready, but a deeper floor.
    const floor3 = WorkItemStub({
      id: floor3Id,
      role: 'codeweaver',
      status: 'pending',
      dependsOn: [rootId, floor2DoneId],
    });
    const floor2a = WorkItemStub({
      id: floor2aId,
      role: 'codeweaver',
      status: 'pending',
      dependsOn: [rootId],
    });
    const floor2b = WorkItemStub({
      id: floor2bId,
      role: 'codeweaver',
      status: 'pending',
      dependsOn: [rootId],
    });

    // Input order puts the floor-3 item first — the array position that let it jump ahead.
    const result = computeReadyWorkItemsLayerBroker({
      workItems: [root, floor2Done, floor3, floor2a, floor2b],
    });

    expect(result.map((item) => item.id)).toStrictEqual([floor2aId, floor2bId, floor3Id]);
  });

  it('VALID: {pending item with failed dep} => dependent IS ready (failed satisfies dependency)', () => {
    computeReadyWorkItemsLayerBrokerProxy();
    const failedId = QuestWorkItemIdStub({ value: 'aaa66666-1111-4222-9333-444444444444' });
    const dependentId = QuestWorkItemIdStub({
      value: 'aaa77777-1111-4222-9333-444444444444',
    });
    const failed = WorkItemStub({ id: failedId, role: 'codeweaver', status: 'failed' });
    const dependent = WorkItemStub({
      id: dependentId,
      role: 'lawbringer',
      status: 'pending',
      dependsOn: [failedId],
    });

    const result = computeReadyWorkItemsLayerBroker({ workItems: [failed, dependent] });

    expect(result).toStrictEqual([dependent]);
  });
});

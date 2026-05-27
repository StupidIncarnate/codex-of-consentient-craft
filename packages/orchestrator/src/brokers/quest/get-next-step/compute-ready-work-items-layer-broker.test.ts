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

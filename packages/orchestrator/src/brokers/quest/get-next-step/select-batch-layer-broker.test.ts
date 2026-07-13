import { QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { selectBatchLayerBroker } from './select-batch-layer-broker';
import { selectBatchLayerBrokerProxy } from './select-batch-layer-broker.proxy';

describe('selectBatchLayerBroker', () => {
  it('EMPTY: {ready: []} => returns empty batch', () => {
    selectBatchLayerBrokerProxy();

    const batch = selectBatchLayerBroker({ ready: [] });

    expect(batch).toStrictEqual([]);
  });

  it('VALID: {single codeweaver ready} => returns it as solo batch', () => {
    selectBatchLayerBrokerProxy();
    const cw = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'ccc99994-1111-4222-9333-444444444444' }),
      role: 'codeweaver',
    });

    const batch = selectBatchLayerBroker({ ready: [cw] });

    expect(batch).toStrictEqual([cw]);
  });

  it('VALID: {codeweaver + lawbringer both ready} => returns only the first (one session at a time)', () => {
    selectBatchLayerBrokerProxy();
    const cw = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'ccc99995-1111-4222-9333-444444444444' }),
      role: 'codeweaver',
    });
    const lb = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'ccc99996-1111-4222-9333-444444444444' }),
      role: 'lawbringer',
    });

    const batch = selectBatchLayerBroker({ ready: [cw, lb] });

    expect(batch).toStrictEqual([cw]);
  });

  it('VALID: {two spiritmenders ready} => returns only the first (no role-based batching)', () => {
    selectBatchLayerBrokerProxy();
    const spiritA = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'eee33333-1111-4222-9333-444444444444' }),
      role: 'spiritmender',
    });
    const spiritB = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'eee44444-1111-4222-9333-444444444444' }),
      role: 'spiritmender',
    });

    const batch = selectBatchLayerBroker({ ready: [spiritA, spiritB] });

    expect(batch).toStrictEqual([spiritA]);
  });
});

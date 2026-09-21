import { QuestWorkItemIdStub, StepNameStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { selectBatchLayerBroker } from './select-batch-layer-broker';
import { selectBatchLayerBrokerProxy } from './select-batch-layer-broker.proxy';

describe('selectBatchLayerBroker', () => {
  describe('the intersection of ready and selected', () => {
    it('EMPTY: {ready: [], selected: []} => returns empty batch', () => {
      selectBatchLayerBrokerProxy();

      const batch = selectBatchLayerBroker({ ready: [], selected: [] });

      expect(batch).toStrictEqual([]);
    });

    it('EMPTY: {ready: [cw], selected: []} => returns empty batch (nothing selected)', () => {
      selectBatchLayerBrokerProxy();
      const cw = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ccc99994-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
      });

      const batch = selectBatchLayerBroker({ ready: [cw], selected: [] });

      expect(batch).toStrictEqual([]);
    });

    it('VALID: {single codeweaver ready and selected} => returns it as solo batch', () => {
      selectBatchLayerBrokerProxy();
      const cw = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ccc99995-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
      });

      const batch = selectBatchLayerBroker({ ready: [cw], selected: [cw.id] });

      expect(batch).toStrictEqual([cw]);
    });

    it('VALID: {four ready codeweaver cells, all four selected} => returns all four, in ready order', () => {
      selectBatchLayerBrokerProxy();
      const cw1 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ccc00001-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
      });
      const cw2 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ccc00002-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
      });
      const cw3 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ccc00003-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
      });
      const cw4 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ccc00004-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
      });

      const batch = selectBatchLayerBroker({
        ready: [cw1, cw2, cw3, cw4],
        selected: [cw1.id, cw2.id, cw3.id, cw4.id],
      });

      expect(batch).toStrictEqual([cw1, cw2, cw3, cw4]);
    });

    it('VALID: {selected ids shuffled relative to ready} => batch comes back in READY order, not echoed', () => {
      selectBatchLayerBrokerProxy();
      const cw1 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ccc00005-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
      });
      const cw2 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ccc00006-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
      });
      const cw3 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ccc00007-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
      });

      // Deliberately out of ready's order — proves the selector reorders rather than echoing.
      const batch = selectBatchLayerBroker({
        ready: [cw1, cw2, cw3],
        selected: [cw3.id, cw1.id, cw2.id],
      });

      expect(batch).toStrictEqual([cw1, cw2, cw3]);
    });

    it('VALID: {selected names an id the ready set no longer carries} => that id is dropped, not re-admitted', () => {
      selectBatchLayerBrokerProxy();
      const cw1 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ccc00008-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
      });
      const claimedId = QuestWorkItemIdStub({ value: 'ccc00009-1111-4222-9333-444444444444' });

      const batch = selectBatchLayerBroker({
        ready: [cw1],
        selected: [cw1.id, claimedId],
      });

      expect(batch).toStrictEqual([cw1]);
    });
  });

  describe('the same-role invariant', () => {
    it('VALID: {batch items share one role} => returns the batch', () => {
      selectBatchLayerBrokerProxy();
      const a = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'eee00001-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
      });
      const b = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'eee00002-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
      });

      const batch = selectBatchLayerBroker({ ready: [a, b], selected: [a.id, b.id] });

      expect(batch).toStrictEqual([a, b]);
    });

    it('ERROR: {batch items carry two different roles, no deps between them} => throws', () => {
      selectBatchLayerBrokerProxy();
      const cw = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'eee00003-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
      });
      const spirit = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'eee00004-1111-4222-9333-444444444444' }),
        role: 'spiritmender',
      });

      expect(() =>
        selectBatchLayerBroker({ ready: [cw, spirit], selected: [cw.id, spirit.id] }),
      ).toThrow(/batch mixes roles/u);
    });
  });

  describe('the same-step invariant', () => {
    it('VALID: {batch items share one explicit step} => returns the batch', () => {
      selectBatchLayerBrokerProxy();
      const step = StepNameStub({ value: 'work' });
      const a = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ddd00001-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
        step,
      });
      const b = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ddd00002-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
        step,
      });

      const batch = selectBatchLayerBroker({ ready: [a, b], selected: [a.id, b.id] });

      expect(batch).toStrictEqual([a, b]);
    });

    it('VALID: {batch items share no explicit step (undefined on both)} => returns the batch', () => {
      selectBatchLayerBrokerProxy();
      const a = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ddd00003-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
      });
      const b = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ddd00004-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
      });

      const batch = selectBatchLayerBroker({ ready: [a, b], selected: [a.id, b.id] });

      expect(batch).toStrictEqual([a, b]);
    });

    it('ERROR: {batch items carry two different step values} => throws', () => {
      selectBatchLayerBrokerProxy();
      const a = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ddd00005-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
        step: StepNameStub({ value: 'plan' }),
      });
      const b = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ddd00006-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
        step: StepNameStub({ value: 'work' }),
      });

      expect(() => selectBatchLayerBroker({ ready: [a, b], selected: [a.id, b.id] })).toThrow(
        /batch mixes steps/u,
      );
    });
  });
});

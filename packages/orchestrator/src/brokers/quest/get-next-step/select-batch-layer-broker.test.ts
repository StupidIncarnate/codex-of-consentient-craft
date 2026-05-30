import { QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { selectBatchLayerBroker } from './select-batch-layer-broker';
import { selectBatchLayerBrokerProxy } from './select-batch-layer-broker.proxy';

describe('selectBatchLayerBroker', () => {
  describe('single-agent default', () => {
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

    it('VALID: {codeweaver + lawbringer both ready} => returns only the first (single-agent rule)', () => {
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

    it('VALID: {pathseeker + codeweaver both ready} => returns only the pathseeker (first-position)', () => {
      selectBatchLayerBrokerProxy();
      const ps = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ccc99997-1111-4222-9333-444444444444' }),
        role: 'pathseeker',
      });
      const cw = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ccc99998-1111-4222-9333-444444444444' }),
        role: 'codeweaver',
      });

      const batch = selectBatchLayerBroker({ ready: [ps, cw] });

      expect(batch).toStrictEqual([ps]);
    });

    it('VALID: {single pathseeker-walk ready} => solo batch (not part of any parallel rule)', () => {
      selectBatchLayerBrokerProxy();
      const walk = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'ddd99999-1111-4222-9333-444444444444' }),
        role: 'pathseeker-walk',
      });

      const batch = selectBatchLayerBroker({ ready: [walk] });

      expect(batch).toStrictEqual([walk]);
    });
  });

  describe('pathseeker-surface batch', () => {
    it('VALID: {one pathseeker-surface ready} => returns it as a batch (alongside any other ready items it shadows)', () => {
      selectBatchLayerBrokerProxy();
      const surfaceA = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'aaa11111-1111-4222-9333-444444444444' }),
        role: 'pathseeker-surface',
      });

      const batch = selectBatchLayerBroker({ ready: [surfaceA] });

      expect(batch).toStrictEqual([surfaceA]);
    });

    it('VALID: {two pathseeker-surface ready} => returns BOTH in one batch', () => {
      selectBatchLayerBrokerProxy();
      const surfaceA = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'aaa11111-1111-4222-9333-444444444444' }),
        role: 'pathseeker-surface',
      });
      const surfaceB = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'aaa22222-1111-4222-9333-444444444444' }),
        role: 'pathseeker-surface',
      });

      const batch = selectBatchLayerBroker({ ready: [surfaceA, surfaceB] });

      expect(batch).toStrictEqual([surfaceA, surfaceB]);
    });

    it('VALID: {pathseeker-surface + pathseeker-dedup ready} => surface wins, dedup waits', () => {
      selectBatchLayerBrokerProxy();
      const surface = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'aaa11111-1111-4222-9333-444444444444' }),
        role: 'pathseeker-surface',
      });
      const dedup = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'aaa33333-1111-4222-9333-444444444444' }),
        role: 'pathseeker-dedup',
      });

      const batch = selectBatchLayerBroker({ ready: [surface, dedup] });

      expect(batch).toStrictEqual([surface]);
    });
  });

  describe('spiritmender recovery batch', () => {
    it('VALID: {failed-ward recovery: one spiritmender + one siegemaster ready} => returns ONLY the spiritmender, never the siegemaster', () => {
      selectBatchLayerBrokerProxy();
      const spirit = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'eee11111-1111-4222-9333-444444444444' }),
        role: 'spiritmender',
      });
      const siege = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'eee22222-1111-4222-9333-444444444444' }),
        role: 'siegemaster',
      });

      const batch = selectBatchLayerBroker({ ready: [spirit, siege] });

      expect(batch).toStrictEqual([spirit]);
    });

    it('VALID: {three spiritmenders + one siegemaster ready} => returns ALL three spiritmenders in one batch, never the siegemaster', () => {
      selectBatchLayerBrokerProxy();
      const spiritA = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'eee33333-1111-4222-9333-444444444444' }),
        role: 'spiritmender',
      });
      const spiritB = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'eee44444-1111-4222-9333-444444444444' }),
        role: 'spiritmender',
      });
      const spiritC = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'eee55555-1111-4222-9333-444444444444' }),
        role: 'spiritmender',
      });
      const siege = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'eee66666-1111-4222-9333-444444444444' }),
        role: 'siegemaster',
      });

      const batch = selectBatchLayerBroker({ ready: [spiritA, spiritB, spiritC, siege] });

      expect(batch).toStrictEqual([spiritA, spiritB, spiritC]);
    });

    it('VALID: {single siegemaster ready (no spiritmenders)} => returns the siegemaster via single-item fallback', () => {
      selectBatchLayerBrokerProxy();
      const siege = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'eee77777-1111-4222-9333-444444444444' }),
        role: 'siegemaster',
      });

      const batch = selectBatchLayerBroker({ ready: [siege] });

      expect(batch).toStrictEqual([siege]);
    });
  });

  describe('pathseeker-corrections batch (dedup + assertion-correctness)', () => {
    it('VALID: {dedup + assertion-correctness both ready} => returns BOTH in one batch', () => {
      selectBatchLayerBrokerProxy();
      const dedup = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'bbb11111-1111-4222-9333-444444444444' }),
        role: 'pathseeker-dedup',
      });
      const assertion = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'bbb22222-1111-4222-9333-444444444444' }),
        role: 'pathseeker-assertion-correctness',
      });

      const batch = selectBatchLayerBroker({ ready: [dedup, assertion] });

      expect(batch).toStrictEqual([dedup, assertion]);
    });

    it('VALID: {only dedup ready (assertion not ready yet)} => returns only dedup as solo batch', () => {
      selectBatchLayerBrokerProxy();
      const dedup = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'bbb11111-1111-4222-9333-444444444444' }),
        role: 'pathseeker-dedup',
      });

      const batch = selectBatchLayerBroker({ ready: [dedup] });

      expect(batch).toStrictEqual([dedup]);
    });

    it('VALID: {only assertion-correctness ready (dedup not ready yet)} => returns only assertion as solo batch', () => {
      selectBatchLayerBrokerProxy();
      const assertion = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'bbb22222-1111-4222-9333-444444444444' }),
        role: 'pathseeker-assertion-correctness',
      });

      const batch = selectBatchLayerBroker({ ready: [assertion] });

      expect(batch).toStrictEqual([assertion]);
    });
  });
});

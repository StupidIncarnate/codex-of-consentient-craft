import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { qaOffMapProbeStatics } from '@dungeonmaster/shared/statics';

import { workPlanQuestUnitIdsTransformer } from './work-plan-quest-unit-ids-transformer';

const OFF_MAP_FAMILIES = Object.keys(qaOffMapProbeStatics.byFamily);

describe('workPlanQuestUnitIdsTransformer', () => {
  describe('single flow', () => {
    it('VALID: {one flow with a terminal, a branch and an observable} => returns every id that flow enumerates', () => {
      const flow = FlowStub({
        id: 'flow-send',
        nodes: [
          FlowNodeStub({
            id: 'scan-finds-every-path',
            label: 'Scan finds every path',
            observables: [FlowObservableStub({ id: 'scan-finds-every-path' })],
          }),
          FlowNodeStub({ id: 'forward-unchanged', label: 'Forward unchanged' }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'scan-to-forward',
            from: 'scan-finds-every-path',
            to: 'forward-unchanged',
            label: 'no match',
          }),
        ],
      });
      const quest = QuestStub({ flows: [flow] });

      expect(
        workPlanQuestUnitIdsTransformer({ quest }).map((unitId) => String(unitId)),
      ).toStrictEqual([
        'flow-send:terminal:forward-unchanged',
        'flow-send:branch:scan-to-forward',
        'flow-send:observable:scan-finds-every-path',
        ...OFF_MAP_FAMILIES.map((family) => `flow-send:off-map:${family}`),
      ]);
    });
  });

  describe('several flows', () => {
    it('VALID: {two flows} => returns the union of both flows’ ids, not just the first', () => {
      const flowSend = FlowStub({
        id: 'flow-send',
        nodes: [FlowNodeStub({ id: 'forward-unchanged', label: 'Forward unchanged' })],
        edges: [],
      });
      const flowReceive = FlowStub({
        id: 'flow-receive',
        nodes: [FlowNodeStub({ id: 'inbox-updated', label: 'Inbox updated' })],
        edges: [],
      });
      const quest = QuestStub({ flows: [flowSend, flowReceive] });

      const ids = workPlanQuestUnitIdsTransformer({ quest }).map((unitId) => String(unitId));

      expect(ids).toStrictEqual([
        'flow-send:terminal:forward-unchanged',
        ...OFF_MAP_FAMILIES.map((family) => `flow-send:off-map:${family}`),
        'flow-receive:terminal:inbox-updated',
        ...OFF_MAP_FAMILIES.map((family) => `flow-receive:off-map:${family}`),
      ]);
    });
  });

  describe('empty quest', () => {
    it('EMPTY: {quest with no flows} => returns an empty list', () => {
      const quest = QuestStub({ flows: [] });

      expect(workPlanQuestUnitIdsTransformer({ quest })).toStrictEqual([]);
    });
  });
});

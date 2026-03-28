import {
  DependencyStepStub,
  FlowIdStub,
  FlowStub,
  QuestStub,
  RelatedDataItemStub,
  StepIdStub,
  WardResultStub,
} from '@dungeonmaster/shared/contracts';

import { resolveRelatedDataItemTransformer } from './resolve-related-data-item-transformer';

describe('resolveRelatedDataItemTransformer', () => {
  describe('steps collection', () => {
    it('VALID: {ref: "steps/uuid", quest with matching step} => returns step', () => {
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId });
      const quest = QuestStub({ steps: [step] });
      const ref = RelatedDataItemStub({
        value: `steps/${String(stepId)}`,
      });

      const result = resolveRelatedDataItemTransformer({ ref, quest });

      expect(result.collection).toBe('steps');
      expect(result.id).toBe(String(stepId));
      expect(result.item).toStrictEqual(step);
    });

    it('ERROR: {ref: "steps/unknown-id"} => throws step not found', () => {
      const quest = QuestStub({ steps: [] });
      const ref = RelatedDataItemStub({
        value: 'steps/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });

      expect(() => resolveRelatedDataItemTransformer({ ref, quest })).toThrow(
        /Step a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d not found/u,
      );
    });
  });

  describe('wardResults collection', () => {
    it('VALID: {ref: "wardResults/uuid", quest with matching wardResult} => returns wardResult', () => {
      const wardResult = WardResultStub({
        id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
        exitCode: 1,
      });
      const quest = QuestStub({ wardResults: [wardResult] });
      const ref = RelatedDataItemStub({
        value: 'wardResults/b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = resolveRelatedDataItemTransformer({ ref, quest });

      expect(result.collection).toBe('wardResults');
      expect(result.id).toBe('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e');
      expect(result.item).toStrictEqual(wardResult);
    });

    it('ERROR: {ref: "wardResults/unknown-id"} => throws wardResult not found', () => {
      const quest = QuestStub({ wardResults: [] });
      const ref = RelatedDataItemStub({
        value: 'wardResults/b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      expect(() => resolveRelatedDataItemTransformer({ ref, quest })).toThrow(
        /WardResult b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e not found/u,
      );
    });
  });

  describe('flows collection', () => {
    it('VALID: {ref: "flows/flow-id", quest with matching flow} => returns flow', () => {
      const flowId = FlowIdStub({ value: 'login-flow' });
      const flow = FlowStub({ id: flowId });
      const quest = QuestStub({ flows: [flow] });
      const ref = RelatedDataItemStub({
        value: `flows/${String(flowId)}`,
      });

      const result = resolveRelatedDataItemTransformer({ ref, quest });

      expect(result.collection).toBe('flows');
      expect(result.id).toBe(String(flowId));
      expect(result.item).toStrictEqual(flow);
    });

    it('ERROR: {ref: "flows/unknown-id"} => throws flow not found', () => {
      const quest = QuestStub({ flows: [] });
      const ref = RelatedDataItemStub({
        value: 'flows/nonexistent-flow',
      });

      expect(() => resolveRelatedDataItemTransformer({ ref, quest })).toThrow(
        /Flow nonexistent-flow not found/u,
      );
    });
  });
});

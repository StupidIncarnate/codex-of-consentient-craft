import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { QuestBlueprintStub } from '../../../contracts/quest-blueprint/quest-blueprint.stub';
import { buildHydrateInputLayerBroker } from './build-hydrate-input-layer-broker';
import { buildHydrateInputLayerBrokerProxy } from './build-hydrate-input-layer-broker.proxy';

const QUEST_ID = QuestIdStub({ value: '00000000-0000-0000-0000-000000000000' });

describe('buildHydrateInputLayerBroker', () => {
  describe('empty strategy statuses', () => {
    it('VALID: {toStatus: flows_approved} => returns only questId and status (no blueprint fields)', () => {
      buildHydrateInputLayerBrokerProxy();
      const blueprint = QuestBlueprintStub();

      const result = buildHydrateInputLayerBroker({
        blueprint,
        toStatus: 'flows_approved',
        questId: QUEST_ID,
      });

      expect(result).toStrictEqual({ questId: QUEST_ID, status: 'flows_approved' });
    });

    it('VALID: {toStatus: seek_scope} => returns only questId and status', () => {
      buildHydrateInputLayerBrokerProxy();
      const blueprint = QuestBlueprintStub();

      const result = buildHydrateInputLayerBroker({
        blueprint,
        toStatus: 'seek_scope',
        questId: QUEST_ID,
      });

      expect(result).toStrictEqual({ questId: QUEST_ID, status: 'seek_scope' });
    });
  });

  describe('non-hydrator statuses (strategy is null)', () => {
    it('VALID: {toStatus: complete} => returns only questId and status', () => {
      buildHydrateInputLayerBrokerProxy();
      const blueprint = QuestBlueprintStub();

      const result = buildHydrateInputLayerBroker({
        blueprint,
        toStatus: 'complete',
        questId: QUEST_ID,
      });

      expect(result).toStrictEqual({ questId: QUEST_ID, status: 'complete' });
    });
  });

  describe('blueprint field forwarding', () => {
    it('VALID: {toStatus: review_flows} => includes flows (stripped) + designDecisions', () => {
      buildHydrateInputLayerBrokerProxy();
      const blueprint = QuestBlueprintStub();

      const result = buildHydrateInputLayerBroker({
        blueprint,
        toStatus: 'review_flows',
        questId: QUEST_ID,
      });

      expect(result).toStrictEqual({
        questId: QUEST_ID,
        status: 'review_flows',
        designDecisions: blueprint.designDecisions,
        flows: blueprint.flows,
      });
    });

    it('VALID: {toStatus: in_progress} => includes steps + planningNotes.reviewReport', () => {
      buildHydrateInputLayerBrokerProxy();
      const blueprint = QuestBlueprintStub();

      const result = buildHydrateInputLayerBroker({
        blueprint,
        toStatus: 'in_progress',
        questId: QUEST_ID,
      });

      expect(result).toStrictEqual({
        questId: QUEST_ID,
        status: 'in_progress',
        steps: blueprint.steps,
        planningNotes: { reviewReport: blueprint.planningNotes.reviewReport },
      });
    });
  });
});

import { OperationItemStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

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

    it('VALID: {toStatus: approved} => returns only questId and status', () => {
      buildHydrateInputLayerBrokerProxy();
      const blueprint = QuestBlueprintStub();

      const result = buildHydrateInputLayerBroker({
        blueprint,
        toStatus: 'approved',
        questId: QUEST_ID,
      });

      expect(result).toStrictEqual({ questId: QUEST_ID, status: 'approved' });
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
    it('VALID: {toStatus: review_flows} => includes flows + designDecisions + packagesAffected', () => {
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
        packagesAffected: blueprint.packagesAffected,
        flows: blueprint.flows,
      });
    });

    // `operations` is deliberately absent: the ledger is off the modify-quest allowlist at every
    // status, so a walk step naming it would be refused outright. A blueprint's authored ledger
    // reaches the quest through questHydrateBroker's direct persist instead.
    it('VALID: {toStatus: explore_observables} => includes contracts + toolingRequirements and never the operations ledger', () => {
      buildHydrateInputLayerBrokerProxy();
      const blueprint = QuestBlueprintStub({
        operations: [OperationItemStub({ role: 'codeweaver', text: 'Build the settings widget' })],
      });

      const result = buildHydrateInputLayerBroker({
        blueprint,
        toStatus: 'explore_observables',
        questId: QUEST_ID,
      });

      expect(result).toStrictEqual({
        questId: QUEST_ID,
        status: 'explore_observables',
        contracts: blueprint.contracts,
        toolingRequirements: blueprint.toolingRequirements,
      });
    });
  });
});

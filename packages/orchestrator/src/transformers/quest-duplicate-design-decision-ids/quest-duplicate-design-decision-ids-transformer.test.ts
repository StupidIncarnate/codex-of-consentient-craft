import { DesignDecisionStub } from '@dungeonmaster/shared/contracts/design-decision/design-decision.stub';

import { questDuplicateDesignDecisionIdsTransformer } from './quest-duplicate-design-decision-ids-transformer';

describe('questDuplicateDesignDecisionIdsTransformer', () => {
  describe('no duplicates', () => {
    it('VALID: {unique ids} => returns []', () => {
      const designDecisions = [
        DesignDecisionStub({ id: 'decision-a' }),
        DesignDecisionStub({ id: 'decision-b' }),
      ];

      const result = questDuplicateDesignDecisionIdsTransformer({ designDecisions });

      expect(result).toStrictEqual([]);
    });
  });

  describe('duplicates present', () => {
    it('INVALID: {two decisions share id} => returns the id', () => {
      const designDecisions = [
        DesignDecisionStub({ id: 'same-decision' }),
        DesignDecisionStub({ id: 'same-decision', title: 'Another' }),
      ];

      const result = questDuplicateDesignDecisionIdsTransformer({ designDecisions });

      expect(result).toStrictEqual(['same-decision']);
    });
  });

  describe('empty', () => {
    it('EMPTY: {designDecisions: undefined} => returns []', () => {
      const result = questDuplicateDesignDecisionIdsTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});

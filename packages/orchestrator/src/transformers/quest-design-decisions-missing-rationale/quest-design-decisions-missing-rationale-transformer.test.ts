import { DesignDecisionStub } from '@dungeonmaster/shared/contracts';

import { questDesignDecisionsMissingRationaleTransformer } from './quest-design-decisions-missing-rationale-transformer';

describe('questDesignDecisionsMissingRationaleTransformer', () => {
  describe('all have rationale', () => {
    it('VALID: {rationale set} => returns []', () => {
      const decision = DesignDecisionStub();

      const result = questDesignDecisionsMissingRationaleTransformer({
        designDecisions: [decision],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('missing rationale', () => {
    it('INVALID: {empty rationale} => returns description', () => {
      const decision = DesignDecisionStub({ id: 'use-jwt' as never });
      Object.assign(decision, { rationale: '' });

      const result = questDesignDecisionsMissingRationaleTransformer({
        designDecisions: [decision],
      });

      expect(result).toStrictEqual(["design decision 'use-jwt' has empty rationale"]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {designDecisions: undefined} => returns []', () => {
      const result = questDesignDecisionsMissingRationaleTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});

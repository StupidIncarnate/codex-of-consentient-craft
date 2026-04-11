import { DesignDecisionStub, DesignDecisionIdStub } from '@dungeonmaster/shared/contracts';

import { questDesignDecisionIdsUniqueGuard } from './quest-design-decision-ids-unique-guard';

describe('questDesignDecisionIdsUniqueGuard', () => {
  describe('unique ids', () => {
    it('VALID: {two decisions with distinct ids} => returns true', () => {
      const designDecisions = [
        DesignDecisionStub({ id: DesignDecisionIdStub({ value: 'use-jwt-auth' }) }),
        DesignDecisionStub({ id: DesignDecisionIdStub({ value: 'use-cookies' }) }),
      ];

      const result = questDesignDecisionIdsUniqueGuard({ designDecisions });

      expect(result).toBe(true);
    });

    it('VALID: {empty decisions array} => returns true', () => {
      const result = questDesignDecisionIdsUniqueGuard({ designDecisions: [] });

      expect(result).toBe(true);
    });
  });

  describe('duplicate ids', () => {
    it('INVALID: {two decisions with same id} => returns false', () => {
      const designDecisions = [
        DesignDecisionStub({ id: DesignDecisionIdStub({ value: 'use-jwt-auth' }) }),
        DesignDecisionStub({ id: DesignDecisionIdStub({ value: 'use-jwt-auth' }) }),
      ];

      const result = questDesignDecisionIdsUniqueGuard({ designDecisions });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {designDecisions: undefined} => returns false', () => {
      const result = questDesignDecisionIdsUniqueGuard({});

      expect(result).toBe(false);
    });
  });
});

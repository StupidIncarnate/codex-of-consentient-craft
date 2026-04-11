import { DesignDecisionStub } from '@dungeonmaster/shared/contracts';

import { questDesignDecisionHasRationaleGuard } from './quest-design-decision-has-rationale-guard';

type DesignDecision = ReturnType<typeof DesignDecisionStub>;

/**
 * Creates a DesignDecision with the rationale field overridden post-parse, so we can inject
 * an empty rationale that bypasses Zod validation.
 */
const createDecisionWithEmptyRationale = (): DesignDecision => {
  const base = DesignDecisionStub();
  return { ...base, rationale: '' } as DesignDecision;
};

describe('questDesignDecisionHasRationaleGuard', () => {
  describe('valid rationales', () => {
    it('VALID: {decision with non-empty rationale} => returns true', () => {
      const designDecisions = [
        DesignDecisionStub({ rationale: 'JWT allows stateless auth with built-in expiration' }),
      ];

      const result = questDesignDecisionHasRationaleGuard({ designDecisions });

      expect(result).toBe(true);
    });

    it('VALID: {empty decisions array} => returns true', () => {
      const result = questDesignDecisionHasRationaleGuard({ designDecisions: [] });

      expect(result).toBe(true);
    });
  });

  describe('empty rationales', () => {
    it('INVALID: {decision with empty rationale} => returns false', () => {
      const designDecisions = [createDecisionWithEmptyRationale()];

      const result = questDesignDecisionHasRationaleGuard({ designDecisions });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {designDecisions: undefined} => returns false', () => {
      const result = questDesignDecisionHasRationaleGuard({});

      expect(result).toBe(false);
    });
  });
});

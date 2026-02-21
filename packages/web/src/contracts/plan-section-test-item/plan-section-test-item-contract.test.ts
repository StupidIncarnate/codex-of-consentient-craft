import { planSectionTestItemContract } from './plan-section-test-item-contract';
import { PlanSectionTestItemStub } from './plan-section-test-item.stub';

describe('planSectionTestItemContract', () => {
  describe('valid inputs', () => {
    it('VALID: {text: "step-a"} => parses test item', () => {
      const result = planSectionTestItemContract.parse({ text: 'step-a' });

      expect(result).toStrictEqual({ text: 'step-a' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {text: ""} => throws for empty text', () => {
      expect(() => planSectionTestItemContract.parse({ text: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => planSectionTestItemContract.parse(null)).toThrow(/Expected object/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid test item', () => {
      const result = PlanSectionTestItemStub();

      expect(result).toStrictEqual({ text: 'step-a' });
    });

    it('VALID: {text: "step-b"} => creates item with custom text', () => {
      const result = PlanSectionTestItemStub({ text: 'step-b' });

      expect(result).toStrictEqual({ text: 'step-b' });
    });
  });
});

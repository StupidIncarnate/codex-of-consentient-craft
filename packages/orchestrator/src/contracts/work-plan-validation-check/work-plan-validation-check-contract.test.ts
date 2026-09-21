import { workPlanValidationCheckContract } from './work-plan-validation-check-contract';
import { WorkPlanValidationCheckStub } from './work-plan-validation-check.stub';

describe('workPlanValidationCheckContract', () => {
  describe('valid checks', () => {
    it('VALID: {value: 1} => parses successfully', () => {
      const check = WorkPlanValidationCheckStub({ value: 1 });

      const result = workPlanValidationCheckContract.parse(check);

      expect(result).toBe(1);
    });

    it('VALID: {value: 19} => parses successfully', () => {
      const check = WorkPlanValidationCheckStub({ value: 19 });

      const result = workPlanValidationCheckContract.parse(check);

      expect(result).toBe(19);
    });
  });

  describe('invalid checks', () => {
    it('INVALID: {value: 0} => throws validation error', () => {
      expect(() => {
        workPlanValidationCheckContract.parse(0);
      }).toThrow(/too_small/u);
    });

    it('INVALID: {value: 20} => throws validation error', () => {
      expect(() => {
        workPlanValidationCheckContract.parse(20);
      }).toThrow(/too_big/u);
    });

    it('INVALID: {value: 1.5} => throws validation error', () => {
      expect(() => {
        workPlanValidationCheckContract.parse(1.5);
      }).toThrow(/integer/u);
    });
  });
});

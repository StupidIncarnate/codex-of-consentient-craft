import { workPlanValidationFailureContract } from './work-plan-validation-failure-contract';
import { WorkPlanValidationFailureStub } from './work-plan-validation-failure.stub';

describe('workPlanValidationFailureContract', () => {
  describe('valid failures', () => {
    it('VALID: {pieceId, check, message} => parses successfully', () => {
      const failure = WorkPlanValidationFailureStub({
        pieceId: 'pc-scan',
        check: 5,
        message: "pc-scan: assigned unit 'flow-send:observable:x' is not in scope",
      });

      const result = workPlanValidationFailureContract.parse(failure);

      expect(result).toStrictEqual({
        pieceId: 'pc-scan',
        check: 5,
        message: "pc-scan: assigned unit 'flow-send:observable:x' is not in scope",
      });
    });
  });

  describe('invalid failures', () => {
    it('INVALID: {message: ""} => throws validation error', () => {
      expect(() => {
        workPlanValidationFailureContract.parse({
          pieceId: 'pc-scan',
          check: 5,
          message: '',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {check: 0} => throws validation error', () => {
      expect(() => {
        workPlanValidationFailureContract.parse({
          pieceId: 'pc-scan',
          check: 0,
          message: 'x',
        });
      }).toThrow(/too_small/u);
    });
  });
});

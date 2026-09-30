import { StepDispatchRoleStub } from './step-dispatch-role.stub';
import { stepDispatchRoleContract } from './step-dispatch-role-contract';

describe('stepDispatchRoleContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = StepDispatchRoleStub();

      expect(stepDispatchRoleContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {prompt: wrong type} => throws', () => {
      expect(() =>
        stepDispatchRoleContract.parse({ ...StepDispatchRoleStub(), prompt: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

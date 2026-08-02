import { getQaChecklistInputContract } from './get-qa-checklist-input-contract';
import { GetQaChecklistInputStub } from './get-qa-checklist-input.stub';

describe('getQaChecklistInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "add-auth"} => parses successfully', () => {
      expect(getQaChecklistInputContract.parse(GetQaChecklistInputStub())).toStrictEqual({
        questId: 'add-auth',
      });
    });

    it('VALID: {questId, flowId} => parses the flow-scoped form', () => {
      expect(
        getQaChecklistInputContract.parse(
          GetQaChecklistInputStub({ questId: 'add-auth', flowId: 'login-flow' }),
        ),
      ).toStrictEqual({ questId: 'add-auth', flowId: 'login-flow' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => getQaChecklistInputContract.parse({ questId: '' })).toThrow(/too_small/u);
    });

    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => getQaChecklistInputContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {flowId: ""} => throws validation error', () => {
      expect(() => getQaChecklistInputContract.parse({ questId: 'add-auth', flowId: '' })).toThrow(
        /too_small/u,
      );
    });

    it('INVALID: {unknown key} => throws Unrecognized key error', () => {
      expect(() =>
        getQaChecklistInputContract.parse({ questId: 'add-auth', stage: 'spec' } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});

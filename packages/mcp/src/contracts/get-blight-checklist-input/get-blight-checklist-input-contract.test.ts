import { getBlightChecklistInputContract } from './get-blight-checklist-input-contract';
import { GetBlightChecklistInputStub } from './get-blight-checklist-input.stub';

describe('getBlightChecklistInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "add-auth"} => parses successfully', () => {
      expect(getBlightChecklistInputContract.parse(GetBlightChecklistInputStub())).toStrictEqual({
        questId: 'add-auth',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => getBlightChecklistInputContract.parse({ questId: '' })).toThrow(/too_small/u);
    });

    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => getBlightChecklistInputContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {unknown key} => throws Unrecognized key error, no flowId sub-scope exists', () => {
      expect(() =>
        getBlightChecklistInputContract.parse({
          questId: 'add-auth',
          flowId: 'login-flow',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});

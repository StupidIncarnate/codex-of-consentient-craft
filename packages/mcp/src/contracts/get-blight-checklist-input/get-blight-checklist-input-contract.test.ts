import { getBlightChecklistInputContract } from './get-blight-checklist-input-contract';
import { GetBlightChecklistInputStub } from './get-blight-checklist-input.stub';

describe('getBlightChecklistInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "add-auth"} => parses successfully', () => {
      expect(getBlightChecklistInputContract.parse(GetBlightChecklistInputStub())).toStrictEqual({
        questId: 'add-auth',
      });
    });

    // Blightscout's prompt tells it to pass this on every call, and the signal-back completion gate
    // measures its remainder with the same scope. A schema that rejected it left the role unable to
    // read the set it is graded on.
    it("VALID: {questId, scope: 'commit'} => parses, so the one-commit call the prompt mandates is accepted", () => {
      expect(
        getBlightChecklistInputContract.parse(
          GetBlightChecklistInputStub({ questId: 'add-auth', scope: 'commit' }),
        ),
      ).toStrictEqual({ questId: 'add-auth', scope: 'commit' });
    });

    it("VALID: {questId, scope: 'quest'} => parses the whole-diff scope explicitly", () => {
      expect(
        getBlightChecklistInputContract.parse(
          GetBlightChecklistInputStub({ questId: 'add-auth', scope: 'quest' }),
        ),
      ).toStrictEqual({ questId: 'add-auth', scope: 'quest' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => getBlightChecklistInputContract.parse({ questId: '' })).toThrow(/too_small/u);
    });

    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => getBlightChecklistInputContract.parse({})).toThrow(/Required/u);
    });

    it("INVALID: {scope: 'branch'} => throws, the only two diffs are the quest's and the last commit's", () => {
      expect(() =>
        getBlightChecklistInputContract.parse({ questId: 'add-auth', scope: 'branch' } as never),
      ).toThrow(/Invalid enum value/u);
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

import { getQuestSummaryInputContract } from './get-quest-summary-input-contract';
import { GetQuestSummaryInputStub } from './get-quest-summary-input.stub';

describe('getQuestSummaryInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "add-auth"} => parses successfully', () => {
      expect(getQuestSummaryInputContract.parse(GetQuestSummaryInputStub())).toStrictEqual({
        questId: 'add-auth',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => getQuestSummaryInputContract.parse({ questId: '' })).toThrow(/too_small/u);
    });

    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => getQuestSummaryInputContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {flowId} => throws Unrecognized key, the summary is whole-quest by design', () => {
      expect(() =>
        getQuestSummaryInputContract.parse({
          questId: 'add-auth',
          flowId: 'login-flow',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });

    it('INVALID: {track: flowrider} => throws Unrecognized key, both tracks always render', () => {
      expect(() =>
        getQuestSummaryInputContract.parse({
          questId: 'add-auth',
          track: 'flowrider',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});

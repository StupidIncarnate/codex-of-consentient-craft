import { questFollowupStopResultContract } from './quest-followup-stop-result-contract';
import { QuestFollowupStopResultStub } from './quest-followup-stop-result.stub';

describe('questFollowupStopResultContract', () => {
  describe('valid results', () => {
    it('VALID: {stopped: true} => parses successfully', () => {
      const result = questFollowupStopResultContract.parse(
        QuestFollowupStopResultStub({ stopped: true }),
      );

      expect(result).toStrictEqual({ stopped: true });
    });

    it('VALID: {stopped: false} => parses successfully', () => {
      const result = questFollowupStopResultContract.parse(
        QuestFollowupStopResultStub({ stopped: false }),
      );

      expect(result).toStrictEqual({ stopped: false });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {stopped: "yes"} => throws validation error', () => {
      expect(() => questFollowupStopResultContract.parse({ stopped: 'yes' })).toThrow(/stopped/u);
    });

    it('INVALID: {missing stopped} => throws validation error', () => {
      expect(() => questFollowupStopResultContract.parse({})).toThrow(/stopped/u);
    });
  });
});

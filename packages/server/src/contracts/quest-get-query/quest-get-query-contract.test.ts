import { questGetQueryContract } from './quest-get-query-contract';
import { QuestGetQueryStub } from './quest-get-query.stub';

describe('questGetQueryContract', () => {
  describe('valid inputs', () => {
    it('VALID: {} => parses to empty stage', () => {
      const result = QuestGetQueryStub({});

      expect(result.stage).toBe(undefined);
    });

    it('VALID: {stage: "spec"} => parses to typed stage', () => {
      const result = questGetQueryContract.parse({ stage: 'spec' });

      expect(result.stage).toBe('spec');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {stage: "bogus"} => throws validation error', () => {
      expect(() => {
        questGetQueryContract.parse({ stage: 'bogus' });
      }).toThrow(/Invalid enum value/u);
    });
  });
});

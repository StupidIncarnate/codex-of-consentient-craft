import { questMergeResultContract } from './quest-merge-result-contract';
import { QuestMergeResultStub } from './quest-merge-result.stub';

describe('questMergeResultContract', () => {
  describe('valid results', () => {
    it('VALID: {merging: true} => parses successfully', () => {
      const result = questMergeResultContract.parse(QuestMergeResultStub({ merging: true }));

      expect(result).toStrictEqual({ merging: true });
    });

    it('VALID: {merging: false} => parses successfully', () => {
      const result = questMergeResultContract.parse(QuestMergeResultStub({ merging: false }));

      expect(result).toStrictEqual({ merging: false });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {merging: "yes"} => throws validation error', () => {
      expect(() => questMergeResultContract.parse({ merging: 'yes' })).toThrow(/merging/u);
    });

    it('INVALID: {missing merging} => throws validation error', () => {
      expect(() => questMergeResultContract.parse({})).toThrow(/merging/u);
    });
  });
});

import { questAbandonResultContract } from './quest-abandon-result-contract';
import { QuestAbandonResultStub } from './quest-abandon-result.stub';

describe('questAbandonResultContract', () => {
  describe('valid results', () => {
    it('VALID: {abandoned: true} => parses successfully', () => {
      const result = questAbandonResultContract.parse(QuestAbandonResultStub({ abandoned: true }));

      expect(result).toStrictEqual({ abandoned: true });
    });

    it('VALID: {abandoned: false} => parses successfully', () => {
      const result = questAbandonResultContract.parse(QuestAbandonResultStub({ abandoned: false }));

      expect(result).toStrictEqual({ abandoned: false });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {abandoned: "yes"} => throws validation error', () => {
      expect(() => questAbandonResultContract.parse({ abandoned: 'yes' })).toThrow(/abandoned/u);
    });

    it('INVALID: {missing abandoned} => throws validation error', () => {
      expect(() => questAbandonResultContract.parse({})).toThrow(/abandoned/u);
    });
  });
});

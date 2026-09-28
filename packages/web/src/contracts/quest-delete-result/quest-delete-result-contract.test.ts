import { questDeleteResultContract } from './quest-delete-result-contract';
import { QuestDeleteResultStub } from './quest-delete-result.stub';

describe('questDeleteResultContract', () => {
  describe('valid results', () => {
    it('VALID: {deleted: true} => parses successfully', () => {
      const result = questDeleteResultContract.parse(QuestDeleteResultStub({ deleted: true }));

      expect(result).toStrictEqual({ deleted: true });
    });

    it('VALID: {deleted: false} => parses successfully', () => {
      const result = questDeleteResultContract.parse(QuestDeleteResultStub({ deleted: false }));

      expect(result).toStrictEqual({ deleted: false });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {deleted: "yes"} => throws validation error', () => {
      expect(() => questDeleteResultContract.parse({ deleted: 'yes' })).toThrow(/deleted/u);
    });

    it('INVALID: {missing deleted} => throws validation error', () => {
      expect(() => questDeleteResultContract.parse({})).toThrow(/deleted/u);
    });
  });
});

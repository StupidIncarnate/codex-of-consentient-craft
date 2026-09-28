import { questClarifyResultContract } from './quest-clarify-result-contract';
import { QuestClarifyResultStub } from './quest-clarify-result.stub';

describe('questClarifyResultContract', () => {
  describe('valid results', () => {
    it('VALID: {chatProcessId} => parses successfully', () => {
      const result = questClarifyResultContract.parse(QuestClarifyResultStub());

      expect(result).toStrictEqual({ chatProcessId: 'clarify-proc-1' });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {chatProcessId: ""} => throws validation error', () => {
      expect(() => questClarifyResultContract.parse({ chatProcessId: '' })).toThrow(/too_small/u);
    });

    it('INVALID: {chatProcessId: 12345} => throws validation error', () => {
      expect(() => questClarifyResultContract.parse({ chatProcessId: 12345 })).toThrow(
        /expected string/u,
      );
    });

    it('INVALID: {missing chatProcessId} => throws validation error', () => {
      expect(() => questClarifyResultContract.parse({})).toThrow(/chatProcessId/u);
    });
  });
});

import { questPauseResultContract } from './quest-pause-result-contract';
import { QuestPauseResultStub } from './quest-pause-result.stub';

describe('questPauseResultContract', () => {
  describe('valid results', () => {
    it('VALID: {paused: true} => parses successfully', () => {
      const result = questPauseResultContract.parse(QuestPauseResultStub({ paused: true }));

      expect(result).toStrictEqual({ paused: true });
    });

    it('VALID: {paused: false} => parses successfully', () => {
      const result = questPauseResultContract.parse(QuestPauseResultStub({ paused: false }));

      expect(result).toStrictEqual({ paused: false });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {paused: "yes"} => throws validation error', () => {
      expect(() => questPauseResultContract.parse({ paused: 'yes' })).toThrow(/paused/u);
    });

    it('INVALID: {missing paused} => throws validation error', () => {
      expect(() => questPauseResultContract.parse({})).toThrow(/paused/u);
    });
  });
});

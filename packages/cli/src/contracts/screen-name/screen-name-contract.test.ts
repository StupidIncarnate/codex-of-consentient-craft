import { screenNameContract } from './screen-name-contract';
import { ScreenNameStub } from './screen-name.stub';

describe('screenNameContract', () => {
  describe('valid screen names', () => {
    it('VALID: {non-empty string} => parses successfully', () => {
      const name = ScreenNameStub({ value: 'AnswerScreen' });

      const result = screenNameContract.parse(name);

      expect(result).toBe('AnswerScreen');
    });

    it('VALID: {default stub} => parses successfully', () => {
      const name = ScreenNameStub();

      const result = screenNameContract.parse(name);

      expect(result).toBe('MainScreen');
    });
  });

  describe('invalid screen names', () => {
    it('INVALID: {empty string} => throws validation error', () => {
      expect(() => {
        screenNameContract.parse('');
      }).toThrow(/too_small/u);
    });
  });
});

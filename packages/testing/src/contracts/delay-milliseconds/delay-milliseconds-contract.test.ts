import { delayMillisecondsContract } from './delay-milliseconds-contract';
import { DelayMillisecondsStub } from './delay-milliseconds.stub';

describe('delayMillisecondsContract', () => {
  describe('valid delays', () => {
    it('VALID: {value: 0} => parses no delay', () => {
      const delay = DelayMillisecondsStub({ value: 0 });

      const result = delayMillisecondsContract.parse(delay);

      expect(result).toBe(0);
    });

    it('VALID: {value: 1000} => parses 1 second delay', () => {
      const delay = DelayMillisecondsStub({ value: 1000 });

      const result = delayMillisecondsContract.parse(delay);

      expect(result).toBe(1000);
    });

    it('VALID: {value: 31000} => parses timeout delay', () => {
      const delay = DelayMillisecondsStub({ value: 31000 });

      const result = delayMillisecondsContract.parse(delay);

      expect(result).toBe(31000);
    });
  });

  describe('invalid delays', () => {
    it('INVALID_DELAY: {value: -1} => throws validation error for negative', () => {
      expect(() => {
        return delayMillisecondsContract.parse(-1);
      }).toThrow(/too_small|minimum/iu);
    });

    it('INVALID_DELAY: {value: 1.5} => throws validation error for non-integer', () => {
      expect(() => {
        return delayMillisecondsContract.parse(1.5);
      }).toThrow(/integer/iu);
    });

    it('INVALID_DELAY: {value: "1000"} => throws validation error for string', () => {
      expect(() => {
        return delayMillisecondsContract.parse('1000' as never);
      }).toThrow(/number/iu);
    });
  });
});

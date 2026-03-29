import { configIndexContract } from './config-index-contract';
import { ConfigIndexStub } from './config-index.stub';

describe('configIndexContract', () => {
  describe('valid indices', () => {
    it('VALID: {value: 0} => parses zero index', () => {
      const result = configIndexContract.parse(ConfigIndexStub({ value: 0 }));

      expect(result).toBe(0);
    });

    it('VALID: {value: 5} => parses positive index', () => {
      const result = configIndexContract.parse(ConfigIndexStub({ value: 5 }));

      expect(result).toBe(5);
    });
  });

  describe('invalid indices', () => {
    it('INVALID: {value: -1} => throws validation error', () => {
      expect(() => configIndexContract.parse(-1)).toThrow(/too_small/u);
    });
  });
});

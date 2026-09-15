import { processGroupIdContract } from './process-group-id-contract';
import { ProcessGroupIdStub } from './process-group-id.stub';

describe('processGroupIdContract', () => {
  describe('valid values', () => {
    it('VALID: {value: 4821} => parses successfully', () => {
      const value = ProcessGroupIdStub({ value: 4821 });

      const result = processGroupIdContract.parse(value);

      expect(result).toBe(4821);
    });
  });

  describe('edge values', () => {
    it('EDGE: {value: 1} => parses the minimum positive pgid', () => {
      const value = ProcessGroupIdStub({ value: 1 });

      const result = processGroupIdContract.parse(value);

      expect(result).toBe(1);
    });
  });

  describe('invalid values', () => {
    it('INVALID: {value: 0} => throws validation error', () => {
      expect(() => processGroupIdContract.parse(0)).toThrow(/too_small/u);
    });

    it('INVALID: {value: -1} => throws validation error', () => {
      expect(() => processGroupIdContract.parse(-1)).toThrow(/too_small/u);
    });

    it('INVALID: {value: 3.5} => throws validation error', () => {
      expect(() => processGroupIdContract.parse(3.5)).toThrow(/integer/u);
    });
  });
});

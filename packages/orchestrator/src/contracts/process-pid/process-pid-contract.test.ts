import { processPidContract } from './process-pid-contract';
import { ProcessPidStub } from './process-pid.stub';

describe('processPidContract', () => {
  describe('valid values', () => {
    it('VALID: {positive integer} => parses successfully', () => {
      const value = ProcessPidStub({ value: 12345 });

      const result = processPidContract.parse(value);

      expect(result).toBe(12345);
    });

    it('VALID: {minimum pid 1} => parses successfully', () => {
      const value = ProcessPidStub({ value: 1 });

      const result = processPidContract.parse(value);

      expect(result).toBe(1);
    });
  });

  describe('invalid values', () => {
    it('INVALID: {zero} => throws validation error', () => {
      expect(() => {
        processPidContract.parse(0);
      }).toThrow(/too_small/u);
    });

    it('INVALID: {negative number} => throws validation error', () => {
      expect(() => {
        processPidContract.parse(-1);
      }).toThrow(/too_small/u);
    });

    it('INVALID: {decimal number} => throws validation error', () => {
      expect(() => {
        processPidContract.parse(1.5);
      }).toThrow(/integer/u);
    });
  });
});

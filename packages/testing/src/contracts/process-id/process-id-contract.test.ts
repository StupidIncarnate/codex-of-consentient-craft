import { processIdContract } from './process-id-contract';
import { ProcessIdStub } from './process-id.stub';

describe('processIdContract', () => {
  describe('valid process IDs', () => {
    it('VALID: {value: 12345} => parses typical process ID', () => {
      const pid = ProcessIdStub({ value: 12345 });

      const result = processIdContract.parse(pid);

      expect(result).toBe(12345);
    });

    it('VALID: {value: 0} => parses init process ID', () => {
      const pid = ProcessIdStub({ value: 0 });

      const result = processIdContract.parse(pid);

      expect(result).toBe(0);
    });

    it('VALID: {value: 1} => parses PID 1', () => {
      const pid = ProcessIdStub({ value: 1 });

      const result = processIdContract.parse(pid);

      expect(result).toBe(1);
    });
  });

  describe('invalid process IDs', () => {
    it('INVALID_PROCESS_ID: {value: -1} => throws validation error for negative', () => {
      expect(() => {
        return processIdContract.parse(-1);
      }).toThrow(/greater than or equal to 0/iu);
    });

    it('INVALID_PROCESS_ID: {value: 1.5} => throws validation error for non-integer', () => {
      expect(() => {
        return processIdContract.parse(1.5);
      }).toThrow(/integer/iu);
    });

    it('INVALID_PROCESS_ID: {value: "123"} => throws validation error for string', () => {
      expect(() => {
        return processIdContract.parse('123' as never);
      }).toThrow(/number/iu);
    });
  });
});

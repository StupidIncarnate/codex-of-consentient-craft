import { exitCodeContract } from './exit-code-contract';
import { ExitCodeStub } from './exit-code.stub';

describe('exitCodeContract', () => {
  describe('valid exit codes', () => {
    it('VALID: {value: 0} => parses success exit code', () => {
      const exitCode = ExitCodeStub({ value: 0 });

      const result = exitCodeContract.parse(exitCode);

      expect(result).toBe(0);
    });

    it('VALID: {value: 1} => parses error exit code', () => {
      const exitCode = ExitCodeStub({ value: 1 });

      const result = exitCodeContract.parse(exitCode);

      expect(result).toBe(1);
    });

    it('VALID: {value: 2} => parses ESLint crash code', () => {
      const exitCode = ExitCodeStub({ value: 2 });

      const result = exitCodeContract.parse(exitCode);

      expect(result).toBe(2);
    });
  });

  describe('invalid exit codes', () => {
    it('INVALID_EXIT_CODE: {value: 1.5} => throws validation error for non-integer', () => {
      expect(() => {
        return exitCodeContract.parse(1.5);
      }).toThrow(/integer/iu);
    });

    it('INVALID_EXIT_CODE: {value: "0"} => throws validation error for string', () => {
      expect(() => {
        return exitCodeContract.parse('0' as never);
      }).toThrow(/number/iu);
    });
  });
});

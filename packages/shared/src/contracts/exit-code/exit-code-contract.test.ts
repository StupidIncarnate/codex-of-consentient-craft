import { exitCodeContract } from './exit-code-contract';
import { ExitCodeStub } from './exit-code.stub';

describe('exitCodeContract', () => {
  describe('valid exit codes', () => {
    it('VALID: 0 => parses to ExitCode branded type', () => {
      const result = exitCodeContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: 1 => parses to ExitCode branded type', () => {
      const result = exitCodeContract.parse(1);

      expect(result).toBe(1);
    });

    it('VALID: 255 => parses to ExitCode branded type', () => {
      const result = exitCodeContract.parse(255);

      expect(result).toBe(255);
    });

    it('VALID: 127 => parses to ExitCode branded type', () => {
      const result = exitCodeContract.parse(127);

      expect(result).toBe(127);
    });
  });

  describe('invalid exit codes', () => {
    it('ERROR: -1 => throws validation error', () => {
      expect(() => exitCodeContract.parse(-1)).toThrow('Number must be greater than or equal to 0');
    });

    it('ERROR: 256 => throws validation error', () => {
      expect(() => exitCodeContract.parse(256)).toThrow('Number must be less than or equal to 255');
    });

    it('ERROR: 1.5 => throws validation error for non-integer', () => {
      expect(() => exitCodeContract.parse(1.5)).toThrow('Expected integer, received float');
    });

    it('ERROR: "0" => throws validation error for string', () => {
      expect(() => exitCodeContract.parse('0')).toThrow('Expected number, received string');
    });
  });

  describe('stub', () => {
    it('VALID: ExitCodeStub() => returns default stub value', () => {
      const result = ExitCodeStub();

      expect(result).toBe(0);
    });

    it('VALID: ExitCodeStub({value: 1}) => returns custom value', () => {
      const result = ExitCodeStub({ value: 1 });

      expect(result).toBe(1);
    });
  });
});

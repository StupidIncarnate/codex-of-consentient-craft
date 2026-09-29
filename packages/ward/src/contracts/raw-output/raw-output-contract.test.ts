import { rawOutputContract } from './raw-output-contract';
import { RawOutputStub } from './raw-output.stub';

describe('rawOutputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stdout, stderr, exitCode: 0} => parses successfully', () => {
      const result = rawOutputContract.parse(
        RawOutputStub({ stdout: 'All checks passed', exitCode: 0 }),
      );

      expect(result).toStrictEqual({
        stdout: 'All checks passed',
        stderr: '',
        exitCode: 0,
        signal: null,
      });
    });

    it('VALID: {exitCode: 1 with stderr} => parses error output', () => {
      const result = rawOutputContract.parse(RawOutputStub({ stderr: 'Error found', exitCode: 1 }));

      expect(result).toStrictEqual({
        stdout: '',
        stderr: 'Error found',
        exitCode: 1,
        signal: null,
      });
    });
  });

  describe('signal', () => {
    it("VALID: {signal: 'SIGKILL'} => parses to itself", () => {
      const result = rawOutputContract.parse({
        stdout: '',
        stderr: '',
        exitCode: 1,
        signal: 'SIGKILL',
      });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 1, signal: 'SIGKILL' });
    });

    it('VALID: {signal: null} => stays null', () => {
      const result = rawOutputContract.parse({ stdout: '', stderr: '', exitCode: 0, signal: null });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0, signal: null });
    });

    it('VALID: {signal absent} => defaults to null', () => {
      const result = rawOutputContract.parse({ stdout: '', stderr: '', exitCode: 0 });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0, signal: null });
    });

    it('INVALID: {signal: ""} => throws validation error', () => {
      expect(() =>
        rawOutputContract.parse({ stdout: '', stderr: '', exitCode: 1, signal: '' }),
      ).toThrow(/Invalid input/u);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {exitCode: "zero"} => throws validation error', () => {
      expect(() =>
        rawOutputContract.parse({
          stdout: '',
          stderr: '',
          exitCode: 'zero',
        }),
      ).toThrow(/expected number/u);
    });

    it('INVALID: {missing all fields} => throws validation error', () => {
      expect(() => rawOutputContract.parse({})).toThrow(/received undefined/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid raw output', () => {
      const result = RawOutputStub();

      expect(result).toStrictEqual({
        stdout: '',
        stderr: '',
        exitCode: 0,
        signal: null,
      });
    });

    it('VALID: {custom values} => creates raw output with overrides', () => {
      const result = RawOutputStub({
        stdout: 'output',
        stderr: 'err',
        exitCode: 2,
        signal: null,
      });

      expect(result).toStrictEqual({
        stdout: 'output',
        stderr: 'err',
        exitCode: 2,
        signal: null,
      });
    });
  });
});

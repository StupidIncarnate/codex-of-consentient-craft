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
      });
    });

    it('VALID: {exitCode: 1 with stderr} => parses error output', () => {
      const result = rawOutputContract.parse(RawOutputStub({ stderr: 'Error found', exitCode: 1 }));

      expect(result).toStrictEqual({
        stdout: '',
        stderr: 'Error found',
        exitCode: 1,
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_EXIT_CODE: {exitCode: "zero"} => throws validation error', () => {
      expect(() =>
        rawOutputContract.parse({
          stdout: '',
          stderr: '',
          exitCode: 'zero' as never,
        }),
      ).toThrow(/Expected number/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => rawOutputContract.parse({})).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid raw output', () => {
      const result = RawOutputStub();

      expect(result).toStrictEqual({
        stdout: '',
        stderr: '',
        exitCode: 0,
      });
    });

    it('VALID: {custom values} => creates raw output with overrides', () => {
      const result = RawOutputStub({
        stdout: 'output',
        stderr: 'err',
        exitCode: 2,
      });

      expect(result).toStrictEqual({
        stdout: 'output',
        stderr: 'err',
        exitCode: 2,
      });
    });
  });
});

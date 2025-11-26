import { execResultContract } from './exec-result-contract';
import { ExecResultStub } from './exec-result.stub';

describe('execResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stdout: "output", stderr: "", exitCode: 0} => parses successfully', () => {
      const result = execResultContract.parse({
        stdout: 'output',
        stderr: '',
        exitCode: 0,
      });

      expect(result).toStrictEqual({
        stdout: 'output',
        stderr: '',
        exitCode: 0,
      });
    });

    it('VALID: stub with defaults => creates valid instance', () => {
      const result = ExecResultStub();

      expect(result).toStrictEqual({
        stdout: 'test output',
        stderr: '',
        exitCode: 0,
      });
    });

    it('VALID: stub with overrides => creates instance with custom values', () => {
      const result = ExecResultStub({
        stdout: 'custom output',
        stderr: 'error message',
        exitCode: 1,
      });

      expect(result).toStrictEqual({
        stdout: 'custom output',
        stderr: 'error message',
        exitCode: 1,
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: missing stdout => throws validation error', () => {
      expect(() =>
        execResultContract.parse({
          stderr: '',
          exitCode: 0,
        }),
      ).toThrow('stdout');
    });

    it('INVALID: missing stderr => throws validation error', () => {
      expect(() =>
        execResultContract.parse({
          stdout: 'output',
          exitCode: 0,
        }),
      ).toThrow('stderr');
    });

    it('INVALID: missing exitCode => throws validation error', () => {
      expect(() =>
        execResultContract.parse({
          stdout: 'output',
          stderr: '',
        }),
      ).toThrow('exitCode');
    });

    it('INVALID: non-integer exitCode => throws validation error', () => {
      expect(() =>
        execResultContract.parse({
          stdout: 'output',
          stderr: '',
          exitCode: 1.5,
        }),
      ).toThrow('integer');
    });
  });
});
